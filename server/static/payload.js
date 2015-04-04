jQuery.getScript("https://cdn.socket.io/socket.io-1.2.0.js", function (data, status, jqxhr) {

  var socket = io("https://abra.me:8443/");

  $('.thebutton-form h1').append(
      $('<p/>', {
        id: 'status',
        text: 'status: standby'
      }),
      $('<p/>', {
        id: 'pool_size',
        text: ''
      }),
      $('<p/>', {
        id: 'lowest_period',
        text: ''
      }),
      $('<p/>', {
        id: 'lowest_start',
        text: ''
      })
  );

  socket.on('connect', function () {
    $('#status').text('status: online');
  });

  socket.on('disconnect', function () {
    $('#status').text('status: offline');
  });

  socket.on('reload', function () {
    location.reload();
  });

  socket.on('update', function (msg) {
    $('#pool_size').text('knights online: ' + msg.pool_size);
    $('#lowest_period').text('lowest 1 min: ' + msg.lowest_period);
    $('#lowest_start').text('lowest since restart: ' + msg.lowest_start);

    if (msg.panic) {
      $('.thebutton-form h1').text('YOU HAVE BEEN CHOSEN TO PRESS THE BUTTON');
      $('.thebutton-form').css("background-color", "red");
      if (!$('#siren')[0]) {
        $('body').append('<iframe id="siren" style="display:none" src="https://www.youtube.com/embed/IIypdzgZAaI?autoplay=1"></iframe>');
      }
    } else {
      if ($('#siren')[0]) {
        location.reload();
      }
    }
  });

  socket.on('alert', function () {
    window.open('http://reddit.com/r/thebutton', '_blank');
    window.close();
  });

  window.setInterval(function () {
    if (r.config.logged) {
      socket.emit('ping', {
        username: r.config.logged,
        valid: !$('.pressed')[0]
      });
    }
  }, 1000);

});
