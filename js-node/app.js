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
    
    // Listen to AAPL
    listenToTicker(ws, 'AAPL');
    listenToTicker(ws, 'MSFT');
    
    // Send a heartbeat every 30 seconds
    setInterval(function(){
      heartbeat(ws);
    }, 30000);
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

// Start listening to the specified ticker
function listenToTicker(socket, ticker) {
  socket.send(JSON.stringify({
    topic: 'iex:securities:' + ticker,
    event: 'phx_join',
    payload: {},
    ref: null
  }));
}

// Stop listening to the specified ticker
function unlistenToTicker(socket, ticker) {
  socket.send(JSON.stringify({
    topic: 'iex:securities:' + ticker,
    event: 'phx_leave',
    payload: {},
    ref: null
  }));
}

// Start listening to the lobby (not available with all subscriptions)
function listenToLobby(socket) {
  socket.send(JSON.stringify({
    topic: 'iex:lobby',
    event: 'phx_join',
    payload: {},
    ref: null
  }));
}

// Start listening to the lobby (not available with all subscriptions)
function unlistenToLobby(socket) {
  socket.send(JSON.stringify({
    topic: 'iex:lobby',
    event: 'phx_leave',
    payload: {},
    ref: null
  }));
}

// Send a heartbeat message, to keep the copnnection alive
function heartbeat(socket) {
  socket.send(JSON.stringify({
    topic: 'phoenix',
    event: 'heartbeat',
    payload: {},
    ref: null
  }));
}
