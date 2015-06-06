var express = require('express');
var bodyParser = require('body-parser');
var handler = require('./handler');
var app = express();
var middlewares = require('express-middlewares-js');
var Wechat = require('nodejs-wechat');

var opt = {
  token: 'uniquehackday',
  url: '/weixin'
};
var wechat = new Wechat(opt);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/weixin', middlewares.xmlBodyParser({
  type: 'text/xml'
}));
app.get('/weixin', wechat.verifyRequest.bind(wechat));
app.post('/weixin', wechat.handleRequest.bind(wechat));


wechat.on('text', function(session) {
  var json = session.incomingMessage;
     // ToUserName: 'gh_e5efdd82c3d4',
     // FromUserName: 'oH_xis15rtTiWz88QL4AwWKrZEFg',
     // CreateTime: '1433582707',
     // MsgType: 'text',
     // Content: '5',
     // MsgId: '6157190842889486224',
     // Encrypt: '加密垃圾'}

     session.replyTextMessage('文字弹幕已上膛发射！');
});

wechat.on('image', function(session) {
  var picUrl = session.incomingMessage.PicUrl;
  console.log(session.incomingMessage.PicUrl);

 request
   .get(picUrl);
   .end(function(err, res){
      if(err){
        session.replyTextMessage('图片炮弹过大，请找个小点的');
      }
      console.log(res.files);
   });


  session.replyTextMessage('图片炮弹正装膛点燃！');
});
wechat.on('voice', function(session) {
  console.log(session);
  session.replyTextMessage('语音炸弹将高空落下！');
});

// app.post('/luck',handler.getLuck);

app.use(function(req, res) {
	res.status(404).end();
});



app.listen(80);
console.log('Server Start!');
