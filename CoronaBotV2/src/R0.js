const f = require("./funktions");
const config = require("../config");
const secret = require("../secret");
const util = require('util');
const fs = require("fs");

//Basis Formeln
//Reff(t) = (N(t)+N(t-1)+N(t-2)+N(t-3) / N(t-4)+N(t-5)+N(t-6)+N(t-7)

//Dt(4)= (N(t)+N(t-1)+N(t-2)+N(t-3)/4
//Reff(t)= Dt(4)/+N(t-4)

let getR0 = function getR0(Offset) {
    return new Promise(function(resolve, reject) {
        var NeuKrank = []
		var LT = fs.readFileSync('../data/TäglicheStats.csv');
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
            console.log("D(t)= " + Dt4, "Werte der letzten 4 Tage und heute: " + NeuKrank[0+Offset], NeuKrank[1+Offset], NeuKrank[2+Offset], NeuKrank[3+Offset], NeuKrank[4+Offset])
            
            resolve(Reff)
        }
	})
}

/*---- What the hack am i doing here?!*/
getR0(0).then(function(R0) {
    console.log(R0)
})
getR0(1).then(function(R0) {
    console.log(R0)
})
getR0(2).then(function(R0) {
    console.log(R0)
})
getR0(3).then(function(R0) {
    console.log(R0)
})
getR0(4).then(function(R0) {
    console.log(R0)
})
getR0(5).then(function(R0) {
    console.log(R0)
})
getR0(6).then(function(R0) {
    console.log(R0)
})
getR0(7).then(function(R0) {
    console.log(R0)
})
getR0(8).then(function(R0) {
    console.log(R0)
})
getR0(9).then(function(R0) {
    console.log(R0)
})
getR0(10).then(function(R0) {
    console.log(R0)
})
getR0(11).then(function(R0) {
    console.log(R0)
})


module.exports = {
    getR0
}
