// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron')
var WiFiControl = require('wifi-control');

//  Initialize wifi-control package with verbose output
WiFiControl.init({
    debug: true
});
var path, node_ssh, ssh, fs

var opn = require('opn')
fs = require('fs')
path = require('path')
node_ssh = require('node-ssh')
ssh = new node_ssh()
var local_networks = []
var ipc = require('ipc');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 800, height: 800})
    var html_string = "Test"
    WiFiControl.scanForWiFi(function (err, response) {
        if (err) console.log(err);
        var ipc = require('electron').ipcRenderer;
        var authButton = document.getElementById('auth-button');
        authButton.addEventListener('click', function () {
            ipc.send('submitbutton', 'someData');
        });
        var networks = response["networks"]
        var html_to_send = "<!DOCTYPE html> <link rel='stylesheet' href='https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css' integrity='sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u' crossorigin='anonymous'> <link rel='stylesheet' href='https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css' integrity='sha384-rHyoN1iRsVXV4nD0JutlnGaslCJuC7uwjduW9SVrLvRYooPp2bWYgmgJQIXwl/Sp' crossorigin='anonymous'> <script src='https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js' integrity='sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa' crossorigin='anonymous'></script>" +
            "<html><div style='height: 100px;width:800px;padding:0;top:0;margin:0;background-color:#008BC2'></div><div class='container' style='padding: 10px;'><div class='row'><h1>Choose a beaglebone to connect to</h1><p>Eg: BeagleBone - XXXX</p></div></div>"
        for (var network of networks) {
            console.log(network)
            var ssid = network['ssid']
            html_to_send += "<div class='row' style='margin-left: 20px;'><h6>" + network['ssid'] + "</h6></div>"
        }
        html_to_send += "<div class='row' style='margin-left: 20px;'>" +
            "<h3>Enter the beaglebone you wish to connect to</h3>" +
            "<form method = 'GET'>" +
            "<div class='row'><div class='col-md-6'>WiFi Name:</div><div class='col-md-6'><input type = 'text' name = 'wifi'></div></div> <div class='row'><div class='col-md-6'>Password:</div><div class='col-md-6'><input type = 'password' name = 'password'></div></div>  <input type = 'submit' id='submitbutton' value = 'Submit'></form></div>"
        html_string = html_to_send;
        var load_html = 'data:text/html,' + encodeURIComponent(html_string);
        // and load the index.html of the app.
        // window.loadUrl(html);
        mainWindow.loadURL(load_html)

    });

    // Open the DevTools.
    mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should devare the corresponding element.
        mainWindow = null
    })
}
var ipc = require('electron').ipcMain;

ipc.on('submitbutton', function(event, data){
    console.log(result,"X");
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.