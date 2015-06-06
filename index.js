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
  console.log(json);
  session.replyTextMsg('发送成功!');
});
wechat.on('image', function(session) {
  session.replyNewsMsg([{
    Title: '新鲜事',
    Description: '点击查看今天的新鲜事',
    PicUrl: 'http://..',
    Url: 'http://..'
  }]);
});
wechat.on('voice', function(session) {
  session.replyMsg({
    Title: 'This is Music',
    MsgType: 'music',
    Description: 'Listen to this music and guess ths singer',
    MusicUrl: 'http://..',
    HQMusicUrl: 'http://..',
    ThumbMediaId: '..'
  });
});



app.post('/', handler.acceptBullet);

// app.post('/luck',handler.getLuck);

app.use(function(req, res) {
	res.status(404).end();
});



app.listen(80);
console.log('Server Start!');
