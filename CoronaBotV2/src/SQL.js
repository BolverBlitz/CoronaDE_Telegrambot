const url = "https://funkeinteraktiv.b-cdn.net/current.v4.csv";
const RKIurl = 'https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&outFields=*&orderByFields=OBJECTID&resultOffset=0&resultRecordCount=1000&cacheHint=true'
const RiskLayer = 'http://www.risklayer-explorer.com/media/data/events/Germany_20200321v2.csv'

const request = require("request");
var fs = require("fs"); //Debugging

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

function cleanString(input) {
	var output = "";
    for (var i=0; i<input.length; i++) {
        if (input.charCodeAt(i) <= 127 || input.charCodeAt(i) === 223 || input.charCodeAt(i) === 252 || input.charCodeAt(i) === 228 || input.charCodeAt(i) === 246 || input.charCodeAt(i) === 196 || input.charCodeAt(i) === 214 || input.charCodeAt(i) === 220) {
            output += input.charAt(i);
        }
    }
    return output;
}

function GetCSVPositionMP(KeyString) {
    ErsteZeileMorgenpostArr = ErsteZeileMorgenpost.split(',');
    return ErsteZeileMorgenpostArr.indexOf(KeyString)
}
function GetCSVPositionRL(KeyString) {
    ErsteZeileRisklayerArr = ErsteZeileRisklayer.split(',');
    return ErsteZeileRisklayerArr.indexOf(KeyString)
}

var ErsteZeileMorgenpost = "";
var ErsteZeileRisklayer = "";
const BundesländerKürtzel = ['de.bw','de.by','de.be','de.bb','de.hb','de.he','de.mv','de.hh','de.nd','de.nw','de.rp','de.sl','de.sn','de.st','de.sh','de.th']
const BundesländerArray = ['Baden-Württemberg','Bayern','Berlin','Brandenburg','Bremen','Hamburg','Hessen','Mecklenburg-Vorpommern','Niedersachsen','Nordrhein-Westfalen','Rheinland-Pfalz','Saarland','Sachsen','Sachsen-Anhalt','Schleswig-Holstein','Thüringen', 'nicht-zugeordnet']

let updateDB = function() {
	return new Promise(function(resolve, reject) {
		let sqlcmdadduser = "REPLACE INTO region (TimeStamp, Bundesland, Ort, Quelle, QuelleURL, confirmed, recovered, deaths, population) VALUES ?";
		request(url, { json: true }, (err, res, body) => {
			if (err) { throw err; }
			db.getConnection(function(err, connection){
				let out = {
					Text: "Updated finished!",
					count: 0
					};

					let Barr = body.split("\n")

					for (i = 1; i < Barr.length-1 ; i++) { 
						ErsteZeileMorgenpost = Barr[0]
						let tempBarr =  Barr[i].split(",");
						BundesländerKürtzel.map((BundesländerKürtzelMap) =>{
							if(tempBarr[GetCSVPositionMP("parent")].includes(BundesländerKürtzelMap)){
								BundesländerArray.map((BundesländerArrayMap) =>{
									if(tempBarr[GetCSVPositionMP("label_parent")].includes(BundesländerArrayMap)){
										if(tempBarr[GetCSVPositionMP("label_en")] === "NaN"){
											var TimeTemp = "123456789";
										}else{
											var TimeTemp = tempBarr[GetCSVPositionMP("updated")]/1000;
										}
										let Quelle = tempBarr[GetCSVPositionMP("source")].replace(/["]/g,'',)
										let sqlcmdadduserv = [[TimeTemp, tempBarr[GetCSVPositionMP("label_parent")], tempBarr[GetCSVPositionMP("label")], Quelle, tempBarr[GetCSVPositionMP("source_url")], tempBarr[GetCSVPositionMP("confirmed")], tempBarr[GetCSVPositionMP("recovered")], tempBarr[GetCSVPositionMP("deaths")], tempBarr[GetCSVPositionMP("population")]]];
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

let updateDBRisklayer = function() {
	return new Promise(function(resolve, reject) {
		let sqlcmdadduser = "REPLACE INTO risklayer (TimeStamp, Ort, QuelleURL, confirmed, recovered, deaths, population) VALUES ?";
		request(RiskLayer, { json: true }, (err, res, body) => {
			if (err) { throw err; }
			db.getConnection(function(err, connection){
				let out = {
					Text: "Updated finished!",
					count: 0
					};

					let Barr = body.split("\n")
					
					for (i = 1; i < Barr.length-1 ; i++) { 
						ErsteZeileRisklayer = Barr[0] //Wenn über 10, dann MUSS eins Addiert werden da 'data' in 2 teile geteilt wird.
						let tempBarr =  Barr[i].split(",");
						if(tempBarr.length >= 16){
						
							var DateTimeTemp = tempBarr[GetCSVPositionRL("Date")].replace(/["]/g,'',) + tempBarr[1+GetCSVPositionRL("Date")].replace(/["]/g,'',);
							var DateTimeTemp = DateTimeTemp.split(" ");
							var DateTemp = DateTimeTemp[0].split("-");
							var TimeTemp = DateTimeTemp[1].split(":");
							var newDate = DateTemp[0] + "/" + DateTemp[1] + "/" + DateTemp[2];

							if(tempBarr[1+GetCSVPositionRL("Source")].includes('"')){
								var TempUrl = tempBarr[3+GetCSVPositionRL("Source")]
							}else{
								var TempUrl = tempBarr[2+GetCSVPositionRL("Source")]
							}

							var TimeDoneUnix = new Date(newDate).getTime() + TimeTemp[0] * 60 * 60 * 1000 + TimeTemp[1] * 60 * 1000 + 00 * 1000 + 60 * 60 * 1000;
							let sqlcmdadduserv = [[TimeDoneUnix/1000, tempBarr[GetCSVPositionRL("Name")], TempUrl, tempBarr[GetCSVPositionRL("Cumulative")], tempBarr[GetCSVPositionRL("Recovered")], tempBarr[GetCSVPositionRL("Dead")], tempBarr[GetCSVPositionRL("Population")]]];	
							connection.query(sqlcmdadduser, [sqlcmdadduserv], function(err, result) {
								//console.log(sqlcmdadduserv)
								if (err) { throw err; }
							});			
							out.count++;
						}else{
							console.log("Fehlerhafte Zeile" + i);
						}
					}
						connection.release();
						resolve(out);
				});
			});
	});
};


let lookup = function(para) {
	return new Promise(function(resolve, reject) {
		if(para.table === "region"){
			if(para.mode === "LIKE"){var sqlcmd = "SELECT TimeStamp, Bundesland, Ort, Quelle, QuelleURL, confirmed, recovered, deaths, population FROM region where " + para.collum + " LIKE '%" + cleanString(para.lookup.trim()) + "%' LIMIT " + para.limit;}
			//if(para.mode === "EQUEL"){var sqlcmd = "SELECT Haltestellenname,VGNKennung,Ort FROM Haltestellen where " + para.collum + " ='" + para.lookup.trim() + "' LIMIT " + para.limit;}
		}
		if(para.table === "risklayer"){
			if(para.mode === "LIKE"){var sqlcmd = "SELECT TimeStamp, Ort, QuelleURL, confirmed, recovered, deaths, population FROM risklayer where " + para.collum + " LIKE '%" + cleanString(para.lookup.trim()) + "%' LIMIT " + para.limit;}
		}
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
	updateDBRisklayer,
	lookup
};