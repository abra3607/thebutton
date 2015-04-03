var app = require('express')();
var http = require('http').Server(app);
var server = require('socket.io')(http);

var knight_pool = {}

var now = function() {
  return new Date().getTime() / 1000;
}

app.get('/payload.js', function(req, res){
  res.sendFile(__dirname + '/payload.js');
});

app.get('/extension.zip', function(req, res){
  res.sendFile(__dirname + '/extension.zip');
});

server.on('connection', function(socket){
  socket.on('ping', function(msg){
  	console.log('ping from ' + msg.username + ' ' + msg.valid);
    knight_pool[msg.username] = now();
  });
});

http.listen(80, function(){
  console.log('listening on *:80');
});

var host = 'wss://wss.redditmedia.com/thebutton?h=18b13fe7e761e61c392a41fbde0621d92530c408&e=1428115795';

var WS = require('ws');
var button_client = new WS(host);

button_client.on('message', function(msg) {
  msg = JSON.parse(msg);
  console.log(msg.payload.seconds_left);
  console.log(msg.payload.participants_text);
  server.emit('update', 'pool ' + Object.keys(knight_pool).length);

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

  // for (var key in to_kick) {
  //   delete knight_pool[key];
  // }

  if (Math.random() < 0.1) {
    console.log('ALARM');
    server.emit('alert');
  };
});