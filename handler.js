var request = require('superagent');
var events = require("events");
var WebSocket = require('ws');
var connection = require('./config');

var WebSocketServer = WebSocket.Server
var wss = new WebSocketServer({ port: 3000 });
var emitter = new events.EventEmitter();

var MOVIE_ID = '000000001';
var UUID = '0000000000000001';

(function websocket(){
	wss.on('connection', function connection(ws) {
		console.log('WebSocket start!');
		var uuid = UUID;

		var sendBullet = function(bullet){
			var sendJSON = [bullet];
			ws.send(JSON.stringify(sendJSON));//加入判断
		};
		var heartTimer = setInterval(function(){
			ws.send('');//发送心跳包防止WebSocket断开
		},1000*60*3);

		emitter.addListener('bullet come',sendBullet);//加入对字幕请求的监听器

		getTime(uuid,function(time){
			getBullet(time,function(results){
				if (results){
					ws.send(JSON.stringify(results));
				}
			});
		});

		ws.on('message', function incoming(message) {
			//保留，比如可以发送过来你的uuid来识别用户
		});

		ws.on('close', function close(){
			emitter.removeListener('bullet come',sendBullet);//取消监听器
			clearInterval(heartTimer);//取消心跳包
			saveTime(uuid);
		})
	});
})();


function getLuck (req,res) {
	if (!req.body){
		res.status(403).end();
		return;
	}
	var movieid = checkLuck(req.body['movieid']);

	if (movieid){
		getRandomID(function(result){
			res.end(result);//发送抽奖结果
		})
	}
	else{
		res.status(403).end();
		return;
	}
}

function checkLuck (movieid) {
	if (movieid == MOVIE_ID){//保留字，视频ID，暂时定义为000000001
		return movieid;
	}
	else{
		return null;
	}
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


function acceptBullet(req,res){
	if (!req.body){
		res.status(403).end();
		return;
	}

	var bullet = checkBullet(req.body);

	console.log(req.body);

	if (bullet){
		res.status(200).end();
	}
	else{
		res.status(403).end();
		return;
	}

	saveBullet(bullet);
	emitter.emit('bullet come',bullet);
}

function checkBullet (results){
	var bullet = {
		time: '',
		movieid: MOVIE_ID,//保留字，视频ID，暂时定义为000000001
		content: '',
		studentNum: ''
	};

	var timeReg = /^\d+$/;
	var studentNumReg = /^\d{9}$/;

	if (!results.time || !results.movieid || !results.content ||!results.studentNum){
		return null;
	}
	if (!timeReg.test(results.time) || !studentNumReg.test(results.studentNum)){
		return null;
	}

	bullet.time = results.time;
	// bullet.movieid = results.movieid;//暂时不使用
	bullet.content = results.content;
	bullet.studentNum = results.studentNum;

	return bullet;
}

function saveBullet (bullet) {
	if (!bullet){
		return;
	}

	var time = bullet.time;
	var movieid = bullet.movieid;
	var content = bullet.content;
	var studentNum = bullet.studentNum;

	connection.query('INSERT INTO bullet SET time = ?,movieid = ?,content = ?,studentNum = ?',
		[time,movieid,content,studentNum],
		function(err, results) {
		if (err){
			console.log(err);
		}
		else{
			//ok
		}
	});
	connection.query('INSERT INTO user SET id = ?,count = 0 ON DUPLICATE KEY UPDATE count = count+1',
		[studentNum],
		function(err,results){
		if(err){
			console.log(err);
		}
		else{
			//ok
		}
	});
}

function getBullet (time,callback){
	connection.query('SELECT time,movieid,content,studentNum FROM bullet WHERE time > ? ORDER BY id DESC LIMIT 10',
		[time],//最多会取最近的10条
		function(err,results){
		if (err){
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

function saveTime (uuid){
	var time = Math.round(new Date().getTime()/1000);
	connection.query('INSERT INTO client SET uuid = ?,time = ? ON DUPLICATE KEY UPDATE time = ?',
		[uuid,time,uuid,time],
		function(err,results){
		if (err){
			console.log(err);
		}
		else{
			return true;//ok
		}
	});
}

function getTime (uuid,callback){
	var time = Math.round(new Date().getTime()/1000);
	connection.query('SELECT time FROM client WHERE uuid = ?',
		[uuid],
		function(err,results){
		if (err){
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
exports.acceptBullet = acceptBullet;