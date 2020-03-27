const url = "";
const request = require("request");

var config = require("../config");
var mysql = require("mysql");
var secret = require("../secret");

var db = mysql.createPool({
	connectionLimit : 100,
	host: config.dbreaduserhost,
	user: config.dbreaduser,
	password: secret.dbreaduserpwd,
	database: config.database,
	charset : "utf8mb4"
});

let updateDB = function() {
	return new Promise(function(resolve, reject) {
		let sqlcmdadduser = "REPLACE INTO region (TimeStamp, Bundesland, Ort, Quelle, QuelleURL, confirmed, recovered, deaths) VALUES ?";
		request(url, { json: true }, (err, res, body) => {
			if (err) { throw err; }
			db.getConnection(function(err, connection){
				let out = {
					Text: "Updated finished!",
					count: 0
					};

					let Barr = body.split("\n")

					for (i = 1; i < Barr.length-1 ; i++) { 

						let tempBarr =  Barr[i].split(",");
						if(tempBarr[4] === "NaN"){
							var TimeTemp = "123456789";
						}else{
							var TimeTemp = tempBarr[4]/1000;
						}
						let Quelle = tempBarr[10].replace(/["]/g,'',)
						let sqlcmdadduserv = [[TimeTemp, tempBarr[0], tempBarr[1], Quelle, tempBarr[11], tempBarr[5], tempBarr[6], tempBarr[7]]];
						connection.query(sqlcmdadduser, [sqlcmdadduserv], function(err, result) {
							//console.log(sqlcmdadduserv)
							if (err) { throw err; }
						});
						out.count++;
					}

						connection.release();
						resolve(out);
					});
			});
	});
};


let lookup = function(para) {
	return new Promise(function(resolve, reject) {
		if(para.mode === "LIKE"){var sqlcmd = "SELECT TimeStamp, Bundesland, Ort, Quelle, QuelleURL, confirmed, recovered, deaths FROM region where " + para.collum + " LIKE '%" + para.lookup.trim() + "%' LIMIT " + para.limit;}
		//if(para.mode === "EQUEL"){var sqlcmd = "SELECT Haltestellenname,VGNKennung,Ort FROM Haltestellen where " + para.collum + " ='" + para.lookup.trim() + "' LIMIT " + para.limit;}
		//console.log(sqlcmd)
		db.getConnection(function(err, connection){
			connection.query(sqlcmd, function(err, rows){
				if (err) { throw err; }
				connection.release();
				resolve(rows);
			});
		});
	});
}


module.exports = {
	updateDB,
	lookup
};