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

app.get('/get', function (req, res) {
  res.redirect('https://chrome.google.com/webstore/detail/the-squire/mehjgfidikjedfdjfhkbnapnhemedfid');
});

var wsServer = require('socket.io')(httpsServer);

var instance_token = '' + Math.random();

var timer = 100;
var clients = {};

var state = 0;

function now() {
  return new Date().getTime() / 1000;
}

wsServer.on('connection', function (socket) {
  socket.on('ping', function (msg) {
    if (!msg.username) {
      return;
    }

    socket.username = msg.username;

    if (!(msg.username in clients)) {
      clients[msg.username] = {
        alerted: false
      };
    }

    clients[msg.username].username = msg.username;
    clients[msg.username].last_ping = now();
    clients[msg.username].socket = socket;
    clients[msg.username].valid = msg.valid;
    clients[msg.username].client_time = msg.client_time;
    clients[msg.username].autoclick = msg.autoclick;
    clients[msg.username].instance_token = msg.instance_token;

    if (clients[msg.username].instance_token != 'not_set'
        && clients[msg.username].instance_token != instance_token) {
      console.log('reloading ' + msg.username);
      socket.emit('reload');
      delete clients[msg.username];
    }
  });
  socket.on('disconnect', function (msg) {
    if (socket.username) {
      console.log('disconnected ' + socket.username);
      delete clients[socket.username];
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
    if (clients[i].valid && !clients[i].alerted) {
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
  console.log();

  for (var i in clients) {
    var client_msg = {
      server_timer: timer,
      autoclickers: autoclickers.length,
      manuals: manuals.length,
      alerted: clients[i].alerted,
      instance_token: instance_token
    };
    clients[i].socket.emit('update', client_msg);
  }

  manage_tiers(autoclickers, manuals);
}, 100);

function kick_idlers() {
  var time = now();
  var to_kick = [];
  for (var i in clients) {
    var age = time - clients[i].last_ping;
    if (age > 5) {
      to_kick.push(i);
    }
  }
  for (var i = 0; i < to_kick.length; i++) {
    console.log('kicking ' + to_kick[i] + ' for idling');
    clients[to_kick[i]].socket.disconnect();
    delete clients[to_kick[i]];
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
