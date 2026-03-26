const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  startOCR: (intervalMs) => ipcRenderer.invoke('start-ocr', intervalMs),
  stopOCR: () => ipcRenderer.invoke('stop-ocr'),
  updateOCRInterval: (intervalMs) => ipcRenderer.invoke('update-ocr-interval', intervalMs),
  checkOCRHelper: () => ipcRenderer.invoke('check-ocr-helper'),
  onScanResult: (callback) => ipcRenderer.on('ocr-scan-result', (_, data) => callback(data)),
  onOCRError: (callback) => ipcRenderer.on('ocr-error', (_, msg) => callback(msg)),
  onManualDrink: (callback) => ipcRenderer.on('manual-drink', () => callback()),
});
