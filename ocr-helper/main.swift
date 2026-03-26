import Cocoa
import Vision

// Use screencapture CLI to grab the screen (avoids deprecated CGWindowListCreateImage)
let tempPath = NSTemporaryDirectory() + "drunken-capture.png"
let process = Process()
process.executableURL = URL(fileURLWithPath: "/usr/sbin/screencapture")
process.arguments = ["-x", "-C", "-t", "png", tempPath] // -x = no sound
do {
    try process.run()
    process.waitUntilExit()
} catch {
    fputs("ERROR: screencapture failed: \(error.localizedDescription)\n", stderr)
    exit(1)
}

guard process.terminationStatus == 0 else {
    fputs("ERROR: screencapture exited with status \(process.terminationStatus)\n", stderr)
    exit(1)
}

// Load the captured image
guard let imageData = NSData(contentsOfFile: tempPath),
      let imageSource = CGImageSourceCreateWithData(imageData, nil),
      let cgImage = CGImageSourceCreateImageAtIndex(imageSource, 0, nil) else {
    fputs("ERROR: Could not load captured screenshot\n", stderr)
    exit(1)
}

// Clean up temp file
try? FileManager.default.removeItem(atPath: tempPath)

// Run OCR using Vision framework
let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = true

let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])

do {
    try handler.perform([request])
} catch {
    fputs("ERROR: OCR failed: \(error.localizedDescription)\n", stderr)
    exit(1)
}

guard let observations = request.results else {
    exit(0)
}

for observation in observations {
    if let candidate = observation.topCandidates(1).first {
        print(candidate.string)
    }
}
