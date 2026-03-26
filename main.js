const { app, BrowserWindow, ipcMain, globalShortcut, dialog } = require('electron');
const path = require('path');
const { execFile } = require('child_process');
const { countAIMentions, hashText } = require('./src/detector');

let mainWindow;
let ocrInterval = null;
let lastScreenHash = null;
const OCR_HELPER_PATH = path.join(__dirname, 'ocr-helper', 'ocr-helper');

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

// Start auto-OCR scanning
ipcMain.handle('start-ocr', async (event, intervalMs) => {
  if (ocrInterval) clearInterval(ocrInterval);
  lastScreenHash = null;

  const scan = async () => {
    try {
      const text = await runOCRScan();
      const currentHash = hashText(text);

      if (currentHash === lastScreenHash) {
        // Screen unchanged — skip
        mainWindow.webContents.send('ocr-scan-result', { skipped: true });
        return;
      }

      lastScreenHash = currentHash;
      const count = countAIMentions(text);
      mainWindow.webContents.send('ocr-scan-result', {
        skipped: false,
        count,
        timestamp: Date.now(),
      });
    } catch (err) {
      mainWindow.webContents.send('ocr-error', err.message);
    }
  };

  // Run first scan immediately
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
    const scan = async () => {
      try {
        const text = await runOCRScan();
        const currentHash = hashText(text);
        if (currentHash === lastScreenHash) {
          mainWindow.webContents.send('ocr-scan-result', { skipped: true });
          return;
        }
        lastScreenHash = currentHash;
        const count = countAIMentions(text);
        mainWindow.webContents.send('ocr-scan-result', { skipped: false, count, timestamp: Date.now() });
      } catch (err) {
        mainWindow.webContents.send('ocr-error', err.message);
      }
    };
    ocrInterval = setInterval(scan, intervalMs);
  }
});

ipcMain.handle('check-ocr-helper', () => {
  const fs = require('fs');
  return fs.existsSync(OCR_HELPER_PATH);
});
