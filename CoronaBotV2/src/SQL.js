const url = "https://funkeinteraktiv.b-cdn.net/current.v3.csv";
var RKIurl = 'https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=OBJECTID&resultOffset=0&resultRecordCount=1000&cacheHint=true'

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

const BundesländerKürtzel = ['de.bw','de.by','de.be','de.bb','de.hb','de.he','de.mv','de.nd','de.nd','de.nw','de.rp','de.sl','de.sn','de.st','de.sh','de.th']
const BundesländerArray = ['Baden-Württemberg','Bayern','Berlin','Brandenburg','Bremen','Hamburg','Hessen','Mecklenburg-Vorpommern','Niedersachsen','Nordrhein-Westfalen','Rheinland-Pfalz','Saarland','Sachsen','Sachsen-Anhalt','Schleswig-Holstein','Thüringen', 'nicht-zugeordnet']

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
						BundesländerKürtzel.map((BundesländerKürtzelMap) =>{
							if(tempBarr[1].includes(BundesländerKürtzelMap)){
								BundesländerArray.map((BundesländerArrayMap) =>{
									if(tempBarr[3].includes(BundesländerArrayMap)){

						if(tempBarr[4] === "NaN"){
							var TimeTemp = "123456789";
						}else{
							var TimeTemp = tempBarr[10]/1000;
						}
						let Quelle = tempBarr[15].replace(/["]/g,'',)
						let sqlcmdadduserv = [[TimeTemp, tempBarr[3], tempBarr[2], Quelle, tempBarr[16], tempBarr[12], tempBarr[13], tempBarr[14]]];
						
						connection.query(sqlcmdadduser, [sqlcmdadduserv], function(err, result) {
							//console.log(sqlcmdadduserv)
							if (err) { throw err; }
						});
						
						out.count++;
					}
				});
					}
				});
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