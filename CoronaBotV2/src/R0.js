const f = require("./funktions");
const config = require("../config");
const secret = require("../secret");
const download = require('image-downloader')
const quickchart = 'https://quickchart.io/chart?';
const util = require('util');
const fs = require("fs");

/**
 *
 * @param {number} num
 * @returns {string|number}
 */
function round2Dec(num) {
    if (typeof num === "number") {
        return num.toFixed(2);
    }
    return Math.round(num * 100) / 100
}

/**
 * Gets the new infections per day.
 *
 * @returns {number[]} new infections per day
 */
function getNewInfections() {
    var currentIllCases = []
    var LT = fs.readFileSync('./data/TäglicheStats.csv');
    var LTarr = LT.toString().split(/\s+/);
    for (i = LTarr.length - 2; i >= 0; i--) {
        var line = LTarr[i].toString().split(",");
        currentIllCases.push(parseInt(line[0]) - (parseInt(line[1]) + parseInt(line[2])))
    }
    var newInfections = []
    for (i = 0; i < currentIllCases.length - 1; i++) {
        newInfections.push(currentIllCases[i] - currentIllCases[i + 1])
    }
    return newInfections;
}

/**
 * Receives a set of new infections.
 *
 * @callback valueProviderCallback
 * @param {number[]} newInfections
 */

/**
 * Gets the new infection amount per day.
 *
 * @param requiredMinLength
 * @param {valueProviderCallback} valueProviderCallback called on successful checked infections
 * @return {Promise<number>}
 */
function getR0CheckedValue(requiredMinLength, valueProviderCallback) {
    return new Promise((resolve, reject) => {
        let newInfections = getNewInfections();

        if (requiredMinLength >= newInfections.length) {
            reject("Keine Daten");
        } else {
            resolve(round2Dec(valueProviderCallback(newInfections)));
        }
    });
}


//Basis Formeln
//Reff(t) = (N(t)+N(t-1)+N(t-2)+N(t-3) / N(t-4)+N(t-5)+N(t-6)+N(t-7)

//Dt(4)= (N(t)+N(t-1)+N(t-2)+N(t-3)/4
//Reff(t)= Dt(4)/+N(t-4)

//Reff(t) = (N(t-3)+N(t-4)+N(t-5)+N(t-6)+N(t-7)+N(t-8)+N(t-9)) / (N(t-7)+N(t-8)+N(t-9)+N(t-10)+N(t-11)+N(t-12)+N(t-13))


/**
 * Provides a R0 value, with the now cast formula.
 *
 * @param {number} offset
 * @returns {Promise<number>}
 */
let getNowCast = offset => getR0CheckedValue(7 + offset, (newInfections =>
            (newInfections[offset]
                + newInfections[1 + offset]
                + newInfections[2 + offset]
                + newInfections[3 + offset])
            / (newInfections[4 + offset]
            + newInfections[5 + offset]
            + newInfections[6 + offset]
            + newInfections[7 + offset])
));

/**
 * Provides a R0 value, with a sensitive formula.
 *
 * @param {number} offset
 * @returns {Promise<number>}
 */
let getSensitive = offset => getR0CheckedValue(4 + offset, (newInfections => {
        let Dt = newInfections[offset]
            + newInfections[1 + offset]
            + newInfections[2 + offset]
            + newInfections[3 + offset];
        let Dt4 = Dt / 4;
        return Dt4 / newInfections[4 + offset];
    }
));

/**
 * Provides a R0 value, with a stable formula.
 *
 * @param {number} offset of days
 * @returns {Promise<number>}
 */
let getStable = offset => getR0CheckedValue(13 + offset, (newInfections =>
        (newInfections[offset]
            + newInfections[1 + offset]
            + newInfections[2 + offset]
            + newInfections[3 + offset]
            + newInfections[4 + offset]
            + newInfections[5 + offset]
            + newInfections[6 + offset])
        /
        (newInfections[4 + offset]
            + newInfections[5 + offset]
            + newInfections[6 + offset]
            + newInfections[7 + offset]
            + newInfections[8 + offset]
            + newInfections[9 + offset]
            + newInfections[10 + offset])
));

/**
 * Provides an image representing a graph of ...
 *
 * @param Para
 * @returns {Promise<unknown>}
 * @constructor
 */
let GetGraph = function (Para) {
    return new Promise(function (resolve, reject) {
        let dataset = [{label: 'Dogs', data: [50, 60, 70, 180, 190], fill: false, borderColor: 'blue'}, {
            label: 'Cats',
            data: [100, 200, 300, 400, 500],
            fill: false,
            borderColor: 'green'
        }];
        let encodedDataset = encodeURIComponent(JSON.stringify(dataset));
        let baseUrl = `${quickchart}width=${Para.resolutionX}&height=${Para.resolutionY}&c={type:'${Para.type}',data:{labels:${Para.lable},datasets:${encodedDataset}}`
        const options = {
            url: baseUrl,
            dest: `${Para.path}${Para.filename}`
        };
        console.log(baseUrl);
        download.image(options)
            .then(output => {
                resolve(output);
            })
    });
};

let labels = "['11.05.2020','12.05.2020','13.05.2020','14.05.2020','15.05.2020','16.05.2020','17.05.2020','18.05.2020']"
let data = [];
data.push("[1,2]");
data.push("[1,2,3]");
data.push("[1,2,3,4]");

let GraphData = {
    resolutionX: '1920',
    resolutionY: '1080',
    path: '../media/graph/',
    filename: 'R0.png',
    type: 'line',
    label: labels,
    data: data
};


console.log(GraphData);
GetGraph(GraphData).then(Output => {
    console.log(Output.filename)
});

module.exports = {
    getR0Formel1: getNowCast,
    getR0Formel2: getSensitive,
    getR0Formel3: getStable,
    getNowCast,
    getSensitive,
    getStable
}