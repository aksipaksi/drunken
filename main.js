const { app, BrowserWindow, ipcMain, globalShortcut, dialog } = require('electron');
const path = require('path');
const { execFile } = require('child_process');
const { countNewAIMentions } = require('./src/detector');

let mainWindow;
let ocrInterval = null;
let seenLines = new Set();
// In packaged app, extraResources land in process.resourcesPath
// In dev, use the local binary
const OCR_HELPER_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'ocr-helper')
  : path.join(__dirname, 'ocr-helper', 'ocr-helper');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 360,
    height: 700,
    alwaysOnTop: true,
    resizable: true,
    frame: true,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('renderer/index.html');

  // Register global shortcut: Cmd+Shift+A
  globalShortcut.register('CommandOrControl+Shift+A', () => {
    mainWindow.webContents.send('manual-drink');
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (ocrInterval) clearInterval(ocrInterval);
  globalShortcut.unregisterAll();
  app.quit();
});

// OCR scanning
function runOCRScan() {
  return new Promise((resolve, reject) => {
    execFile(OCR_HELPER_PATH, { timeout: 10000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
        return;
      }
      resolve(stdout);
    });
  });
}

// Shared scan function — only counts AI in lines not seen before
async function scan() {
  try {
    const text = await runOCRScan();
    const result = countNewAIMentions(text, seenLines);
    seenLines = result.updatedSeen;

    mainWindow.webContents.send('ocr-scan-result', {
      skipped: false,
      count: result.newCount,
      timestamp: Date.now(),
    });
  } catch (err) {
    mainWindow.webContents.send('ocr-error', err.message);
  }
}

// Start auto-OCR scanning
ipcMain.handle('start-ocr', async (event, intervalMs) => {
  if (ocrInterval) clearInterval(ocrInterval);
  seenLines = new Set();

  await scan();
  ocrInterval = setInterval(scan, intervalMs || 5000);
});

ipcMain.handle('stop-ocr', () => {
  if (ocrInterval) {
    clearInterval(ocrInterval);
    ocrInterval = null;
  }
});

ipcMain.handle('update-ocr-interval', (event, intervalMs) => {
  if (ocrInterval) {
    clearInterval(ocrInterval);
    ocrInterval = setInterval(scan, intervalMs);
  }
});

ipcMain.handle('check-ocr-helper', () => {
  const fs = require('fs');
  return fs.existsSync(OCR_HELPER_PATH);
});
