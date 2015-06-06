var connection = require('./config');
var request = require('superagent');
var events = require("events");
var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server
var wss = new WebSocketServer({ port: 3000 });
var Wechat = require('nodejs-wechat');
var emitter = new events.EventEmitter();

var opt = {
  token: 'uniquehackday',
  url: '/weixin'
};
var wechat = new Wechat(opt);
var uuid = '1';//uuid 客户端提供

function getWeixin(req,res){
	var bindFunc = wechat.verifyRequest.bind(wechat);
	bindFunc(req,res);
}

function postWeixin(req,res){
	var bindFunc = wechat.handleRequest.bind(wechat);
	bindFunc(req,res);
}


wechat.on('text', function(session) {
	var json = session.incomingMessage;
	var nickname = json.FromUserName;
	var content = json.Content;

	var result = {
		nickname: nickname,
		content: content
	}
	var bullet = checkBullet(result);

	emitter.emit('bullet come',bullet);
	session.replyTextMessage('文字弹幕已上膛发射！');
});

wechat.on('image', function(session) {
	var picurl = session.incomingMessage.PicUrl;
	var nickname = session.incomingMessage.FromUserName;

	var preBullet = {
		nickname: nickname,
		type: 'image',
		url: picurl
	};

	var bullet = checkBullet(preBullet);

	emitter.emit('bullet come',bullet);
	session.replyTextMessage('图片炮弹正装膛点燃！');
});

wechat.on('voice', function(session) {
  session.replyTextMessage('语音炸弹将高空落下！');
});


(function websocket(){
	wss.on('connection', function connection(ws) {
		console.log('WebSocket start!');
		var sendBullet = function(bullet){
			console.log(bullet);
			ws.send(JSON.stringify(bullet));
		};
		var heartTimer = setInterval(function(){
			ws.send('');//发送心跳包防止WebSocket断开
		},1000*60*3);

		ws.on('open', function open(){
			emitter.addListener('bullet come',sendBullet);//加入对字幕请求的监听器

			getTime(uuid,function(time){
				getBullet(time,function(results){
					if (results){
						for (var i = 0; i < results.length; i++) {
							results[i]['time'] = null;
							ws.send(results[i]);
						};
					}
				});
			});
		});

		ws.on('message', function incoming(message) {
			try{
				message = JSON.parse(message);
				var result = checkBullet(message);
				if (result){
					ws.send(JSON.stringify(result));
					saveBullet(result);
				}
			}
			catch (e){
				console.log('Not legal bullet');
			}
		});

		ws.on('close', function close(){
			emitter.removeListener('bullet come',sendBullet);//取消监听器
			clearInterval(heartTimer);//取消心跳包
			saveTime(uuid);
		});
	});
})();


function getLuck (req,res) {
	getRandomID(function(result){
		res.end(result);//发送抽奖结果
	})
}


function getRandomID(callback){
	connection.query('SELECT * FROM user ORDER BY RAND() LIMIT 1',//参与人数不超过全校人数，性能足够
		function(err, results) {
		if (err){
			console.log(err);
			callback('null');//没人中奖
		}
		else if (!results || results.length == 0){
			console.log('fuck');
			callback('null');//没人中奖
		}
		else{
			callback(results[0]['id']);
		}
	});
}


var getRandomColor = function() {
	var colors = ["#F44336","#E91E63","#9C27B0","#673AB7","#3F51B5","#2196F3","#03A9F4","#00BCD4","#009688","#4CAF50","#8BC34A","#CDDC39","#FFEB3B","#FFC107","#FF9800","#FF5722","#795548","#9E9E9E","#607D8B","#000000"];
	var randomNum = Math.floor(Math.random() * ( 20 + 1));
	return colors[randomNum];
}


function checkBullet (results){
	if (!results){
		return null;
	}

	var bullet = {
	  type: "text",
	  color : "#ffffff",
	  fontsize : "1",
	  content : "foo",
	  duration : "1000",
	  nickname : "foo"
	};

	if (results['type'] == 'image'){
		bullet.nickname = results['nickname'];
		bullet.type = 'image';
		bullet.content = '';
		bullet.url = results['url'];
		return bullet;
	}

	var color = getRandomColor();
	var fontsize = 1 + Math.random() * 2;//1 - 3
	var nickname = results['nickname'];//保留
	var content = results['content'];
	var duration = 3000 + Math.floor(Math.random() * ( 2000 + 1));//3000-5000

	bullet.color = color;
	bullet.fontsize = fontsize;
	bullet.content = content;
	bullet.duration = duration;
	bullet.nickname = nickname

	return bullet;
}

function saveBullet (bullet) {
	if (!bullet){
		return;
	}
	console.log(bullet);

	var time = Math.round(new Date().getTime()/1000);
	var nickname = bullet.nickname;
	var content = bullet.content;

	connection.query('INSERT INTO bullet SET time = ?,nickname = ?,content = ?',
		[time,nickname,content],
		function(err, results) {
		if (err){
			console.log('error at saveBullet')
			console.log(err);
		}
		else{
			//ok
		}
	});

	connection.query('INSERT INTO user SET nickname = ?,count = 0 ON DUPLICATE KEY UPDATE count = count+1',
		[nickname],
		function(err,results){
		if(err){
			console.log('err at insert user');
			console.log(err);
		}
		else{
			//ok
		}
	});
}

function getBullet (time,callback){
	connection.query('SELECT time,nickname,content FROM bullet WHERE time > ? ORDER BY id DESC LIMIT 5',
		[time],//最多会取最近的5条
		function(err,results){
		if (err){
			console.log('error at getBullet');
			console.log(err);
			callback(null);
		}
		else if (!results || results.length == 0){
			callback(null);
		}
		else{
			console.log(results);
			callback(results);
		}
	});
}

function saveTime (clientID){
	var time = Math.round(new Date().getTime()/1000);
	connection.query('INSERT INTO client SET id = ?,time = ? ON DUPLICATE KEY UPDATE time = ?',
		[clientID,time,time],
		function(err,results){
		if (err){
			console.log('error at saveTime');
			console.log(err);
		}
		else{
			return true;//ok
		}
	});
}

function getTime (clientID,callback){
	var time = Math.round(new Date().getTime()/1000);
	connection.query('SELECT time FROM client WHERE id = ?',
		[clientID],
		function(err,results){
		if (err){
			console.log('error at getTime');
			callback(time);
		}
		else if (!results || results.length == 0){
			callback(time);
		}
		else{
			callback(results[0]['time']);
		}
	});
}

exports.getLuck = getLuck;
exports.getWeixin = getWeixin;
exports.postWeixin = postWeixin;