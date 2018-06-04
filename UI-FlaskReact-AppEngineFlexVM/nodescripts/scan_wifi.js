var wifi = require('node-wifi');

// Initialize wifi module
// Absolutely necessary even to set interface to null
wifi.init({
    iface: null // network interface, choose a random wifi interface if set to null
});

var path, node_ssh, ssh, fs

var opn = require('opn')
fs = require('fs')
path = require('path')
node_ssh = require('node-ssh')
ssh = new node_ssh()

var express = require('express');
var app = express();

app.use(express.static('public'));

app.get('/', function (req, res) {

    // Scan networks
    wifi.scan(function (err, networks) {
        if (err) {
            console.log(err);
        } else {
            console.log(networks);
            let html_to_send = "<!DOCTYPE html><html><h3>Choose a beaglebone to connect to (Eg Beaglebone-XXXX) </h3>"
            for (let network of networks) {
                console.log(network)
                let ssid = network['ssid']
                html_to_send += "<div class='row'>" + network['ssid'] + "</div>"
            }
            html_to_send += "<h3>Enter the beaglebone you wish to connect to</h3><form action='http://localhost:8080/connect_to_beaglebone/' method = 'GET'>" +
                "Wifi to connect to <input type = 'text' name = 'wifi'> <p>Password: <input type = 'text' name = 'password'></p><input type = 'submit' value = 'Submit'></form>"
            res.send(html_to_send + "</html>")
        }
    });

})


app.get('/connect_to_beaglebone', function (req, res) {

    let ssid = req.query.wifi;
    let password = req.query.password;

    // Connect to a network
    wifi.connect({ssid: JSON.stringify(ssid), password: JSON.stringify(password)}, function (err) {
        if (err) {
            console.log(err);
        }
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
                        ssh.exec('connmanctl services $1 | grep "Name =" | cut --delimiter=\' \' --fields 5-10', [], {
                            // cwd: '/var/www',
                            onStdout(chunk) {
                                console.log('stdoutChunk', chunk.toString('utf8').split("\n"))
                                let alllines = chunk.toString('utf8').split("\n")
                                res.send("<!DOCTYPE html><html>" + alllines + "<form action='http://localhost:8080/connect_wifi' method = 'GET'> " +
                                    "Wifi to connect to <input type = 'text' name = 'wifi'><input type = 'submit' value = 'Submit'></form></html>");
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
        // res.send("<!DOCTYPE html><html><h3>Connected to Beaglebone</h3></html>")
    });

})

// Connect to wifi and reset
app.get('/connect_wifi', function (req, res) {
    // Prepare output in JSON format
    response = req.query.wifi,
        console.log(response);
    let resWIFI = (JSON.stringify(response));
    ssh.connect({
        host: '192.168.8.1',
        username: 'debian',
        password: 'openag12'
    }).then(function () {


        ssh.exec('sudo touch "/var/lib/connman/'+resWIFI+'.config";sudo chmod 777 "/var/lib/connman/'+resWIFI+'.config";"[service_$1]\n' +
            'Type=wifi\n' +
            'Name='+resWIFI+'\n' +
            'Passphrase=$2\n' +
            '"> "/var/lib/connman/$SSID.config"', [], {
            // cwd: '/var/www',
            onStdout(chunk) {
                console.log('stdoutChunk', chunk.toString('utf8'))

            },
            onStderr(chunk) {
                console.log('stderrChunk', chunk.toString('utf8'))
            },
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