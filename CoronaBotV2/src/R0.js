const f = require("./funktions");
const config = require("../config");
const secret = require("../secret");
const util = require('util');
const fs = require("fs");

function Round2Dec(num){
    return Math.round(num * 100) / 100
}

//Basis Formeln
//Reff(t) = (N(t)+N(t-1)+N(t-2)+N(t-3) / N(t-4)+N(t-5)+N(t-6)+N(t-7)

//Dt(4)= (N(t)+N(t-1)+N(t-2)+N(t-3)/4
//Reff(t)= Dt(4)/+N(t-4)

let getR0Formel1 = function getR0(Offset) {
    return new Promise(function(resolve, reject) {
        var NeuKrank = []
		var LT = fs.readFileSync('./data/TäglicheStats.csv');
        var LTarr = LT.toString().split(/\s+/);
        for(i = LTarr.length-2; i >= 0; i--){
            var Line = LTarr[i].toString().split(",");
            NeuKrank.push(parseInt(Line[0])-(parseInt(Line[1])+parseInt(Line[2])))
        };
        //console.log(NeuKrank)
        if(7+Offset >= NeuKrank.length){
            resolve("Keine Daten")
        }else{
			/*Basis Formel 1*/
            var Reff = (NeuKrank[0+Offset] + NeuKrank[1+Offset] + NeuKrank[2+Offset] + NeuKrank[3+Offset]) / (NeuKrank[4+Offset] + NeuKrank[5+Offset] + NeuKrank[6+Offset] + NeuKrank[7+Offset])
            //console.log(NeuKrank[0+Offset], NeuKrank[1+Offset], NeuKrank[2+Offset], NeuKrank[3+Offset], NeuKrank[4+Offset], NeuKrank[5+Offset], NeuKrank[6+Offset], NeuKrank[7+Offset])
            
			/*Basis Formel 2*/
            //var Dt = NeuKrank[0+Offset] + NeuKrank[1+Offset] + NeuKrank[2+Offset] + NeuKrank[3+Offset]
            //var Dt4 = Dt/4
            //var Reff = Dt4/NeuKrank[4+Offset]
            //console.log("D(t)= " + Dt4, "Werte der letzten 4 Tage und heute: " + NeuKrank[0+Offset], NeuKrank[1+Offset], NeuKrank[2+Offset], NeuKrank[3+Offset], NeuKrank[4+Offset])
            
            resolve(Round2Dec(Reff))
        }
	})
}

let getR0Formel2 = function getR0(Offset) {
    return new Promise(function(resolve, reject) {
        var NeuKrank = []
		var LT = fs.readFileSync('./data/TäglicheStats.csv');
        var LTarr = LT.toString().split(/\s+/);
        for(i = LTarr.length-2; i >= 0; i--){
            var Line = LTarr[i].toString().split(",");
            NeuKrank.push(parseInt(Line[0])-(parseInt(Line[1])+parseInt(Line[2])))
        };
        //console.log(NeuKrank)
        if(7+Offset >= NeuKrank.length){
            resolve("Keine Daten")
        }else{
			/*Basis Formel 1*/
            //var Reff = (NeuKrank[0+Offset] + NeuKrank[1+Offset] + NeuKrank[2+Offset] + NeuKrank[3+Offset]) / (NeuKrank[4+Offset] + NeuKrank[5+Offset] + NeuKrank[6+Offset] + NeuKrank[7+Offset])
            //console.log(NeuKrank[0+Offset], NeuKrank[1+Offset], NeuKrank[2+Offset], NeuKrank[3+Offset], NeuKrank[4+Offset], NeuKrank[5+Offset], NeuKrank[6+Offset], NeuKrank[7+Offset])
            
			/*Basis Formel 2*/
            var Dt = NeuKrank[0+Offset] + NeuKrank[1+Offset] + NeuKrank[2+Offset] + NeuKrank[3+Offset]
            var Dt4 = Dt/4
            var Reff = Dt4/NeuKrank[4+Offset]
            //console.log("D(t)= " + Dt4, "Werte der letzten 4 Tage und heute: " + NeuKrank[0+Offset], NeuKrank[1+Offset], NeuKrank[2+Offset], NeuKrank[3+Offset], NeuKrank[4+Offset])
            
            resolve(Round2Dec(Reff))
        }
	})
}

module.exports = {
    getR0Formel1,
    getR0Formel2
}