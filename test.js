var WebSocket = require('ws')
  , ws = new WebSocket('ws://123.57.143.92:3000');
var request = require('superagent');

function sendWebSocket(){
	ws.on('open', function() {
		console.log('open!');
	    ws.send('ok');
	});
	ws.on('message', function(message) {
	    console.log('received: %s', message);
	});
}

function sendHTTP(){
	var time = Math.round(new Date().getTime()/1000);
	var random = Math.floor(Math.random() * ( 100 + 1));
	var randomCard = 100 + Math.floor(Math.random() * (999 + 1));
	var sendJSON = {
		time : time,
		content : '吃我弹幕炸弹' + random + '号',
		movieid : '000000001',
		studentNum : '213133' + randomCard
	}
	request
		.post('http://123.57.143.92/')
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

setInterval(sendHTTP,100);//每0.1秒模拟发送1个字幕
sendWebSocket();//启动WebSocket
