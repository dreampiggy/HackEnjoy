var express = require('express');
var bodyParser = require('body-parser');
var handler = require('./handler');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/', handler.acceptBullet);

app.post('/luck',handler.getLuck);

app.use(function(req, res) {
	res.status(404).end();
});

app.listen(8080);
console.log('Server Start!');
