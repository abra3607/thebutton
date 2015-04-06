var fs = require('fs');
var express = require('express');
var http = require('http');
var https = require('https');
var ws = require('ws');
var cors = require('cors');

var DEBUG = process.argv[2] == 'DEBUG';

var app = express();
var httpServer = http.createServer(app);
httpServer.listen(DEBUG ? 9080 : 8080);

var privateKey = fs.readFileSync('/Users/abra/.crt/myserver.key', 'utf8');
var certificate = fs.readFileSync('/Users/abra/.crt/abrame.crt', 'utf8');
var credentials = {key: privateKey, cert: certificate};
var httpsServer = https.createServer(credentials, app);
httpsServer.listen(DEBUG ? 9443 : 8443);

app.use("/static", express.static(__dirname + (DEBUG ? '/static_testing' : '/static')));

app.use(cors());

app.get('/get', function (req, res) {
  res.redirect('https://chrome.google.com/webstore/detail/the-squire/mehjgfidikjedfdjfhkbnapnhemedfid');
});

var wsServer = require('socket.io')(httpsServer);

var instance_token = '' + Math.random();

var timer = 100;
var clients = {};

var state = 0;

var mode = 'setup';

function now() {
  return new Date().getTime() / 1000;
}

wsServer.on('connection', function (socket) {
  socket.on('ping', function (msg) {
    if (!msg.username) {
      return;
    }

    if (!(msg.username in clients)) {
      clients[msg.username] = {
        alerted: false,
        autoclick: false
      };
    }
    var c = clients[msg.username];

    if (msg.first_ping && c.online) {
      socket.emit('close');
      return;
    }

    c.username = msg.username;
    c.last_ping = now();
    c.socket = socket;
    c.valid = msg.valid;
    c.client_time = msg.client_time;
    c.instance_token = msg.instance_token;
    c.online = true;

    socket.username = msg.username;

    if ('autoclick' in msg) {
      c.autoclick = msg.autoclick;
    }

    if (c.instance_token != 'not_set'
        && c.instance_token != instance_token) {
      console.log('reloading ' + msg.username);
      socket.emit('reload');
      c.online = false;
    }
  });
  socket.on('disconnect', function (msg) {
    if (socket.username) {
      console.log('disconnected ' + socket.username);
      clients[socket.username].online = false;
    }
  })
});

var button_broadcast = "wss://wss.redditmedia.com/thebutton?h=19ad9a33871d49f318ab8d882b63c101924638d1&e=1428351836"
var button_client = new ws(button_broadcast);

function alert_knights(num, autoclickers, manuals) {
  console.log('alerting ' + num + ' knights');

  for (var i = 0; i < num; i++) {
    if (autoclickers.length > 0) {
      var j = Math.floor(Math.random() * autoclickers.length);
      var username = autoclickers[j];
      console.log('alerting autoclicker ' + username);
      clients[username].alerted = 'autoclick';
      clients[username].socket.emit('click');
      autoclickers.splice(j);
    } else if (manuals.length > 0) {
      var j = Math.floor(Math.random() * manuals.length);
      var username = manuals[j];
      console.log('alerting manual ' + username);
      clients[username].alerted = 'manual';
      clients[username].socket.emit('alert');
      manuals.splice(j);
    } else {
      console.log('NOONE TO ALERT');
    }
  }
}

button_client.on('message', function (msg) {
  msg = JSON.parse(msg);
  timer = msg.payload.seconds_left;
});

setInterval(function () {
  kick_idlers();

  var autoclickers = [];
  var manuals = [];

  for (var i in clients) {
    if (clients[i].valid && !clients[i].alerted && clients[i].online) {
      if (clients[i].autoclick) {
        autoclickers.push(i);
      } else {
        manuals.push(i);
      }
    }
  }

  console.log('Timer: ' + timer);
  console.log('Autoclickers: ' + autoclickers.length + ' ' + autoclickers);
  console.log('Manuals: ' + manuals.length + ' ' + manuals);

  for (var i in clients) {
    var client_msg = {
      server_timer: timer,
      autoclickers: autoclickers.length,
      manuals: manuals.length,
      alerted: clients[i].alerted,
      instance_token: instance_token,
      autoclick: clients[i].autoclick,
      mode: mode
    };
    clients[i].socket.emit('update', client_msg);
  }

  manage_tiers(autoclickers, manuals);

  console.log();
}, 100);

function kick_idlers() {
  var time = now();
  var to_kick = [];
  for (var i in clients) {
    if (clients[i].online) {
      var age = time - clients[i].last_ping;
      if (age > 5) {
        to_kick.push(i);
      }
    }
  }
  for (var i = 0; i < to_kick.length; i++) {
    console.log('kicking ' + to_kick[i] + ' for idling');
    clients[to_kick[i]].socket.disconnect();
    clients[to_kick[i]].online = false;
  }
}

function clear_alerts() {
  console.log('clearing alerts');
  for (var i in clients) {
    clients[i].alerted = false;
  }
}

function manage_tiers(autoclickers, manuals) {
  if (autoclickers.length > 3) {
    mode = 'safe';
    console.log('safe mode');
    if (timer >= 9 && state > 0) {
      state = 0;
      clear_alerts()
    } else if (timer < 9 && state == 0) {
      state = 1;
      alert_knights(1, autoclickers, manuals);
    } else if (timer < 6 && state == 1) {
      state = 2;
      alert_knights(3, autoclickers, manuals);
    }
  } else {
    mode = 'cautious';
    console.log('cautious mode');
    if (timer >= 30 && state > 0) {
      state = 0;
      clear_alerts()
    } else if (timer < 30 && state == 0) {
      state = 1;
      alert_knights(1, autoclickers, manuals);
    } else if (timer < 20 && state == 1) {
      state = 2;
      alert_knights(2, autoclickers, manuals);
    } else if (timer < 10 && state == 2) {
      state = 3;
      alert_knights(3, autoclickers, manuals);
    }
  }
}
