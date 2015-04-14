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

  console.log(log.length);
  console.log(JSON.stringify(log[n - 1]));
  var diff = nowTime - tickTime;
  console.log(diff);

  if (!clicked && n > 10 && log[n - 1].seconds == 50 && diff < 0.1) {
    clicked = true;
    $.request("press_button", log[n - 4], function (e) {
      console.log(e);
    });
    alert('click!');
  }
}, 50);
