var host = 'wss://wss.redditmedia.com/thebutton?h=5bf663299fa23a02564ccb7cfa40b2a1c9456b02&e=1428232624';

var WS = require('ws');
var fs = require('fs');
var button_client = new WS(host);

var log = fs.createWriteStream('log.txt', {'flags': 'a'});

button_client.on('message', function(msg) {
  msg = JSON.parse(msg);
  var time_left = msg.payload.seconds_left;

  var s = new Date().getTime() + ',' + time_left;
  console.log(s);

  log.write(s + '\n');
});