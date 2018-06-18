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
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow
var ipcMain = require('electron').ipcMain;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({width: 800, height: 800})


    WiFiControl.scanForWiFi(function (err, response) {
        if (err) console.log(err);

        // and load the index.html of the app.
        mainWindow.loadFile('index.html');
        mainWindow.webContents.on('did-finish-load', () => {
            console.log("now sendding a message to term window");
            let unique_networks = [...new Set(response['networks'])];
            mainWindow.webContents.send('wifi-data', unique_networks)
        })
        // mainWindow.loadURL(load_html)


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

exports.connect_to_ondevice_wifi_main = (name, password,local_networks) => {

    let psk = ""
    let resWIFI = name;
    ssh.connect({
        host: '192.168.8.1',
        username: 'debian',
        password: 'openag12'
    }).then(function () {
        for (let network of local_networks) {
            console.log((resWIFI.replace('"', '')).includes(network['ssid']))
            if ((resWIFI.replace('"', '')).includes(network['ssid'])) {

                if (!network['psk'].includes("hidden") && !network['psk'].includes("undefined")) {
                    console.log("True", psk)
                    psk = network['psk']
                    console.log(psk, network['ssid'])
                }
            }
        }
        console.log(`touch /var/lib/connman/${resWIFI.replace(/['"]+/g, '')};` + 'echo "[service_' + psk.replace(/['"]+/g, '') + ']\nType=wifi\nName=' +
            resWIFI.replace(/['"]+/g, '') + `\nPassphrase=${password.replace(/['"]+/g, '')}` + `"> "/var/lib/connman/${resWIFI.replace(/['"]+/g, '')}` + '.config"')
        ssh.exec(`touch /var/lib/connman/${resWIFI.replace(/['"]+/g, '')};` + 'echo "[service_' + psk.replace(/['"]+/g, '') + ']\nType=wifi\nName=' +
            resWIFI.replace(/['"]+/g, '') + `\nPassphrase=${password.replace(/['"]+/g, '')}` + `"> "/var/lib/connman/${resWIFI.replace(/['"]+/g, '')}` + '.config"', [], {
            stream: 'stdout',
            options: {pty: true}
        }).then(function (result) {
            console.log('STDOUT: ' + result)
            ssh.exec(`connmanctl config  ${psk.replace(/['"]+/g, '')} --autoconnect yes`, [], {
                stream: 'stdout',
                options: {pty: true}
            }).then(function (result) {
                console.log('STDOUT:S' + result)
            })

        })


    });
};

exports.connect_to_wifi_main = (name, password) => {
    console.log("I am here")
    // Connect to a network
    var results = WiFiControl.connectToAP({
        ssid: JSON.stringify(name),
        password: JSON.stringify(password)
    }, function (err, response) {
        if (err) console.log(err);
        console.log(response);
        console.log('Connected');
        ssh.connect({
            host: '192.168.8.1',
            username: 'debian',
            password: 'openag12'
        }).then(function () {
            console.log("Connect")
            ssh.exec('connmanctl scan wifi', [], {
                // cwd: '/var/www',
                onStdout(chunk) {
                    console.log('stdoutChunk', chunk.toString('utf8'))
                    ssh.exec('connmanctl services', [], {
                        // cwd: '/var/www',
                        onStdout(chunk) {
                            let alllines = chunk.toString('utf8').split("\n")
                            console.log(alllines)
                            // mainWindow.loadFile('ondevice_wifi.html')
                            mainWindow.webContents.send('ondevice-wifi-data', alllines)
                        },
                        onStderr(chunk) {
                            console.log('stderrChunk', chunk.toString('utf8'))
                        },
                    })
                },
                onStderr(chunk) {
                    console.log('stderrChunk', chunk.toString('utf8'))
                },
            })

        });
    })
}

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