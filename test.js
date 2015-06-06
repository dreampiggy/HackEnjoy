var WebSocket = require('ws')
  , ws = new WebSocket('ws://localhost:3000');
var request = require('superagent');

function sendWebSocket(){
	ws.on('open', function() {
		console.log('open!');
		var random = Math.floor(Math.random() * ( 100 + 1));
		var randomCard = 100 + Math.floor(Math.random() * (999 + 1));
		var sendJSON = {
			content : '1😔',
			nickname : '213133' + randomCard
		}
		function send(){
			ws.send(JSON.stringify(sendJSON));
		}
	    setInterval(send,1000);
	});
	ws.on('message', function(message) {
		var random = Math.floor(Math.random() * ( 100 + 1));
		var randomCard = 100 + Math.floor(Math.random() * (999 + 1));
		var sendJSON = {
			content : '吃我弹幕炸弹' + random + '号',
			nickname : '213133' + randomCard
		}
	    console.log('received: %s', message);

	    // ws.send(JSON.stringify(sendJSON));
	});
	ws.on('close', function() {
		console.log('end');
	});
}

function sendHTTP(){
	var time = Math.round(new Date().getTime()/1000);
	var random = Math.floor(Math.random() * ( 100 + 1));
	var randomCard = 100 + Math.floor(Math.random() * (999 + 1));
	var sendJSON = {
		content : '吃我弹幕炸弹' + random + '号',
		nickname : '213133' + randomCard
	}
	request
		.post('http://localhost:8080/')
		.send(sendJSON)
		.end(function(err, res){
		if (err){
			console.log('error!');
		}
		else{
			console.log('success!');
		}
	});
}

sendWebSocket();//启动WebSocket