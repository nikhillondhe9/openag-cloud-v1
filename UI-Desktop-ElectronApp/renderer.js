var {ipcRenderer, remote} = require('electron');


var main = remote.require("./main.js");


// var ipc = window.require('ipc')
function renderWifis(networks) {
    let html_to_send = "<!DOCTYPE html><html>"
    for (let network of networks) {
        let ssid = network['ssid']
        html_to_send += "<div class='row'>" + network['ssid'] + "</div>"
    }
    html_to_send += "</html>"
    window.document.getElementById("wifi").innerHTML = html_to_send
    window.document.getElementById("submitbutton").addEventListener("click", function (e) {
        connect_to_wifi();
    });
    return html_to_send
}

function renderOnDeviceWifis(networks) {
    let html_to_send = ""
    for (let network of networks) {
        html_to_send += "<div class='row'>" + network['ssid'] + "</div>"
    }
    window.document.getElementById("wifi").innerHTML = html_to_send
    window.document.getElementById("submitbutton").addEventListener("click", function (e) {
        connect_to_ondevice_wifi();
    });
    return html_to_send
}

function connect_to_wifi() {
    let wifi_name = window.document.getElementById("wifi_name").value;
    let wifi_password = window.document.getElementById("wifi_password").value;
    main.connect_to_wifi_main(wifi_name, wifi_password)
}

function connect_to_ondevice_wifi()
{
    let wifi_name = window.document.getElementById("wifi_name").value;
    let wifi_password = window.document.getElementById("wifi_password").value;
    main.connect_to_ondevice_wifi_main(wifi_name, wifi_password)
}
ipcRenderer.on('wifi-data', function (event, arg) {
    console.log("Rendering Wifi's Found")
    renderWifis(arg)
});

ipcRenderer.on('login-beaglebone', function (event, arg) {
    console.log("Logging into BeagleBone")
});

ipcRenderer.on('ondevice-wifi-data', function (event, all_lines) {

    var local_networks = []
    for (let line of all_lines) {
        let ssid_psk = line.split(/wifi/)
        let line_json = {
            "ssid": ssid_psk[0].trim(),
            "psk": "wifi" + ssid_psk[1]
        }
        // console.log(line.split("\t"))
        console.log(line_json)
        local_networks.push(line_json);
    }
    renderOnDeviceWifis(local_networks)

})