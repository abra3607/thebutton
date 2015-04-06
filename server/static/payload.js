jQuery.getScript("https://cdn.socket.io/socket.io-1.2.0.js", function (data, status, jqxhr) {

  function now() {
    return new Date().getTime() / 1000;
  }

  function click() {
    //$('#thebutton').trigger('click');
    $('.thebutton-form').before(
        $('<h3>You have been ordered to autoclick</h3>').css({
          'text-align': 'center'
        }),
        $('<h3>Your sacrifice will be remembered</h3>').css({
          'text-align': 'center'
        })
    );
    alert('clicked!');
  }

  var socket = io("https://abra.me:8443/");

  var instance_token = 'not_set';

  $('.thebutton-form').before(
      $('<div/>').append(
          $('<p>status: <b id="status">connecting...</b></p>'),
          $('<p>server timer: <b id="server_timer">?</b></p>'),
          $('<p>autoclickers: <b id="autoclickers">?</b></p>'),
          $('<p>manuals: <b id="manuals">?</b></p>'),
          $('<p><input id="autoclick" type="checkbox" checked>autoclick</input></p>')
      )
  );
  $('.thebutton-form').after('<div><img src="http://abra.me:8080/static/plot.png"></div>');
  $('.thebutton-form').after(
      $('<div/>').append(
          $('<iframe/>', {
            src: "https://kiwiirc.com/client/irc.freenode.net/?nick=knight|?#buttonknights"
          }).css({
            width: "80%",
            height: "800px"
          })
      )
  );

  socket.on('connect', function () {
    $('#status').text('online');
  });

  socket.on('disconnect', function () {
    $('#status').text('offline');
  });

  socket.on('reload', function () {
    location.reload();
  });

  socket.on('update', function (msg) {
    $('#server_timer').text(msg.server_timer);
    $('#autoclickers').text(msg.autoclickers);
    $('#manuals').text(msg.manuals);

    instance_token = msg.instance_token;

    if (msg.alerted == 'manual') {
      if ($('#click_order').length == 0) {
        $('.thebutton-form').before(
            $('<div/>', {id: 'click_order'}).append(
                $('<h1>Press the button RIGHT NOW</h1>', {id: 'right_now'}).css({
                  'text-align': 'center'
                }),
                $('<h3>Your sacrifice will be remembered</h3>').css({
                  'text-align': 'center'
                })
            )
        );
      }
    }
  });

  socket.on('click', function () {
    click();
  });

  socket.on('alert', function () {
    window.open('https://www.youtube.com/embed/c-EiIQfR-dc?autoplay=1&end=13');
    window.open('https://reddit.com/r/thebutton');
  });

  window.setInterval(function () {
    if (r.config.logged) {
      socket.emit('ping', {
        username: r.config.logged,
        valid: !$('.pressed')[0],
        client_time: now(),
        autoclick: $('#autoclick').is(':checked'),
        instance_token: instance_token
      });
    }
    if ($('#click_order').length > 0) {
      if ($('.pressed').length == 0) {
        $('#click_order').remove();
      } else {
        $('#right_now').remove();
      }
    }
  }, 1000);

  // failsafe
  window.setTimeout(function () {
    window.setInterval(function () {
      if (r.thebutton._msgSecondsLeft < 3) {
        click();
      }
    }, 1000);
  }, 10000);

});
