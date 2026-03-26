# Drunk**En**

**The LinkedIn AI Drinking Game**

A macOS app that watches your screen for AI buzzwords while you browse LinkedIn, counts each hit as a drink, and tracks your blood alcohol content (BAC) in real time.

Because LinkedIn in 2026 is a non-stop AI buzzword firehose — and now you can measure exactly how drunk it's making you.

---

## The Irony

Yes, this app was entirely vibe-coded by an AI (Claude). An AI built a drinking game that punishes you for seeing AI content. It would detect itself if it could see its own source code.

We considered adding self-awareness, but the BAC readings were already high enough.

---

## Features

- **Auto-OCR scanning** — uses macOS Vision framework to read your screen and detect buzzwords in real time
- **40+ detected terms** — AI, ChatGPT, Claude, vibe coding, agentic, prompt engineering, 10x, "future of work", and more
- **Manual mode** — big "I SAW AI" button (or `Cmd+Shift+A`) for anything the OCR misses
- **Real-time BAC** — Widmark formula with color-coded status (Sober → Buzzed → Tipsy → Drunk → Dangerously drunk)
- **Time-to-sober estimate** — so you know when LinkedIn will finally release you
- **Duplicate suppression** — line-level dedup so scrolling past the same post doesn't double-count
- **Configurable scan interval** — 1s to 30s, because some feeds are worse than others
- **Dark theme floating window** — sits on top of LinkedIn without getting in the way

---

## Download

Grab the latest `.dmg` from [Releases](https://github.com/aksipaksi/drunken/releases).

> **Note:** The app is unsigned. On first launch: right-click → Open → Open to bypass Gatekeeper.

### Requirements

- macOS 12+ (Apple Silicon)
- Screen Recording permission (macOS will prompt on first OCR scan)

---

## Running from Source

```bash
git clone https://github.com/aksipaksi/drunken.git
cd drunken
npm install
npm run build-ocr   # compiles the Swift OCR helper
npm start
```

### Building the DMG

```bash
npm run dist
# Output: dist/DrunkEn-1.0.0-arm64.dmg
```

---

## How BAC Works

Uses the [Widmark formula](https://en.wikipedia.org/wiki/Blood_alcohol_content#Widmark_formula):

```
BAC = (drinks x volume_ml x (abv/100) x 0.789) / (weight_kg x r x 10) - (0.015 x hours)
```

Where `r` = 0.68 (male) / 0.55 (female) and 0.015 = metabolism rate per hour.

| BAC | Status | You should... |
|---|---|---|
| 0.00 | Sober | Open LinkedIn |
| 0.01 - 0.05 | Buzzed | Keep scrolling |
| 0.06 - 0.10 | Tipsy | Maybe close the tab |
| 0.11 - 0.20 | Drunk | Definitely close the tab |
| 0.21+ | Dangerously drunk | You looked at a LinkedIn influencer's page |

---

## Disclaimer

This app is a joke. BAC estimates are approximations only and depend on many individual factors. Do not use this to assess fitness to drive or operate machinery. Drink responsibly.

---

## License

MIT
