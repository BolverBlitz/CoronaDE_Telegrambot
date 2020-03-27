var url = ''
const request = require("request");
const f = require("./funktions");
var config = require("../config");
var secret = require("../secret");
const util = require('util');
var fs = require("fs");


let getCorona = function getCorona() {
    return new Promise(function(resolve, reject) {
        var Output = "";
        f.log("Pushed: getCorona");
        request(url, (err, res, body) => {
            let CountLänder = 0;
            let confirmed = 0;
            let recovered = 0;
            let deaths = 0;
                var LT = fs.readFileSync('./data/last.csv');
                var LTarr = LT.toString().split(/\s+/);
                var LTarr = LTarr.toString().split(",");
                if (err) { reject(err) }

                var bodyarr = body.split(',')
                var StandZeit = 0;
                for(var i = 0; i < bodyarr.length;i++){
                    if(bodyarr[i].indexOf("Deutschland") >= 0){
                        if(CountLänder >= 16){
                            bodyarr[i+1] = "Unbekannter Standort"
                        }
                            if(bodyarr[i+2] >= StandZeit){
                                StandZeit = bodyarr[i+2]
                            }
                            confirmed = confirmed + parseInt(bodyarr[i+4])
                            recovered = recovered + parseInt(bodyarr[i+5])
                            deaths = deaths + parseInt(bodyarr[i+6])
						CountLänder++;
                    }
                }
               
            var Output = {
                confirmed: confirmed,
                confirmeddiff: confirmed - LTarr[0],
                recovered: recovered,
                recovereddiff: recovered - LTarr[1],
                deaths: deaths,
                deathsdiff: deaths - LTarr[2],
                Zeit: LTarr[3], //Alter Wert des letzten Posts aus File
                ZeitStempelAlt: LTarr[4]/1000,
                ZeitStempel: StandZeit/1000 //Neuer höchster Wert der aktuellen Anfrage
                };
                fs.writeFile("./data/current.csv", confirmed + "," + recovered + "," + deaths + "," + new Date().getTime() + "," + StandZeit, (err) => {if (err) console.log(err);
                    f.log("current.csv was written...")
                    resolve(Output);
                });
        })
    })
}

let getCorona24 = function getCorona24() {
    return new Promise(function(resolve, reject) {
        var Output = "";
        f.log("Pushed: getCorona24");
        request(url, (err, res, body) => {
            let CountLänder = 0;
            let confirmed = 0;
            let recovered = 0;
            let deaths = 0;
            let Bundesländer = [];
            let BundesländerAlt = [];
                var LT = fs.readFileSync('./data/last24.csv');
                var LTarr = LT.toString().split(/\s+/);
                var LTarr = LTarr.toString().split(",");

                var BT = fs.readFileSync('./data/Bundesländer24.csv');
                var BTarr = BT.toString().split("\n");
                console.log(BTarr)
                for(var i = 0; i < BTarr.length-1;i++){
                    var BTarrFor = BTarr[i].toString().split(".");
                    let temp = {
                        Bundesland: BTarrFor[0],
                        confirmed: Number(BTarrFor[1]),
                        recovered: Number(BTarrFor[2]),
                        deaths: Number(BTarrFor[3])
                    }
                    BundesländerAlt.push(temp);
                };

                if (err) { reject(err) }
                
                var bodyarr = body.split(',')
                var tracker = 0;
                for(var i = 0; i < bodyarr.length;i++){
                    if(bodyarr[i].indexOf("Deutschland") >= 0){
                        if(CountLänder >= 16){
                            console.log(BundesländerAlt[tracker])
                            confirmed = confirmed + parseInt(bodyarr[i+4])
                            recovered = recovered + parseInt(bodyarr[i+5])
                            deaths = deaths + parseInt(bodyarr[i+6])
                            let temp = {
                                Bundesland: "Unbekannter Standort",
                                confirmed: Number(bodyarr[i+4]),
                                confirmeddiff: Number(bodyarr[i+4]) - BundesländerAlt[tracker].confirmed,
                                recovered: Number(bodyarr[i+5]),
                                recovereddiff: Number(bodyarr[i+5]) - BundesländerAlt[tracker].recovered,
                                deaths: Number(bodyarr[i+6]),
                                deathsdiff: Number(bodyarr[i+6]) - BundesländerAlt[tracker].deaths
                            }
                            Bundesländer.push(temp);
                        }else{
                            confirmed = confirmed + parseInt(bodyarr[i+4])
                            recovered = recovered + parseInt(bodyarr[i+5])
                            deaths = deaths + parseInt(bodyarr[i+6])
                            let temp = {
                                Bundesland: bodyarr[i+1],
                                confirmed: Number(bodyarr[i+4]),
                                confirmeddiff: Number(bodyarr[i+4]) - BundesländerAlt[tracker].confirmed,
                                recovered: Number(bodyarr[i+5]),
                                recovereddiff: Number(bodyarr[i+5]) - BundesländerAlt[tracker].recovered,
                                deaths: Number(bodyarr[i+6]),
                                deathsdiff: Number(bodyarr[i+6]) - BundesländerAlt[tracker].deaths
                            }
                            Bundesländer.push(temp);
                        }

                            tracker++;
                            CountLänder++;
                    }
                }

                var WriteFile = "";
                Bundesländer.map((Bundesländer) =>{
                    WriteFile = WriteFile + Bundesländer.Bundesland + "." + Bundesländer.confirmed + "." + Bundesländer.recovered + "." + Bundesländer.deaths + "\n";
                });

                fs.writeFile("./data/Bundesländer24.csv", WriteFile, (err) => {if (err) console.log(err);
                    f.log("Bundesländer24.csv was written...")
                    Bundesländer.sort((a, b) => (a.confirmed > b.confirmed) ? -1 : 1)

                    var Output = {
                        confirmed: confirmed,
                        confirmeddiff: confirmed - LTarr[0],
                        recovered: recovered,
                        recovereddiff: recovered - LTarr[1],
                        deaths: deaths,
                        deathsdiff: deaths - LTarr[2],
                        Zeit: LTarr[3],
                        Bundesländer: Bundesländer
                        };

                    resolve(Output);
                });
        })
    })
}

let getCoronaFromFile = function getCoronaFromFile() {
    return new Promise(function(resolve, reject) {
        var LT = fs.readFileSync('./data/current.csv');
        var LTarr = LT.toString().split(/\s+/);
        var LTarr = LTarr.toString().split(",");
        
        var Output = {
            confirmed: LTarr[0],
            recovered: LTarr[1],
            deaths: LTarr[2],
            Zeit: LTarr[3],
            ZeitStempel: LTarr[4]/1000
            };
        resolve(Output);
    });
}

let getCoronaDetail = function getCoronaDetail(sort) {
    return new Promise(function(resolve, reject) {
        var CountLänder = 0;
        var Output = [];
        f.log("Pushed: getCoronaDetail");
        request(url, (err, res, body) => {
                var bodyarr = body.split(',')
                //console.log(bodyarr.length)
                for(var i = 0; i < bodyarr.length;i++){
                    if(bodyarr[i].indexOf("Deutschland") >= 0){
                        if(CountLänder >= 16){
                                var temp = {
                                    Bundesland: "Unbekannter Standort",
                                    confirmed: Number(bodyarr[i+4]),
                                    recovered: Number(bodyarr[i+5]),
                                    deaths: Number(bodyarr[i+6])
                                }
                                Output.push(temp);
                            }else{
                                let temp = {
                                    Bundesland: bodyarr[i+1],
                                    confirmed: Number(bodyarr[i+4]),
                                    recovered: Number(bodyarr[i+5]),
                                    deaths: Number(bodyarr[i+6])
                                }
                                Output.push(temp);
                            }
                            CountLänder++;
                        }
                    }
            if(sort === true){Output.sort((a, b) => (a.confirmed > b.confirmed) ? -1 : 1)}
            resolve(Output);
        })
    })
}

module.exports = {
	getCorona,
    getCorona24,
    getCoronaFromFile,
    getCoronaDetail
};