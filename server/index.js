var fs = require('fs');
var express = require('express');
var http = require('http');
var https = require('https');
var ws = require('ws');
var cors = require('cors');

var DEBUG = process.argv[2] == 'DEBUG';

var button_broadcast = 'wss://wss.redditmedia.com/thebutton?h=f7067a3fab104ed31b8e4c0b850f3a975cc0e894&e=1428499260';
var button_client = new ws(button_broadcast);

var app = express();
var httpServer = http.createServer(app);
httpServer.listen(DEBUG ? 9080 : 8080);

var privateKey = fs.readFileSync('/root/myserver.key', 'utf8');
var certificate = fs.readFileSync('/root/abrame.crt', 'utf8');
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

var last_ticker = 0;

function now() {
  return new Date().getTime() / 1000;
}

wsServer.on('connection', function (socket) {
  socket.on('ping', function (msg) {
    if (!msg.username) {
      return;
    }

    // reloading on server restart
    if (msg.instance_token != 'not_set'
        && msg.instance_token != instance_token) {
      console.log('reloading ' + msg.username);
      socket.emit('reload');
      socket.disconnect();
      return;
    }

    // init
    if (!(msg.username in clients)) {
      clients[msg.username] = {
        alerted: false,
        armed: false
      };
    }
    var c = clients[msg.username];

    // duplicate instances
    if (msg.first_ping && c.online) {
      socket.emit('close');
      socket.disconnect();
      return;
    }

    c.username = msg.username;

    if (('valid' in c) && c.valid != msg.valid) {
      console.log(c.username + ' changed validity ' + c.valid + ' -> ' + msg.valid);
    }

    c.valid = msg.valid;
    c.client_time = msg.client_time;
    c.client_timer = msg.client_timer;
    c.instance_token = msg.instance_token;
    c.last_ping = now();
    c.socket = socket;
    c.online = true;
    c.autoclick = msg.autoclick;
    c.address = socket.handshake.address;

    socket.username = msg.username;
  });
  socket.on('disconnect', function (msg) {
    if (socket.username) {
      console.log('disconnected ' + socket.username);
      clients[socket.username].online = false;
    }
  })
});


function alert_knights(num, autoclickers, manuals) {
  console.log('alerting ' + num + ' knights');

  for (var i = 0; i < num; i++) {
    if (autoclickers.length > 0) {
      var j = Math.floor(Math.random() * autoclickers.length);
      var username = autoclickers[j];
      console.log('alerting autoclicker ' + username);
      clients[username].alerted = 'autoclick';
      clients[username].socket.emit('alert_autoclick');
      autoclickers.splice(j);
    } else if (manuals.length > 0) {
      var j = Math.floor(Math.random() * manuals.length);
      var username = manuals[j];
      console.log('alerting manual ' + username);
      clients[username].alerted = 'manual';
      clients[username].socket.emit('alert_manual');
      manuals.splice(j);
    } else {
      console.log('NOONE TO ALERT');
    }
  }
}

button_client.on('message', function (msg) {
  msg = JSON.parse(msg);
  last_ticker = now();
  timer = msg.payload.seconds_left;
});

setInterval(function () {
  console.log(new Date().toISOString() + ' ' + now());

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
  console.log('Last ticker: ' + last_ticker);
  console.log('Autoclickers: ' + autoclickers.length + ' ' + autoclickers);
  console.log('Manuals: ' + manuals.length + ' ' + manuals);

  if (now() - last_ticker > 5) {
    mode = 'inconsistent';
  } else {
    manage_tiers(autoclickers, manuals);
  }

  console.log('mode: ' + mode);

  for (var i in clients) {
    var c = clients[i];
    if (c.online) {
      console.log(c.username);

      console.log('  address: ' + c.address);
      console.log('  valid: ' + c.valid);
      console.log('  client time: ' + c.client_time);
      console.log('  time diff: ' + (now() - c.client_time));
      console.log('  client timer: ' + c.client_timer);
      console.log('  timer diff: ' + (timer - c.client_timer));
      console.log('  autoclick: ' + c.autoclick);
      console.log('  autoclicked: ' + c.autoclicked);
      console.log('  alerted: ' + c.alerted);

      var client_msg = {
        server_timer: timer,
        autoclickers: autoclickers.length,
        manuals: manuals.length,
        alerted: c.alerted,
        instance_token: instance_token,
        mode: mode,
        armed: mode != 'inconsistent'
      };
      c.socket.emit('update', client_msg);
    }
  }

  console.log();
}, 333);

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
