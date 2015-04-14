function getMsg() {
  return {
    seconds: r.thebutton._msgSecondsLeft,
    prev_seconds: r.thebutton._msgSecondsLeft,
    tick_time: r.thebutton._tickTime,
    tick_mac: r.thebutton._tickMac
  };
}

var log = [];

function now() {
  return new Date().getTime() / 1000;
}

var tickTime = 0;
var clicked = false;

setInterval(function () {
  var n = log.length;
  var nowTime = now();

  if (n == 0 || r.thebutton._tickMac !== log[n - 1].tick_mac) {
    tickTime = nowTime;
    log.push(getMsg());
    n += 1;
  }

  var diff = nowTime - tickTime;

  console.log(diff);
  var s = '' + n + ': ';
  for (var i = n - 1; i >= 0; i--) {
    s += '' + log[i].seconds + ' ';
  }
  console.log(s);

  var a = log[n - 1];
  var b = log[n - 11];

  if (!clicked && n > 30 && diff < 0.1 && a.seconds != b.seconds) {
    console.log('CLICK');
    console.log('now is ' + JSON.stringify(a));
    console.log('click as ' + JSON.stringify(b));
    clicked = true;
    $.request("press_button", b, function (e) {
      console.log(e);
    });
    alert('click!');
  }
}, 50);
