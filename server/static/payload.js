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
      }),
      $('<input id="autoclick" type="checkbox">autoclick</input>')
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
      if ($('autoclick').is(':checked')) {
        $('#thebutton').trigger('click');
      } else {
        if (!$('#alarm')[0]) {
          var alarm = $('<div></div>', {
            id: 'alarm'
          });

          alarm.append(
              $('<h1></h1>', {
                text: 'You have been chosen to press the button'
              }));

          alarm.append(
              $('<iframe></iframe>', {
                style: 'display:none',
                src: 'https://www.youtube.com/embed/IIypdzgZAaI?autoplay=1'
              }));

          $('.thebutton-form').prepend(alarm);
        }
      }
    } else {
      if ($('#alarm')[0]) {
        $('#alarm').remove();
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
