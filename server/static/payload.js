jQuery.getScript("https://cdn.socket.io/socket.io-1.2.0.js", function (data, status, jqxhr) {

  if ($('#thebutton').length == 0) {
    throw new Error("Not on the button page");
  }

  var version = '4.0.0';
  var DEBUG = false;

  var port = (DEBUG ? '9443' : '8443');

  var socket = io('https://abra.me:' + port + '/');

  var status = 'connecting...';
  var armed = false;
  var armedAt = 0;
  var armedTTL = 0;
  var armedFor = 0;
  var fired = false;

  var redditFeedDiff = [];

  var firstPing = true;
  var username = false;

  var squireSync = false;
  var redditSync = false;

  var settings = {};

  $('.thebutton-wrap').attr('id', 'button_container');

  var squireUI =
    $('<div>', {id: 'squire_container'}).addClass('thebutton-wrap').css({
      'font-family': 'Verdana'
    }).append(
      $('<div>').addClass('thebutton-form').append(
        $('<div>').css({'font-family': 'Verdana'}).append(
          $('<div>').append($('<h3>').text('The Squire')),
          $('<div>').append($('<h4>').text('v. ' + version + (DEBUG ? ' [DEBUG]' : ''))),
          $('<div>').append(
            $('<a>', {
              href: 'http://www.reddit.com/r/Knightsofthebutton/comments/32hosa/the_squire_v40_100_precise_any_second_autoclicking/',
              target: '_blank'
            }).text('what is it?')),
          $('<div>').append('status: ', $('<b>', {id: 'status'}).text('?')),
          $('<div>').append('squire in sync: ', $('<b>', {id: 'squire_sync'}).text('?')),
          $('<div>').append('reddit in sync: ', $('<b>', {id: 'reddit_sync'}).text('?')),
          $('<div>').append('autoclickers: ', $('<b>', {id: 'autoclickers'}).text('?')),
          $('<div>').append('total: ', $('<b>', {id: 'total'}).text('?')),
          $('<div>').append('armed: ', $('<b>', {id: 'armed'}).text('?')),
          $('<div>').append(
            $('<button>').click(openIRC).text('IRC chat'),
            $('<button>').click(settingsToggle).text('settings')
          ),
          $('<div>', {id: 'settings'}).css({display: 'none'}).append(
            $('<hr>'),
            $('<div>').append('autoclick: ', $('<input>', {id: 'autoclick', type: 'checkbox'})),
            $('<div>autoclick at<input id="autoclick_at" maxlength="2" size="2"/>sec</div>'),
            $('<div>').append('now set to ', $('<b>', {id: 'autoclick_at_hint'}).text('?'), ' sec'),
            $('<div>').append($('<button>').click(setAutoclickAt).text('confirm')),
            $('<hr>'),
            $('<div>').append('plots: ', $('<input>', {id: 'plots', type: 'checkbox'})),
            $('<hr>'),
            $('<div>').append('beeps: ', $('<input>', {id: 'beeping', type: 'checkbox'})),
            $('<div>beep x1 when <<input id="beeping1" maxlength="2" size="2"/>sec</div>'),
            $('<div>beep x2 when <<input id="beeping2" maxlength="2" size="2"/>sec</div>'),
            $('<div>beep x3 when <<input id="beeping3" maxlength="2" size="2"/>sec</div>')
          )
        )
      )
    );

  $('#button_container').after(squireUI);

  // BUTTON FUNCTIONS

  function setAutoclickAt() {
    var atStr = $('#autoclick_at').val();
    var atInt = parseInt(atStr);
    if (isNaN(atInt) || atInt < 2 || atInt > 60) {
      alert('Autoclick time should be an integer from 2 to 60');
      return;
    }
    settings.autoclickAt = atInt;
    $('#autoclick_at_hint').text(atInt);
    localStorage.setItem('autoclickAt', atInt);
  }

  function settingsToggle() {
    if ($('#settings')[0].style.display == 'none') {
      $('#settings').show();
    } else {
      $('#settings').hide();
    }
  }

  function openIRC() {
    window.open('https://kiwiirc.com/client/irc.freenode.net/?nick=knight|?#buttonknights');
  }

  // SETTINGS SETUP

  function setupLocalCheckbox(name, defaultValue, changeFunction) {
    if (typeof defaultValue === 'undefined') {
      defaultValue = false;
    }
    if (typeof changeFunction === 'undefined') {
      changeFunction = function () {
      };
    }

    var elem = $('#' + name);
    if (!localStorage.getItem(name)) {
      localStorage.setItem(name, defaultValue);
      settings[name] = defaultValue;
    } else {
      if (localStorage.getItem(name) == 'true') {
        settings[name] = true;
      }
      if (localStorage.getItem(name) == 'false') {
        settings[name] = false;
      }
    }
    elem.prop('checked', settings[name]);

    elem.change(function () {
      settings[name] = $('#' + name).is(':checked');
      localStorage.setItem(name, settings[name]);
      changeFunction(settings[name]);
    });
  }

  setupLocalCheckbox('autoclick');
  setupLocalCheckbox('beeping');

  setupLocalCheckbox('plots', true, function (checked) {
    if (checked) {
      $('#plots_imgs').show();
    } else {
      $('#plots_imgs').hide();
    }
  });
  if (!settings.plots) {
    $('#plots_imgs').hide();
  }

  function setupLocalInt(name, defaultValue) {
    var elem = $('#' + name);
    if (!localStorage.getItem(name)) {
      localStorage.setItem(name, defaultValue);
      settings[name] = defaultValue;
    } else {
      settings[name] = parseInt(localStorage.getItem(name));
    }
    elem.val(settings[name]);

    elem.change(function () {
      var s = parseInt(elem.val());
      if (!isNaN(s)) {
        settings[name] = s;
      } else {
        settings[name] = defaultValue;
        elem.val(defaultValue);
      }
      localStorage.setItem(name, settings[name]);
    });
  }

  setupLocalInt('autoclickAt', 5);
  $('#autoclick_at_hint').text(settings.autoclickAt);

  setupLocalInt('beeping1', 40);
  setupLocalInt('beeping2', 30);
  setupLocalInt('beeping3', 20);

  // PLOTS

  var img_links = [
    'https://abra.me:' + port + '/static/24h.png',
    'https://abra.me:' + port + '/static/all.png',
    'https://abra.me:' + port + '/static/6h_hist.png',
    'https://abra.me:' + port + '/static/1d_hist.png',
    'https://abra.me:' + port + '/static/all_hist.png',
    'https://abra.me:' + port + '/static/10m_presses.png',
    'https://abra.me:' + port + '/static/24h_flair.png',
    'https://abra.me:' + port + '/static/3d_flair.png'
  ];
  var img_div = $('<div>', {id: 'plots_imgs'}).addClass('thebutton-wrap');
  for (var i = 0; i < img_links.length; i++) {
    var img_id = 'squire_img_' + i;
    img_div.append($('<img>', {
      id: img_id,
      src: img_links[i]
    }));
  }

  squireUI.after(img_div);

  setInterval(function () {
    for (var i = 0; i < img_links.length; i++) {
      var img_id = 'squire_img_' + i;
      $('#' + img_id).attr('src', img_links[i] + '?' + Math.random());
    }
  }, 60 * 1000);

  function now() {
    return new Date().getTime() / 1000;
  }

  function getTick(x) {
    return x ? '✔' : '✘';
  }

  // SOCKET HANDLERS

  socket.on('connect', function () {
    status = 'online';
    $('#status').text(status);
  });

  socket.on('disconnect', function () {
    status = 'offline';
    $('#status').text(status);
  });

  socket.on('multiple', function () {
    alert('Having multiple squires open may cause two presses at the same time and being labeled a cheater.');
    socket.disconnect();
  });

  socket.on('reload', function () {
    console.log('New version detected.');
    if (navigator.userAgent.indexOf('Chrome') == -1) {
      socket.disconnect();
      alert('The Squire has been updated, please reload the tab.');
    }
    location.reload();
  });

  socket.on('update', update);

  socket.on('arm', function (msg) {
    if (settings.autoclick) {
      armed = true;
      $('#armed').text(getTick(armed));

      armedTTL = msg.TTL;
      armedAt = now();
      armedFor = msg.time;
    }
  });

  function ping() {
    if (!r.config.logged) {
      return;
    }
    username = r.config.logged;

    var msg = {
      username: username,
      valid: !$('.pressed')[0] && !fired,
      clientTime: now(),
      clientTimer: r.thebutton._msgSecondsLeft,
      version: version,
      firstPing: firstPing,
      autoclick: settings.autoclick,
      autoclickAt: settings.autoclickAt
    };
    firstPing = false;

    socket.emit('ping', msg);
  }

  window.setInterval(ping, 1000);

  function update(msg) {
    $('#server_timer').text(msg.serverTimer);
    $('#squire_sync').text(getTick(msg.squireSync));
    $('#total').text(msg.total);
    $('#autoclickers').text(msg.autoclickers);

    squireSync = msg.squireSync;

    var feedTime = parseInt(r.thebutton._tickTime.slice(17))
      + parseInt(r.thebutton._tickTime.slice(14, 16)) * 60;

    var diff = ((now() % 3600) - feedTime + 3600) % 3600;

    redditFeedDiff.push(diff);

    if (redditFeedDiff.length == 5) {
      redditFeedDiff.shift();
    }
  }

  // Beep function by paul fournel
  function beep() {
    var snd = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
    snd.play();
  }

  function beepn(n) {
    if (n > 0) {
      beep();
    }
    for (var i = 1; i < n; i++) {
      window.setTimeout(beep, 200 * i);
    }
  }

  var beepState = 0;
  window.setTimeout(function () {
    window.setInterval(function () {
      if (settings.beeping) {
        if (r.thebutton._msgSecondsLeft >= settings.beeping1) {
          beepState = 0;
        }
        if (r.thebutton._msgSecondsLeft < settings.beeping1 && beepState == 0) {
          beepState = 1;
          beep(1);
        }
        if (r.thebutton._msgSecondsLeft < settings.beeping2 && beepState == 1) {
          beepState = 2;
          beepn(2);
        }
        if (r.thebutton._msgSecondsLeft < settings.beeping3 && beepState == 2) {
          beepState = 3;
          beepn(3);
        }
      }
    }, 100);
  }, 1000);

  // sync and clicking loop
  var lastMac = '?';
  var lastFeedTick = 0;
  window.setTimeout(function () {
    window.setInterval(function () {
      var mac = r.thebutton._tickMac;
      var nowTime = now();
      if (mac !== lastMac) {
        lastMac = mac;
        lastFeedTick = nowTime;
      }
      redditSync = nowTime - lastFeedTick < 2;
      $('#reddit_sync').text(getTick(redditSync));

      if (nowTime - armedAt > armedTTL) {
        armed = false;
      }

      armed = armed && redditSync && squireSync && settings.autoclick
      && (settings.autoclickAt == armedFor);

      if (armed) {
        if (r.thebutton._msgSecondsLeft == settings.autoclickAt) {
          click();

          socket.emit('clicked', {
            username: username,
            time: settings.autoclickAt
          });
          alert('You have autoclicked the button at ' + settings.autoclickAt
          + ' seconds. Your sacrifice will be remembered.');

          location.reload();

          fired = true;
          armed = false;
        }
      }

      $('#armed').text(getTick(armed));
    }, 200)
  }, 1000);

  function click() {
    var n = {
      seconds: r.thebutton._msgSecondsLeft,
      prev_seconds: r.thebutton._msgSecondsLeft,
      tick_time: r.thebutton._tickTime,
      tick_mac: r.thebutton._tickMac
    };
    $.request("press_button", n, function (e) {
      console.log(e);
    });
  }
});
