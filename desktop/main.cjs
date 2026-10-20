'use strict';

/* Local-only Electron wrapper. This is NOT a browser pointing to pokesurvivor.com. */
const { app, BrowserWindow, Menu, session } = require('electron');
const path = require('node:path');

app.setAppUserModelId('com.ronvotri.pkmsvv');
// Stable localStorage path even when the portable executable is moved.
app.setPath('userData', path.join(app.getPath('appData'), 'PKMSVV-Offline'));

let mainWindow;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 540,
    backgroundColor: '#0a1430',
    title: 'PKMSVV — Offline',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      spellcheck: false
    }
  });
  mainWindow = win;

  // Online content, CDN, Firebase, sockets and other web endpoints are blocked.
  // Local game assets, data: and blob: URLs still work.
  const blocker = ({ url }, done) => {
    done({ cancel: /^(?:https?|wss?):/i.test(url) });
  };
  session.defaultSession.webRequest.onBeforeRequest(blocker);
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (event, target) => {
    if (target !== win.webContents.getURL()) event.preventDefault();
  });
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, '..', 'vendor', 'pokesurvivor', 'index.html'));
  win.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
