jQuery.getScript("https://cdn.socket.io/socket.io-1.2.0.js", function (data, status, jqxhr) {

  if ($('#thebutton').length == 0) {
    throw new Error("Not on the button page");
  }

  var DEBUG = true;
  var status = 'connecting...';
  var autoclick = false;
  var socket = io('https://abra.me:' + (DEBUG ? '9443' : '8443') + '/');
  var armed = false;
  var failsafe = false;

  var button_form = $('.thebutton-form');
  button_form.detach();
  $('.thebutton-wrap').append(
      $('<section>', {id: "button_container"}).css({
        'width': '90%',
        'height': '169px',
        'margin': 'auto',
        'padding': '10px'
      }).append(
          $('<div>').css({
            'float': 'left',
            'width': '20%',
            'height': '169px'
          }).append(
              $('<div>').css({
                'position': 'relative',
                'top': '50%',
                'transform': 'translateY(-50%)'
              }).append(
                  $('<p>').append($('<h3>').text('The Squire' + (DEBUG ? ' [DEBUG]' : ''))),
                  $('<p>').append($('<a>', {
                    href: 'http://bit.ly/1a7DWwk',
                    target: '_blank'
                  }).text('what is it?')),
                  $('<p>status: <b id="status">' + status + '</b></p>'),
                  $('<p>server timer: <b id="server_timer">?</b></p>'),
                  $('<p>autoclickers: <b id="autoclickers">?</b></p>'),
                  $('<p>manuals: <b id="manuals">?</b></p>'),
                  $('<p>mode: <b id="mode">?</b></p>'),
                  $('<p>armed: <b id="armed">?</b></p>'),
                  $('<p><input id="autoclick" type="checkbox">autoclick</input></p>'),
                  $('<button>', {
                    onclick: 'window.open(\'https://kiwiirc.com/client/irc.freenode.net/?nick=knight|?#buttonknights\')'
                  }).text('open IRC chat')
              )
          ),
          $('<div>').css({
            'margin-left': '20%',
            'height': '169px'
          }).append(button_form)
      )
  );
  $('.thebutton-wrap').after(
      $('<div>').append(
          $('<img>', {
            src: "http://abra.me:8080/static/plot.png"
          }).css({
            'display': 'block',
            'margin-left': 'auto',
            'margin-right': 'auto'
          })
      )
  );

  function now() {
    return new Date().getTime() / 1000;
  }

  if (!localStorage.getItem('autoclick')) {
    localStorage.setItem('autoclick', false);
  } else {
    autoclick = localStorage.getItem('autoclick');
    $('#autoclick').prop('checked', autoclick);
  }

  $('#autoclick').change(function () {
    autoclick = $('#autoclick').is(':checked');
    localStorage.setItem('autoclick', autoclick);
  });

  var first_ping = true;
  var autoclicked = false;
  var username = false;

  var instance_token = 'not_set';

  socket.on('connect', function () {
    status = 'online';
    $('#status').text(status);
  });

  socket.on('disconnect', function () {
    status = 'offline';
    $('#status').text(status);
  });

  socket.on('close', function () {
    alert('Having multiple squires open may cause two presses at the same time and labeling you a cheater.');
    socket.disconnect();
  });

  socket.on('reload', function () {
    location.reload();
  });

  socket.on('update', update);

  socket.on('alert_autoclick', click);

  socket.on('alert_manual', function () {
    window.open('https://www.youtube.com/embed/c-EiIQfR-dc?autoplay=1&end=13');
    socket.disconnect();
    window.open('https://reddit.com/r/thebutton');
  });

  function click() {
    //comm delay
    if (r.thebutton._msgSecondsLeft > 10 || !autoclick || autoclicked || !armed) {
      return;
    }

    $('#thebutton').trigger('click');

    $('.thebutton-form').before(
        $('<div>').css({
          'text-align': 'center'
        }).append(
            $('<h3>').text('You have been ordered to autoclick'),
            $('<h3>').text('Your sacrifice will be remembered')
        )
    );

    autoclicked = true;
  }

  function ping() {
    if (!r.config.logged) {
      return;
    }
    username = r.config.logged;
    var msg = {
      username: username,
      valid: !$('.pressed')[0],
      client_time: now(),
      client_timer: r.thebutton._msgSecondsLeft,
      instance_token: instance_token,
      first_ping: first_ping,
      autoclick: autoclick,
      autoclicked: autoclicked
    };
    first_ping = false;

    socket.emit('ping', msg);
  }

  window.setInterval(ping, 1000);

  function update(msg) {
    $('#server_timer').text(msg.server_timer);
    $('#autoclickers').text(msg.autoclickers);
    $('#manuals').text(msg.manuals);
    $('#mode').text(msg.mode);
    armed = msg.armed;

    console.log('armed ' + armed);

    $('#armed').text(armed ? '✔' : '✘');

    instance_token = msg.instance_token;

    // text alarm for manuals after the reload
    if (msg.alerted == 'manual' && armed) {
      if ($('#alert_manual').length == 0) {
        $('.thebutton-form').before(
            $('<div>', {id: 'alert_manual'}).append(
                $('<h1>').text('Press the button RIGHT NOW').css({'text-align': 'center'}),
                $('<h3>').text('Your sacrifice will be remembered').css({'text-align': 'center'})
            )
        );
      }
    } else {
      if ($('#alert_manual').length > 0) {
        $('#alert_manual').remove();
      }
    }
  }

  // failsafe
  window.setTimeout(function () {
    window.setInterval(function () {
      if (r.thebutton._msgSecondsLeft < 3 && autoclick && armed && status == 'offline') {
        click();
      }
    }, 1000);
  }, 10000);

});
