var mysql = require('mysql');
function connect(){
	var connection = mysql.createConnection({
		host     : 'localhost',
		user     : 'root',
		password : '1234',
		database : 'herald_bullet_screen',
	});

	connection.connect(function(err) {
		if (err) {
			console.error('Database connect error!\n' + err.stack);
			process.exit();
		}
		else{
			console.log('Database start!');
		}});
	return connection;
};

module.exports = connect();