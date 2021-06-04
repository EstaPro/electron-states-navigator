import { app, BrowserWindow, ipcMain as ipc} from 'electron'
import { log } from 'util';

try {
  require('electron-reloader')(module)
} catch (_) {
  log(_);
}


let mainWindow = null;
let stateWindow = null;

app.on('window-all-closed', () => {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

app.on('ready', () => {

  mainWindow = new BrowserWindow({
    width: 1280, 
    height: 700,
    backgroundColor: '#2e2c29',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  mainWindow.loadURL('file://' + __dirname + '/index.html');
  mainWindow.maximize();

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });    
});


ipc.on('db-states-data-fetched', (event, data) => {
  mainWindow.webContents.send('graph-update-states', data);
});

ipc.on('center-triggerd', (event, data) => {
  mainWindow.webContents.send('graph-center-states', data);
});

ipc.on('zoom-in-triggerd', (event) => {
  mainWindow.webContents.send('graph-zoom-in');
});

ipc.on('zoom-out-triggerd', (event) => {
  mainWindow.webContents.send('graph-zoom-out');
});

ipc.on('zoom-all-triggerd', (event) => {
  mainWindow.webContents.send('graph-zoom-all');
});

ipc.on('show-state-info', (event, data) => {
  stateWindow = new BrowserWindow({
    width: 800, 
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    parent: mainWindow,
    modal: true,
  });
  
  stateWindow.loadURL('file://' + __dirname + '/stateModal.html');
  
  stateWindow.webContents.openDevTools();

  stateWindow.on('closed', () => {
    stateWindow = null;
  });

  stateWindow.webContents.send('show-state-info', data);
});





