var connection = require('./config');
var request = require('superagent');
var events = require("events");
var io = require('socket.io')(3000);
var Wechat = require('nodejs-wechat');
var emitter = new events.EventEmitter();

var opt = {
  token: 'uniquehackday',
  url: '/weixin'
};
var wechat = new Wechat(opt);


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
     // ToUserName: 'gh_e5efdd82c3d4',
     // FromUserName: 'oH_xis15rtTiWz88QL4AwWKrZEFg',
     // CreateTime: '1433582707',
     // MsgType: 'text',
     // Content: '5',
     // MsgId: '6157190842889486224',
     // Encrypt: '加密垃圾'}
     var nickname = json.FromUserName;
     var content = json.Content;

     console.log(content);

     var result = {
     	nickname: nickname,
     	content: content
     }
     var bullet = checkBullet(result);

     emitter.emit('bullet come',bullet);

     session.replyTextMessage('文字弹幕已上膛发射！');
});

wechat.on('image', function(session) {
  var picUrl = session.incomingMessage.PicUrl;
  var nickname = session.incomingMessage.FromUserName;
  console.log(session.incomingMessage.PicUrl);

 request
   .get(picUrl)
   .end(function(err, res){
      if(err){
        session.replyTextMessage('图片炮弹过大，请找个小点的');
        return;
      }

      var imageBase64 = new Buffer(res.body, 'base64').toString();

      var bullet = checkBullet({
      	type: "image",
      	base64: imageBase64
      })

  	  emitter.emit('bullet come',bullet);

   });

  session.replyTextMessage('图片炮弹正装膛点燃！');
});
wechat.on('voice', function(session) {
  console.log(session);
  session.replyTextMessage('语音炸弹将高空落下！');
});





(function websocket(){
	io.on('connection', function connection(ws) {
		console.log('WebSocket start!');

		var sendBullet = function(bullet){
			var sendJSON = bullet;
			ws.send(JSON.stringify(sendJSON));//加入判断
		};
		var heartTimer = setInterval(function(){
			ws.send('');//发送心跳包防止WebSocket断开
		},1000*60*3);

		emitter.addListener('bullet come',sendBullet);//加入对字幕请求的监听器

		// getTime(uuid,function(time){
		// 	getBullet(time,function(results){
		// 		if (results){
		// 			ws.send(JSON.stringify(results));
		// 		}
		// 	});
		// });

		ws.on('message', function incoming(message) {
			console.log(message);
			try{
				message = JSON.parse(message);
				var result = checkBullet(message);
				if (result){
					ws.send(JSON.stringify(result));
				}
			}
			catch (e){
				console.log('fuck');
			}
		});

		ws.on('close', function close(){
			emitter.removeListener('bullet come',sendBullet);//取消监听器
			clearInterval(heartTimer);//取消心跳包
			// saveTime(uuid);
		})
	});
})();


// function getLuck (req,res) {
// 	if (!req.body){
// 		res.status(403).end();
// 		return;
// 	}
// 	var movieid = checkLuck(req.body['movieid']);

// 	if (movieid){
// 		getRandomID(function(result){
// 			res.end(result);//发送抽奖结果
// 		})
// 	}
// 	else{
// 		res.status(403).end();
// 		return;
// 	}
// }

// function checkLuck (movieid) {
// 	if (movieid == MOVIE_ID){//保留字，视频ID，暂时定义为000000001
// 		return movieid;
// 	}
// 	else{
// 		return null;
// 	}
// }

// function getRandomID(callback){
// 	connection.query('SELECT * FROM user ORDER BY RAND() LIMIT 1',//参与人数不超过全校人数，性能足够
// 		function(err, results) {
// 		if (err){
// 			console.log(err);
// 			callback('null');//没人中奖
// 		}
// 		else if (!results || results.length == 0){
// 			console.log('fuck');
// 			callback('null');//没人中奖
// 		}
// 		else{
// 			callback(results[0]['id']);
// 		}
// 	});
// }


function acceptBullet(fileType, content){

	var bullet = 'fuck';

	// var bullet = checkBullet(req.body);

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


var getRandomColor = function() {
    return '#' + (function(color) { 
        //这个写法比较有意思,Math.floor(Math.random()*16);返回的是一个小于或等于16的数.然后作为0123456789abcdef的下标,这样每次就会得到一个这个字符串当中的一个字符
    return (color += '0123456789abcdef' [Math.floor(Math.random() * 16)]) 
        //然后判断这个新字符串的长度是否到6,因为16进制的颜色是由6个字符组成的,如果到6了,就返回这6个字符拼成的字符串,如果没有就执行arguments.callee(color)也就是函数本身.
        && (color.length == 6) ? color: arguments.callee(color); //将''字符串传给color
    })('');
}


function checkBullet (results){
	if (!results || !results['content']){
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

	if (results['image']){
		bullet.type = "image";
		bullet.content = results['base64'];
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

	var time = bullet.time;
	var nickname = bullet.nickname;
	var content = bullet.content;

	connection.query('INSERT INTO bullet SET time = ?,nickname = ?,content = ?',
		[time,movieid,content,studentNum],
		function(err, results) {
		if (err){
			console.log(err);
		}
		else{
			//ok
		}
	});

	// connection.query('INSERT INTO user SET id = ?,count = 0 ON DUPLICATE KEY UPDATE count = count+1',
	// 	[studentNum],
	// 	function(err,results){
	// 	if(err){
	// 		console.log(err);
	// 	}
	// 	else{
	// 		//ok
	// 	}
	// });

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

// exports.getLuck = getLuck;
exports.getWeixin = getWeixin;
exports.postWeixin = postWeixin;
exports.acceptBullet = acceptBullet;