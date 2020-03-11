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

var url = 'https://interaktiv.morgenpost.de/corona-virus-karte-infektionen-deutschland-weltweit/data/Coronavirus.current.csv'


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
                            confirmed = confirmed + parseInt(bodyarr[i+5])
                            recovered = recovered + parseInt(bodyarr[i+6])
                            deaths = deaths + parseInt(bodyarr[i+7])
                        }
                    }
                }
                var KillMSG = "Nothing";
				/*
                if(deaths - LTarr[2] >= 2){var KillMSG = "Double Kill"}
                if(deaths - LTarr[2] >= 3){var KillMSG = "Tripple Kill"}
                if(deaths - LTarr[2] >= 4){var KillMSG = "M-M-M-MONSTERKILL"}
				*/

            var Output = {
                confirmed: confirmed,
                confirmeddiff: confirmed - LTarr[0],
                recovered: recovered,
                recovereddiff: recovered - LTarr[1],
                deaths: deaths,
                deathsdiff: deaths - LTarr[2],
                KillMSG: KillMSG,
                Ziet: LTarr[3],
                ZeitSpempel: StandZeit/1000
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
                var LT = fs.readFileSync('./last24.csv');
                var LTarr = LT.toString().split(/\s+/);
                var LTarr = LTarr.toString().split(",");
                if (err) { reject(err) }
                
                var bodyarr = body.split(',')
                //console.log(bodyarr.length)
                for(var i = 0; i < bodyarr.length;i++){
                    if(bodyarr[i].indexOf("Deutschland") >= 0){
                        if(bodyarr[i+1] !== "Repatriierte"){
                            confirmed = confirmed + parseInt(bodyarr[i+5])
                            recovered = recovered + parseInt(bodyarr[i+6])
                            deaths = deaths + parseInt(bodyarr[i+7])
                        }
                    }
                }
                var KillMSG = "Nothing";
                if(deaths - LTarr[2] >= 2){var KillMSG = "Double Kill"}
                if(deaths - LTarr[2] >= 3){var KillMSG = "Tripple Kill"}
                if(deaths - LTarr[2] >= 4){var KillMSG = "M-M-M-MONSTERKILL"}

            var Output = {
                confirmed: confirmed,
                confirmeddiff: confirmed - LTarr[0],
                recovered: recovered,
                recovereddiff: recovered - LTarr[1],
                deaths: deaths,
                deathsdiff: deaths - LTarr[2],
                KillMSG: KillMSG,
                Ziet: LTarr[3]
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
            Ziet: LTarr[3],
            ZeitSpempel: LTarr[4]/1000
            };
        resolve(Output);
    });
}

let getCoronaDeteil = function getCoronaDeteil() {
    return new Promise(function(resolve, reject) {
        var Output = [];
        log("Pushed: getCoronaDeteil");
        request(url, (err, res, body) => {
                var bodyarr = body.split(',')
                //console.log(bodyarr.length)
                for(var i = 0; i < bodyarr.length;i++){
                    if(bodyarr[i].indexOf("Deutschland") >= 0){
                        if(bodyarr[i+1] !== "Repatriierte"){
                            //Output = Output + bodyarr[i+1] + "," + bodyarr[i+5] + "," + bodyarr[i+6] + "," + bodyarr[i+7] + ",";
                            let temp = {
                                Bundesland: bodyarr[i+1],
                                confirmed: Number(bodyarr[i+5]),
                                recovered: Number(bodyarr[i+6]),
                                deaths: Number(bodyarr[i+7])
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

        var date = new Date(Corona.ZeitSpempel * 1000)
        var year = date.getFullYear()
        var month = date.getMonth() + 1
        var day = date.getDate()
        var hours = date.getHours();
        var minutes = "0" + date.getMinutes();

        var formattedTime = day + "." + month + "." + year + " " + hours + ':' + minutes.substr(-2);


        let MessageOut = "Corona Deutschland:\n- Bestätigt: " + Corona.confirmed + " 🦠\n- Wieder gesund: " + Corona.recovered + " 💚\n- Todesfälle: " + Corona.deaths + " ⚰️\n\nStand: ***" + formattedTime + "***\n[Corona Deutschland Status](t.me/CoronaStats_DE)";

        answers.addArticle({
            id: 1,
            title: "Corona Aktuell",
            message_text: MessageOut,
            reply_markup: replyMarkup,
            parse_mode: 'markdown'
        })
        return bot.answerQuery(answers);

    }).catch(error => console.log('getCorona Error:', error));
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
        getCoronaDeteil().then(function(Corona) {

            Corona.map((Corona) =>{
                MSG = MSG + Corona.Bundesland + ": " + Corona.confirmed + " 🦠| " + Corona.recovered + " 💚| " + Corona.deaths + " ⚰️ \n"
            });

            
            MSG = MSG + "\n\n [Corona Deutschland Status](t.me/CoronaStats_DE)"

            if ('inline_message_id' in msg) {
                bot.editMessageText(
                    {inlineMsgId: inlineId}, MSG,
                    {parseMode: 'markdown'}
                ).catch(error => console.log('Error:', error));
            }else{
                bot.editMessageText(
                    {chatId: chatId, messageId: messageId}, MSG,
                    {parseMode: 'markdown'}
                ).catch(error => console.log('Error:', error));
            }

        });
    }
});

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
                if(StartTime - Corona.Zeit <= 600000){
                    log("Kanalpost übersprungen, da die Zeit zu gering war.")
                }else{
    
                    if(Corona.KillMSG === "Nothing"){
                    
                        var MessageOut = "Corona Deutschland **HEUTE**\n--- 24h ---:\n- Bestätigt: " + Corona.confirmed + " 🦠 (+" + Corona.confirmeddiff + ")\n- Wieder gesund: " + Corona.recovered + " 💚 (+" + Corona.recovereddiff + ")\n- Todesfälle: " + Corona.deaths + " ⚰️ (+" + Corona.deathsdiff + ")\n";
                    }else{
                        var MessageOut = "Corona Deutschland **HEUTE**\n--- 24h ---:\n- Bestätigt: " + Corona.confirmed + " 🦠 (+" + Corona.confirmeddiff + ")\n- Wieder gesund: " + Corona.recovered + " 💚 (+" + Corona.recovereddiff + ")\n- Todesfälle: " + Corona.deaths + " ⚰️ (+" + Corona.deathsdiff + ")\n\n-- " + Corona.KillMSG + " --";
                    }
    
                    bot.sendMessage(-1001466291563, MessageOut, { parseMode: 'markdown' });
    
                    fs.writeFile("last24.csv", Corona.confirmed + "," + Corona.recovered + "," + Corona.deaths + "," + new Date().getTime(), (err) => {if (err) console.log(err);
                        log("last24.csv was written...")
                    });
                }
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

                var date = new Date(Corona.ZeitSpempel * 1000)
                var year = date.getFullYear()
                var month = date.getMonth() + 1
                var day = date.getDate()
                var hours = date.getHours();
                var minutes = "0" + date.getMinutes();

                var formattedTime = day + "." + month + "." + year + " " + hours + ':' + minutes.substr(-2);

                if(Corona.KillMSG === "Nothing")
                {
                    var MessageOut = "Corona Deutschland:\n- Bestätigt: " + Corona.confirmed + " 🦠 (+" + Corona.confirmeddiff + ")\n- Wieder gesund: " + Corona.recovered + " 💚 (+" + Corona.recovereddiff + ")\n- Todesfälle: " + Corona.deaths + " ⚰️ (+" + Corona.deathsdiff + ")\n\nStand: ***" + formattedTime + "***";
                }else{
                    var MessageOut = "Corona Deutschland:\n- Bestätigt: " + Corona.confirmed + " 🦠 (+" + Corona.confirmeddiff + ")\n- Wieder gesund: " + Corona.recovered + " 💚 (+" + Corona.recovereddiff + ")\n- Todesfälle: " + Corona.deaths + " ⚰️ (+" + Corona.deathsdiff + ")\n\n-- " + Corona.KillMSG + " --\n\nStand: ***" + formattedTime + "***";
                }

                bot.sendMessage(-1001466291563, MessageOut, { parseMode: 'markdown' });

                fs.writeFile("last.csv", Corona.confirmed + "," + Corona.recovered + "," + Corona.deaths + "," + new Date().getTime(), (err) => {if (err) console.log(err);
                    log("last.csv was written...")
                });
          }
     }
    }).catch(error => console.log('getCorona Error:', error));
}, 60000);

/*----------------------Start--------------------------*/
bot.on(/^\/start$/i, (msg) => {
    let MSG = "Dieser Bot postet updates zum Corona Virus im [Corona Deutschland Kanal](t.me/CoronaStats_DE), außerdem kannst du Ihn in jedem Chat als Inline Bot nutzen.\nKlicke einfach auf den Knopf unten, wähle einen Chat und klick auf das Feld."

    let replyMarkup = bot.inlineKeyboard([
        [
            bot.inlineButton('Inline', {inline: 'Corona'})
        ]
    ]);

    msg.reply.text(MSG, {parseMode: 'markdown', replyMarkup});

});