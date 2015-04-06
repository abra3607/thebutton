var host = 'wss://wss.redditmedia.com/thebutton?h=19ad9a33871d49f318ab8d882b63c101924638d1&e=1428351836';

var WS = require('ws');
var fs = require('fs');
var button_client = new WS(host);

button_client.on('message', function(msg) {
  msg = JSON.parse(msg);
  var time_left = msg.payload.seconds_left;

  var s = new Date().getTime() + ',' + time_left;
  console.log(s);
});
