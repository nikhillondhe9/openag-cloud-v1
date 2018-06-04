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
var express = require('express');
var app = express();

app.use(express.static('public'));

app.get('/', function (req, res) {

    // Scan networks
    //  Try scanning for access points:
    WiFiControl.scanForWiFi(function (err, response) {
        if (err) console.log(err);
        console.log(response);
        let networks = response["networks"]
        let html_to_send = "<!DOCTYPE html><html><h3>Choose a beaglebone to connect to (Eg Beaglebone-XXXX) </h3>"
        for (let network of networks) {
            console.log(network)
            let ssid = network['ssid']
            html_to_send += "<div class='row'>" + network['ssid'] + "</div>"
        }
        html_to_send += "<h3>Enter the beaglebone you wish to connect to</h3><form action='http://localhost:8080/connect_to_beaglebone/' method = 'GET'>" +
            "Wifi to connect to <input type = 'text' name = 'wifi'> <p>Password: <input type = 'text' name = 'password'></p><input type = 'submit' value = 'Submit'></form>"
        res.send(html_to_send + "</html>")
    });
})


app.get('/connect_to_beaglebone', function (req, res) {

    let ssid = req.query.wifi;
    let password = req.query.password;

    // Connect to a network
    var results = WiFiControl.connectToAP({
        ssid: JSON.stringify(ssid),
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
                            console.log('stdoutChunk', chunk.toString('utf8').split("\n"))
                            let alllines = chunk.toString('utf8').split("\n")
                            for (let line of alllines) {
                                let ssid_psk = line.split(/wifi/)
                                let line_json = {
                                    "ssid": ssid_psk[0].trim(),
                                    "psk": "wifi" + ssid_psk[1]
                                }
                                // console.log(line.split("\t"))
                                console.log(line_json)
                                local_networks.push(line_json);
                            }
                            let html_to_send = ""
                            for (let network of local_networks) {
                                html_to_send += "<div class='row'>" + network['ssid'] + "</div>"
                            }
                            res.send("<!DOCTYPE html><html>" + html_to_send + "<form action='http://localhost:8080/connect_wifi' method = 'GET'>" +
                                "Wifi to connect to <input type = 'text' name = 'wifi'><input type = 'password' name = 'password'><input type = 'submit' value = 'Submit'></form></html>");
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
});

// Connect to wifi and reset
app.get('/connect_wifi', function (req, res) {
    // Prepare output in JSON format
    response = req.query.wifi,
        console.log(response);
    let psk = ""
    let resWIFI = (JSON.stringify(response));
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
            resWIFI.replace(/['"]+/g, '') + `\nPassphrase=${JSON.stringify(req.query.password).replace(/['"]+/g, '')}` + `"> "/var/lib/connman/${resWIFI.replace(/['"]+/g, '')}`+'.config"')
        ssh.exec(`touch /var/lib/connman/${resWIFI.replace(/['"]+/g, '')};` + 'echo "[service_' + psk.replace(/['"]+/g, '') + ']\nType=wifi\nName=' +
            resWIFI.replace(/['"]+/g, '') + `\nPassphrase=${JSON.stringify(req.query.password).replace(/['"]+/g, '')}` + `"> "/var/lib/connman/${resWIFI.replace(/['"]+/g, '')}`+'.config"', [], {
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
})


// console.log(req.params.id);
var server = app.listen(8080, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
    opn("http://localhost:8080/")
})