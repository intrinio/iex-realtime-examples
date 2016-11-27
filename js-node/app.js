'use strict';
var https = require('https');
var username = "YOUR_API_USERNAME";
var password = "YOUR_API_PASSWORD";
var WebSocket = require('ws');

authorize();

// Gets a token
function authorize() {
  var headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + new Buffer((username + ':' + password)).toString('base64')
  };
  var options = {
    host: 'realtime.intrinio.com',
    port: 443,
    path: '/auth',
    method: 'GET',
    headers: headers
  };

  var req = https.get(options, function(res) {
    res.on('data', function(data) {
      var token = new Buffer(data, 'base64').toString();
      connect(token);
    });
  });

  req.on('error', function(e) {
    console.error(e);
  });

  req.end();
}

function connect(token) {
  var socket_url = 'wss://realtime.intrinio.com/socket/websocket';
  socket_url += '?vsn=1.0.0&token=' + encodeURIComponent(token);
  var ws = new WebSocket(socket_url);

  ws.on('connection', function open() {
    console.log('connection');
  });

  ws.on('error', function open() {
    console.log('error');
  });

  ws.on('open', function open() {
    console.log('open');
    listenToTicker(ws, "AAPL");
    listenToTicker(ws, "MSFT");
  });

  ws.on('close', function close() {
    console.log('close');
  });

  ws.on('message', function message(data, flags) {
    var message = JSON.parse(data)
    console.log(data);
    if (message.event === 'quote') {
      var payload = message.payload;

      var ticker = payload.ticker;
      var type = payload.type;
      var timestamp = payload.timestamp;
      var price = payload.price;
      var size = payload.size;

      console.log(ticker, type, timestamp, price, size);
    }
    else {
      console.log('Other message: ' + data);
    }
  });
}

function listenToTicker(socket, ticker) {
  socket.send(JSON.stringify({
    topic: 'iex:securities:' + ticker,
    event: 'phx_join',
    payload: {},
    ref: '1'
  }));
}
