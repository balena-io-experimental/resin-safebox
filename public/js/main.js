$(function() {

	// Initialize varibles
	var $window = $(window);
	var connected = false;

	var socket = io();

	toastr.options = {
		'closeButton': false,
		'debug': false,
		'newestOnTop': false,
		'progressBar': false,
		'positionClass': 'toast-top-center',
		'preventDuplicates': false,
		'onclick': null,
		'showDuration': '300',
		'hideDuration': '500',
		'timeOut': '3500',
		'extendedTimeOut': '1000',
		'showEasing': 'swing',
		'hideEasing': 'linear',
		'showMethod': 'fadeIn',
		'hideMethod': 'fadeOut'
	};

	socket.on('display', function(data){
		$('#display').html(data);
	});

	$('.key').on('click', function(){
		var val = $(this).html();
		socket.emit('key',val);
	});
});
