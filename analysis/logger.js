var host = 'wss://wss.redditmedia.com/thebutton?h=f7067a3fab104ed31b8e4c0b850f3a975cc0e894&e=1428499260';

var WS = require('ws');
var fs = require('fs');
var button_client = new WS(host);

button_client.on('message', function(msg) {
  msg = JSON.parse(msg);
  var time_left = msg.payload.seconds_left;

  var s = new Date().getTime() + ',' + time_left;
  console.log(s);
});
