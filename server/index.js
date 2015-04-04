var fs = require('fs');
var express = require('express');
var http = require('http');
var https = require('https');
var ws = require('ws');

var app = express();
var httpServer = http.createServer(app);
httpServer.listen(8080);

var privateKey = fs.readFileSync('/Users/abra/.crt/myserver.key', 'utf8');
var certificate = fs.readFileSync('/Users/abra/.crt/abrame.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate};
var httpsServer = https.createServer(credentials, app);
httpsServer.listen(8443);

app.use("/static", express.static(__dirname + '/static'));

var wsServer = require('socket.io')(httpsServer);

var knight_pool = {};
var alerted = {};
var sockets = {};

var current_tier = 0;

var lowest = 100;
var last_period = [];
var period_length = 60 * 1;

function now() {
  return new Date().getTime() / 1000;
}

wsServer.on('connection', function (socket) {
  socket.on('ping', function (msg) {
    if (!msg.username) {
      return;
    }

    knight_pool[msg.username] = now();
    sockets[msg.username] = socket;
  });
});

var button_broadcast = 'wss://wss.redditmedia.com/thebutton?h=900bb019d240dd0bbd0b44a79750b910219fe953&e=1428245050';
var button_client = new ws(button_broadcast);

function alert_knights(num) {
  var keys = Object.keys(knight_pool);

  num = Math.min(num, keys.length);

  for (var i = 0; i < num; i++) {
    var id = Math.floor(keys.length * Math.random());
    var key = keys[id];

    delete knight_pool[key];
    keys = Object.keys(knight_pool);

    alerted[key] = true;
    sockets[key].emit('alert');
    console.log('alarming ' + key);
  }
}

function alert_all() {
  var keys = Object.keys(knight_pool);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    alerted[key] = true;
    sockets[key].emit('alert');
  }
  knight_pool = {};
}

button_client.on('message', function (msg) {
  msg = JSON.parse(msg);
  var time_left = msg.payload.seconds_left;
  lowest = Math.min(lowest, time_left);

  last_period.push(time_left);
  if (last_period.length > period_length) {
    last_period.shift();
  }
  var lowest_period = 100;
  for (var i = 0; i < last_period.length; i++) {
    lowest_period = Math.min(lowest_period, last_period[i]);
  }

  console.log(last_period + ' ' + last_period.length);

  console.log('');
  console.log(time_left);

  var keys = Object.keys(knight_pool);

  var s = '' + keys.length + ': ';
  for (var i = 0; i < keys.length; i++) {
    s += keys[i] + ' ';
  }
  console.log(s);

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var obj = {
      pool_size: keys.length,
      panic: false,
      lowest_period: lowest_period,
      lowest_start: lowest
    };
    if (key in alerted) {
      obj.panic = true;
    }
    sockets[key].emit('update', obj);
  }

  // kicking idlers
  kick_idlers();

  if (Object.keys(alerted).length > 0) {
    console.log('alerted ' + Object.keys(alerted));
  }

  manage_tiers(time_left);
});

function kick_idlers() {
  var time = now();
  var to_kick = [];
  for (var key in knight_pool) {
    var age = time - knight_pool[key];
    if (age > 10) {
      to_kick.push(key);
    }
  }
  for (var i = 0; i < to_kick.length; i++) {
    delete knight_pool[to_kick[i]];
  }
}

function manage_tiers(time_left) {
  if (time_left >= 30) {
    current_tier = 0;
    alerted = {};
  }
  if (time_left >= 20 && time_left < 30 && current_tier == 0) {
    alert_knights(1);
    current_tier = 1
  }
  if (time_left >= 10 && time_left < 20 && current_tier == 1) {
    alert_knights(3);
    current_tier = 2
  }
  if (time_left < 10 && current_tier == 2) {
    alert_all();
    current_tier = 3;
  }
}
