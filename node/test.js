var host = 'wss://wss.redditmedia.com/thebutton?h=18b13fe7e761e61c392a41fbde0621d92530c408&e=1428115795';

var WS = require('ws');
var button_client = new WS(host);
button_client.on('message', function(msg) {
	msg = JSON.parse(msg);
	console.log(msg.payload.seconds_left);
	console.log(msg.payload.participants_text);
});