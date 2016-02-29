// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import { app, BrowserWindow } from 'electron';
import devHelper from './vendor/electron_boilerplate/dev_helper';
import windowStateKeeper from './vendor/electron_boilerplate/window_state';

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from './env';

var mainWindow;
var transformWindow;

// Preserver of the window size and position between app launches.
var mainWindowState = windowStateKeeper('main', {
    width: 1000,
    height: 600
});

/*
    Noteworthy that this main process is simply for initializing/destructing other windows
    Also it is the msg channel between main window and transform window.
    No actual business logic should never reside in this main process!
*/
app.on('ready', function () {

    /*
    MAIN WINDOW INIT AND BIND 
    */
    mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height
    });

    if (mainWindowState.isMaximized) {
        mainWindow.maximize();
    }

    if (env.name === 'test') {
        mainWindow.loadURL('file://' + __dirname + '/spec.html');
    } else {
        mainWindow.loadURL('file://' + __dirname + '/index.html');
    }

    if (env.name !== 'production') {
        devHelper.setDevMenu();
        mainWindow.openDevTools();
    }

    mainWindow.on('close', function () {
        // When main window is closed, we need to shut down the app
        // Also it may be good practise to shut down transform window before 
        // shutting down the app (although it probably should not make any difference)
        mainWindowState.saveState(mainWindow);
        transformWindow.close(); // Close it too so app runtime knows to close itself!
    });

    /*
    TRANSFORM WINDOW INIT AND BIND 
    */
    transformWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        show: false
    });

    transformWindow.loadURL('file://' + __dirname + '/transform.html');

});

app.on('window-all-closed', function () {
    app.quit();
});
