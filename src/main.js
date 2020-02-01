// Modules to control application life and create native browser window
'use strict';
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;

const wpilib_NT = require('wpilib-nt-client');
const client = new wpilib_NT.Client();

const DEBUG = false;


let connected;
let ready = false;
// var ui = require('./ui')
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var win;

let clientDataListener = (key, val, valType, mesgType, id, flags) => {
  if (val === 'true' || val === 'false') {
      val = val === 'true';
  }
  win.webContents.send(mesgType, {
      key,
      val,
      valType,
      id,
      flags
  });
};


function createWindow () {
  // Create the browser window.
  
  win = new BrowserWindow({
     width: 1539,
    height: 631,
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  });
  win.setPosition(0,0);
  client.start((con, err) => {
    // If the Window is ready than send the connection status to it
    if (ready) {
      win.webContents.send('connected', con);
    } else connected = () => win.webContents.send('connected', con);
});
// When the script starts running in the window set the ready variable
ipc.on('ready', (ev, mesg) => {
    console.log('NetworkTables is ready');
    ready = win != null;

    // Remove old Listener
    client.removeListener(clientDataListener);

    // Add new listener with immediate callback
    client.addListener(clientDataListener, true);

    // Send connection message to the window if if the message is ready
    if (connected) connected();
});
// When the user chooses the address of the bot than try to connect
ipc.on('connect', (ev, address, port) => {

  let callback = (connected, err) => {
      try{
        win.webContents.send('connected', connected); //throws error ere
      } catch(e){return;}
  };
  if (port) {
      client.start(callback, address, port);
  } else {
      client.start(callback, address);
      console.log("connecting to " + address)
  }
});
ipc.on('stop-connect', () => {
  client.stop()
});
ipc.on('add', (ev, mesg) => {
  client.Assign(mesg.val, mesg.key, (mesg.flags & 1) === 1);
});
ipc.on('update', (ev, mesg) => {
  client.Update(mesg.id, mesg.val);
});
ipc.on('delete', (ev, mesg) => {
  client.Delete(mesg.id)
});

  // and load the index.html of the app.
  // win.loadFile('index.html')
  win.loadURL(`file://${__dirname}/index.html`);

  win.once('ready-to-show', () => {
    win.show();
    win.webContents.send('start')
  });//don't show until ready
  win.on('closed', () => { win = null });
  win.setMenuBarVisibility(false);
  process.on('uncaughtException', function (err) {
    console.log(err);
  });

  if(DEBUG){
    win.webContents.openDevTools()
  }

}
app.on('ready', createWindow);


//var child = require("child_process");
//child.exec("\"C:\\\\Program Files\\VideoLAN\\VLC\\vlc.exe\" --network-caching=0 rtsp://admin:frc623frc@ds-2cd2423g0-iw20180425aawrc15020658.local/ISAPI/Streaming/channels/102 --sout-x264-tune=zerolatency --postproc-q=0 --sout-x264-crf=0");


app.on('window-all-closed', function () {
  //fun osx handling - check electron docs for more information
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', function () {
  // Win should be initulized already, but just in case - osx problem again
  if (win === null) {
    createWindow()
  }
});
