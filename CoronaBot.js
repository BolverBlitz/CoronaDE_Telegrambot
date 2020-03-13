var config = require("./config");
var secret = require("./secret");
var fs = require("fs");
const request = require('request');
const util = require('util');
const Telebot = require('telebot');
const bot = new Telebot({
	token: secret.bottoken,
	limit: 1000,
        usePlugins: ['commandButton']
});

var url = 'https://interaktiv.morgenpost.de/corona-virus-karte-infektionen-deutschland-weltweit/data/Coronavirus.current.v2.csv'


bot.start(); //Telegram bot start

let getCorona = function getCorona() {
    return new Promise(function(resolve, reject) {
        var Output = "";
        log("Pushed: getCorona");
        request(url, (err, res, body) => {
            let confirmed = 0;
            let recovered = 0;
            let deaths = 0;
                var LT = fs.readFileSync('./last.csv');
                var LTarr = LT.toString().split(/\s+/);
                var LTarr = LTarr.toString().split(",");
                if (err) { reject(err) }
                
                var bodyarr = body.split(',')
                //console.log(bodyarr.length)
                var StandZeit = 0;
                for(var i = 0; i < bodyarr.length;i++){
                    if(bodyarr[i].indexOf("Deutschland") >= 0){
                        if(bodyarr[i+1] !== "Repatriierte"){
                            if(bodyarr[i+2] >= StandZeit){
                                StandZeit = bodyarr[i+2]
                            }
                            confirmed = confirmed + parseInt(bodyarr[i+4])
                            recovered = recovered + parseInt(bodyarr[i+5])
                            deaths = deaths + parseInt(bodyarr[i+6])
                        }
                    }
                }
               
                log(confirmed)
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
                fs.writeFile("current.csv", confirmed + "," + recovered + "," + deaths + "," + new Date().getTime() + "," + StandZeit, (err) => {if (err) console.log(err);
                    log("current.csv was written...")
                    resolve(Output);
                });
        })
    })
}

let getCorona24 = function getCorona24() {
    return new Promise(function(resolve, reject) {
        var Output = "";
        log("Pushed: getCorona24");
        request(url, (err, res, body) => {
            let confirmed = 0;
            let recovered = 0;
            let deaths = 0;
            let Bundesländer = [];
            let BundesländerAlt = [];
                var LT = fs.readFileSync('./last24.csv');
                var LTarr = LT.toString().split(/\s+/);
                var LTarr = LTarr.toString().split(",");

                var BT = fs.readFileSync('./Bundesländer24.csv');
                var BTarr = BT.toString().split("\n");

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
                        if(bodyarr[i+1] !== "Repatriierte"){
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
                            tracker++;
                        }
                    }
                }

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
        })
    })
}

let getCoronaFromFile = function getCoronaFromFile() {
    return new Promise(function(resolve, reject) {
        var LT = fs.readFileSync('./current.csv');
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

let getCoronaDetail = function getCoronaDetail() {
    return new Promise(function(resolve, reject) {
        var Output = [];
        log("Pushed: getCoronaDetail");
        request(url, (err, res, body) => {
                var bodyarr = body.split(',')
                //console.log(bodyarr.length)
                for(var i = 0; i < bodyarr.length;i++){
                    if(bodyarr[i].indexOf("Deutschland") >= 0){
                        if(bodyarr[i+1] !== "Repatriierte"){
                            //Output = Output + bodyarr[i+1] + "," + bodyarr[i+5] + "," + bodyarr[i+6] + "," + bodyarr[i+7] + ",";
                            let temp = {
                                Bundesland: bodyarr[i+1],
                                confirmed: Number(bodyarr[i+4]),
                                recovered: Number(bodyarr[i+5]),
                                deaths: Number(bodyarr[i+6])
                            }
                            Output.push(temp);
                        }
                    }
                }
            Output.sort((a, b) => (a.confirmed > b.confirmed) ? -1 : 1)
            resolve(Output);
        })
    })
}

/*----------------------Inline Handler--------------------------*/
bot.on('inlineQuery', msg => {

    let query = msg.query;
    const answers = bot.answerList(msg.id, {cacheTime: 1});
    
	getCoronaFromFile().then(function(Corona) {

        let replyMarkup = bot.inlineKeyboard([ //If TG ID is set, chance to remove TelegramID
            [
                bot.inlineButton('Mehr Details', {callback: 'Details'})
            ]
        ]);

        var date = new Date(Corona.ZeitStempel * 1000)
        var year = date.getFullYear()
        var month = date.getMonth() + 1
        var day = date.getDate()
        var hours = date.getHours();
        var minutes = "0" + date.getMinutes();

        var formattedTime = day + "." + month + "." + year + " " + hours + ':' + minutes.substr(-2);


        let MessageOut = "Corona Deutschland:\n- Bestätigt: " + Corona.confirmed + " 🦠\n- Wieder gesund: " + Corona.recovered + " 💚\n- Todesfälle: " + Corona.deaths + " ⚰️\n\nStand: ***" + formattedTime + "***";

        answers.addArticle({
            id: 1,
            title: "Corona Aktuell",
            message_text: MessageOut,
            reply_markup: replyMarkup,
            parse_mode: 'markdown'
        })
        return bot.answerQuery(answers);

    }).catch(error => console.log('inlineQuery Error:', error));
});

/*----------------------Callback for Buttons--------------------------*/
bot.on('callbackQuery', (msg) => {
	
	if ('inline_message_id' in msg) {	
		var inlineId = msg.inline_message_id;
	}else{
		var chatId = msg.message.chat.id;
		var messageId = msg.message.message_id;
    }
    
    if(msg.data === 'Details'){
        bot.answerCallbackQuery(msg.id,{
            text: "Lade Details...",
            showAlert: false
        });
        let MSG = "Corona Deutschland:\n";
        getCoronaDetail().then(function(Corona) {

            Corona.map((Corona) =>{
                MSG = MSG + Corona.Bundesland + ":\n" + Corona.confirmed + " 🦠| " + Corona.recovered + " 💚| " + Corona.deaths + " ⚰️\n\n";
            });

            
            MSG = MSG + "[Corona Deutschland Status](t.me/CoronaStats_DE)"

            if ('inline_message_id' in msg) {
                bot.editMessageText(
                    {inlineMsgId: inlineId}, MSG,
                    {parseMode: 'markdown', webPreview: false}
                ).catch(error => console.log('Error:', error));
            }else{
                bot.editMessageText(
                    {chatId: chatId, messageId: messageId}, MSG,
                    {parseMode: 'markdown', webPreview: false}
                ).catch(error => console.log('Error:', error));
            }

        });
    }
});

/*----------------------Custom Log Funktion--------------------------*/
function log(info) {
	console.log("[" + getDateTime(new Date()) + "]" + " " + info)
}

/*----------------------Time--------------------------*/
function getDateTime(date) {

	var hour = date.getHours();
	hour = (hour < 10 ? "0" : "") + hour;

	var min  = date.getMinutes();
	min = (min < 10 ? "0" : "") + min;

	var sec  = date.getSeconds();
	sec = (sec < 10 ? "0" : "") + sec;

	var year = date.getFullYear();

	var month = date.getMonth() + 1;
	month = (month < 10 ? "0" : "") + month;

	var day  = date.getDate();
	day = (day < 10 ? "0" : "") + day;

	return year + "-" + month + "-" + day + " " + hour + ":" + min + ":" + sec;
}

function getMinUTC(date) {

	var hour = date.getHours();
	hour = (hour < 10 ? "0" : "") + hour;
	
	var min  = date.getMinutes();
	min = (min < 10 ? "0" : "") + min;

	return min;
}

function getHourDE(date) {

	var hour = date.getHours();
	hour = (hour < 10 ? "0" : "") + hour;
	
	var min  = date.getMinutes();
	min = (min < 10 ? "0" : "") + min;

	return hour + "" + min;
}

/*----------------------Trigger--------------------------*/
setInterval(function(){

    if(getHourDE(new Date()) === '0000'){
		getCorona24().then(function(Corona) {
            let StartTime = new Date().getTime();
            let changed = parseInt(Corona.confirmeddiff) + parseInt(Corona.recovereddiff) + parseInt(Corona.deathsdiff)
            if(changed >= 1){

                var date = new Date(Date.now());
                var year = date.getFullYear();
                var month = date.getMonth() + 1;
                var day = date.getDate() - 1;
                var hours = date.getHours();
                var minutes = "0" + date.getMinutes();

                var MSGBundesländer = "";
                var WriteFile = "";
                    Corona.Bundesländer.map((Bundesländer) =>{
                        WriteFile = WriteFile + Bundesländer.Bundesland + "." + Bundesländer.confirmed + "." + Bundesländer.recovered + "." + Bundesländer.deaths + "\n";
                        MSGBundesländer = MSGBundesländer + Bundesländer.Bundesland + "\n<b>" + Bundesländer.confirmed + "</b> <b>(+" + Bundesländer.confirmeddiff + "</b>) 🦠 | <b>" + Bundesländer.recovered + "</b> <b>(+" + Bundesländer.recovereddiff + "</b>) 💚 | <b>" + Bundesländer.deaths + "</b> <b>(+" + Bundesländer.deathsdiff + "</b>) ⚰️\n\n"
                    });

                var formattedTime = day + "." + month + "." + year

                    var MessageOut = '<u><b>Zusammenfassung letzte 24h</b></u>\n - - - - - - Übersicht Alle - - - - - - \n<pre language="c++">- Bestätigt: ' + Corona.confirmed + " 🦠 (+" + Corona.confirmeddiff + ")\n- Wieder gesund: " + Corona.recovered + " 💚 (+" + Corona.recovereddiff + ")\n- Todesfälle: " + Corona.deaths + " ⚰️ (+" + Corona.deathsdiff + ")</pre>\n\n - - - - - - Bundesländer - - - - - - \n" + MSGBundesländer + "\n#TäglicherReport " + formattedTime;
                    
                    bot.sendMessage(-1001466291563, MessageOut, { parseMode: 'html' , webPreview: false}); //-1001466291563
                    
                    fs.writeFile("last24.csv", Corona.confirmed + "," + Corona.recovered + "," + Corona.deaths + "," + new Date().getTime(), (err) => {if (err) console.log(err);
                        log("last24.csv was written...")
                    });

                    fs.writeFile("Bundesländer24.csv", WriteFile, (err) => {if (err) console.log(err);
                        log("Bundesländer24.csv was written...")
                    });
                    
            }
        }).catch(error => console.log('getCorona24 Error:', error));
	}

	getCorona().then(function(Corona) {
        let StartTime = new Date().getTime();
        let changed = parseInt(Corona.confirmeddiff) + parseInt(Corona.recovereddiff) + parseInt(Corona.deathsdiff)
        if(changed >= 1){
            if(StartTime - Corona.Zeit <= 600000){
                log("Kanalpost übersprungen, da die Zeit zu gering war.")
            }else{

                if(Corona.ZeitStempel * 1000 <= Corona.ZeitStempel * 1000){

                    var date = new Date(Corona.ZeitStempel * 1000)
                    var year = date.getFullYear()
                    var month = date.getMonth() + 1
                    var day = date.getDate()
                    var hours = date.getHours() ;
                    var minutes = "0" + date.getMinutes();

                    var formattedTime = day + "." + month + "." + year + " " + hours + ':' + minutes.substr(-2);
                    var MessageOut = 'Corona Deutschland:\n- Bestätigt: <b>' + Corona.confirmed + '</b> 🦠 (<b>+' + Corona.confirmeddiff + '</b>)\n- Wieder gesund: <b>' + Corona.recovered + '</b> 💚 (<b>+' + Corona.recovereddiff + '</b>)\n- Todesfälle: <b>' + Corona.deaths + '</b> ⚰️ (<b>+' + Corona.deathsdiff + '</b>)\n\nStand: <b>' + formattedTime + '</b>';
                    bot.sendMessage(-1001466291563, MessageOut, { parseMode: 'html' , webPreview: false}); //-1001466291563 206921999

                    fs.writeFile("last.csv", Corona.confirmed + "," + Corona.recovered + "," + Corona.deaths + "," + new Date().getTime() + "," + Corona.ZeitStempel * 1000, (err) => {if (err) console.log(err);
                        log("last.csv was written...")
                    });

                }else{
                    var MessageOut = 'Corona Deutschland:\n- Bestätigt: <b>' + Corona.confirmed + '</b> 🦠 (<b>+' + Corona.confirmeddiff + '</b>)\n- Wieder gesund: <b>' + Corona.recovered + '</b> 💚 (<b>+' + Corona.recovereddiff + '</b>)\n- Todesfälle: <b>' + Corona.deaths + '</b> ⚰️ (<b>+' + Corona.deathsdiff + '</b>)\n\nStand: <b>' + formattedTime + '</b>';
                    log(MessageOut)
                    log("Timestamp in Datei war älter als Timestamp der letzten Änderung")
                    console.log(Corona.ZeitStempel, Corona.ZeitSpempel)
                }
          }
     }
    }).catch(error => console.log('getCorona Error:', error));
}, 60000);

/*----------------------Start--------------------------*/
bot.on(/^\/start$/i, (msg) => {
    let MSG = "Dieser Bot postet Updates zum Corona Virus im [Corona Deutschland Kanal](t.me/CoronaStats_DE), außerdem kannst du Ihn in jedem Chat als Inline Bot nutzen.\nKlicke einfach auf den Knopf unten, wähle einen Chat und klick auf das Feld."

    let replyMarkup = bot.inlineKeyboard([
        [
            bot.inlineButton('Inline', {inline: 'Corona'})
        ]
    ]);

    msg.reply.text(MSG, {parseMode: 'markdown', replyMarkup});
});
