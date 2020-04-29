var config = require('./config');
var mysql = require('mysql');
var secret = require("./secret");
if(config.dbreaduserhost == "example.com"){
	console.log("I´m sorry. You need to fill out config.json first!");
}else{
var db = mysql.createPool({
	connectionLimit : 100,
	host: config.dbreaduserhost,
	user: config.dbreaduser,
	password: secret.dbreaduserpwd,
	charset : 'utf8mb4'
});
//MySQL Syntax
let sqlcmdtableMorgenpost = "DROP TABLE `region`;"
let sqlcmdtableRisklayer = "DROP TABLE `risklayer`;"


//Drop Table
db.getConnection(function(err, connection){
	if (err) throw err;
	connection.query("USE " + config.database + ";", function(err, result){
		console.log("DB switched " + config.database);
		connection.query(sqlcmdtableMorgenpost, function(err, result){
            if(err) throw err;
			console.log("Table region dropped");
        });
		connection.query(sqlcmdtableRisklayer, function(err, result){
            if(err) throw err;
			console.log("Table risklayer dropped");
        });
    	connection.release();
	});
});
}