var app = require('express')();
var http = require('http').Server(app);
var server = require('socket.io')(http);

var knight_pool = {};
var alerted = {};
var sockets = {};

var now = function() {
  return new Date().getTime() / 1000;
};

app.get('/payload.js', function(req, res){
  res.sendFile(__dirname + '/payload.js');
});

app.get('/extension.zip', function(req, res){
  res.sendFile(__dirname + '/extension.zip');
});

server.on('connection', function(socket){
  socket.on('ping', function(msg){
  	console.log('ping from ' + msg.username + ' ' + msg.valid);
    if (msg.username in alerted) {
      return;
    }
    knight_pool[msg.username] = now();
    sockets[msg.username] = socket;
  });
});

http.listen(80, function(){
  console.log('listening on *:80');
});

var host = 'wss://wss.redditmedia.com/thebutton?h=18b13fe7e761e61c392a41fbde0621d92530c408&e=1428115795';

var WS = require('ws');
var button_client = new WS(host);

var defcon = 5;

function alarm_knights(num) {
  var pool_size = Object.keys(knight_pool).length;

  for (var i = 0; i < pool_size && i < num; i++) {
    var id = (int)(Object.keys(knight_pool).length * Math.random());
    var key = Object.keys(knight_pool)[id];
    delete knight_pool[key];
    alerted[key] = true;
    sockets[key].emit('alarm');
  }
}

button_client.on('message', function(msg) {
  msg = JSON.parse(msg);
  var time_left = msg.payload.seconds_left;
  console.log(time_left);

  server.emit('update', 'pool ' + Object.keys(knight_pool).length);

  // kicking idlers
  var time = now();
  var to_kick = [];
  for (var key in knight_pool) {
    var age = time - knight_pool[key];
    if (age > 10) {
      to_kick.push(key);
      console.log(key + ' should be kicked');
    }
    console.log(key + ' ' + age);
  };
  for (var i = 0; i < to_kick.length; i++) {
    delete knight_pool[key];
  }

  // tiers
  if (time_left >= 40) {
    defcon = 5;
    alerted = {};
  }
  if (time_left >= 30 && time_left < 40) {
    if (defcon == 5) {
      alarm_knights(1);
    }
    defcon = 4;
  }
  if (time_left >= 25 && time_left < 30) {
    if (defcon == 4) {
      alarm_knights(1);
    }
    defcon = 3;
  }
  if (time_left >= 20 && time_left < 25) {
    if (defcon == 3) {
      alarm_knights(3);
    }
    defcon = 2;
  }
  if (time_left >= 10 && time_left < 20) {
    if (defcon == 2) {
      alarm_knights(10);
    }
    defcon = 1;
  }
  if (time_left < 10) {
    server.emit('alarm');
  }

  if (Math.random() < 0.1) {
    console.log('ALARM');
    server.emit('alarm');
  };
});