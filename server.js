const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const moment = require('moment');
const path = require('path');
const iotHubClient = require('./IoThub/iot-hub.js');

const app = express();

console.log("presentation-XX: starting....3");

app.use(express.static(path.join(__dirname, 'public')));
app.use(function (req, res/*, next*/) {
  res.redirect('/');
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });


// Broadcast to all.
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        console.log('sending data ' + data);
        client.send(data);
      } catch (e) {
        console.error(e);
      }
    }
  });
};


const https = require('https');

function dbData(){
  var apiURL = "https://" + process.env.apiName + ".azurewebsites.net/livedata";
  https.get(apiURL, (resp) => {
  var data = '';

  // A chunk of data has been recieved.
  resp.on('data', (chunk) => {
    data += chunk;
  });

  // The whole response has been received.
  resp.on('end', () => {
    console.log("\nhttps.get3: ***************************************");
    //console.log(JSON.parse(data).explanation);

    
    var obj3 = JSON.parse(data);
    obj3 = Object.assign(obj3, { dataSource: 'api'});

    wss.broadcast(JSON.stringify(obj3));
  });

}).on("error", (err) => {
  console.log("Error: " + err.message);
});
  
}

console.log("Creating IoT Hub client...");
var iotHubReader = new iotHubClient(process.env['Azure.IoT.IoTHub.ConnectionString'], process.env['Azure.IoT.IoTHub.ConsumerGroup']);
//var iotHubReader = new iotHubClient("1234", process.env['Azure.IoT.IoTHub.ConsumerGroup']);
console.log("...startReadMessage");
iotHubReader.startReadMessage(function (obj, date) {
  try {
    //wss.broadcast('src=' + process.env.apiName);
    dbData();

    console.log("startReadMessage: " + date);
    date = date || Date.now();
    var obj2 = Object.assign(obj, { dataSource: 'mqtt'});
    
    wss.broadcast(JSON.stringify(Object.assign(obj2, { time: moment.utc(date).format('YYYY:MM:DD[T]hh:mm:ss') })));
  } catch (err) {
    console.log(obj);
    console.error(err);
  }
});

var port = normalizePort(process.env.PORT || '3000');
//var port = normalizePort('3000');

server.listen(port, function listening() {
  console.log('Listening on %d', server.address().port);
});

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}
