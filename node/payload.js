jQuery.getScript("https://cdn.socket.io/socket.io-1.2.0.js", function(data, status, jqxhr) {

var socket = io("http://abra.me/");

$('.thebutton-form h1').append(
	$('<p/>', {
		id: 'status',
		text: 'status: standby'
	}),
	$('<p/>', {
		id: 'update',
		text: ''
	})
);

socket.on('connect', function(){
	$('#status').text('status: online');
});

socket.on('disconnect', function(){
	$('#status').text('status: offline');
	// alert('Reload the page!');
});

socket.on('update', function(msg){
	$('#update').text(msg);
});

socket.on('alert', function(){
	if (!$('#alarmframe')[0]) {
		$('body').append('<iframe id="alarmframe" style="display:none" src="https://www.youtube.com/embed/IIypdzgZAaI?autoplay=1"></iframe>');
		$('.thebutton-form').css("background-color","red");
		setTimeout(function() { alert('PRESS THE BUTTON'); }, 1);
	}
});

window.setInterval(function(){
	socket.emit('ping', {
		username: r.config.logged,
		valid: !$('.pressed')[0]
	});
}, 1000);


});
