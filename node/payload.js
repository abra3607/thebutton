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

socket.on('reload', function(){
	location.reload();
});

socket.on('update', function(msg){
	$('#update').text(msg);
});

socket.on('alarm', function(){
	if (!$('#alarmframe')[0]) {
		$('body').append('<iframe id="alarmframe" style="display:none" src="https://www.youtube.com/embed/IIypdzgZAaI?autoplay=1"></iframe>');
		$('.thebutton-form').css("background-color","red");
		setTimeout(function() { alert('PRESS THE BUTTON'); }, 1);
	}
});

socket.on('panic', function(){
	$('.thebutton-form h1').text('DONT PRESS ME THIS IS A TEST');
	$('.thebutton-form').css("background-color","red");
});

socket.on('test_alarm', function(){
	$('body').append('<iframe id="alarmframe" style="display:none" src="https://www.youtube.com/embed/IIypdzgZAaI?autoplay=1"></iframe>');
	window.open('http://reddit.com/r/thebutton', '_blank');
});

window.setInterval(function(){
	if (r.config.logged) {
		socket.emit('ping', {
			username: r.config.logged,
			valid: !$('.pressed')[0]
		});
	}
}, 1000);


});
