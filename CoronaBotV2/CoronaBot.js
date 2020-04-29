var config = require("./config");
var secret = require("./secret");
const SQL = require("./src/SQL");
const Datenquellen = require("./src/Datenquellen");
const f = require("./src/funktions");
var fs = require("fs");
const request = require('request');
const util = require('util');
const Telebot = require('telebot');
const bot = new Telebot({
	token: secret.bottoken,
	limit: 1000,
        usePlugins: ['commandButton']
});

SQL.updateDB().then(function(Output) {
    f.log(Output.Text + " Es wurden " + Output.count + " eingelesen von Morgenpost")
    UpdateDBMin = 0
}).catch(error => console.log('DB Update Error:', error));

SQL.updateDBRisklayer().then(function(Output) {
    f.log(Output.Text + " Es wurden " + Output.count + " eingelesen von Risklayer")
    UpdateDBMin = 0
}).catch(error => console.log('DB Update Error:', error));

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function Round3Dec(num){
    return Math.round(num * 1000) / 1000
}

const BundesländerArray = ['Baden-Württemberg','Bayern','Berlin','Brandenburg','Bremen','Hamburg','Hessen','Mecklenburg-Vorpommern','Niedersachsen','Nordrhein-Westfalen','Rheinland-Pfalz','Saarland','Sachsen','Sachsen-Anhalt','Schleswig-Holstein','Thüringen']

var url = 'https://interaktiv.morgenpost.de/corona-virus-karte-infektionen-deutschland-weltweit/data/Coronavirus.current.v2.csv'


bot.start(); //Telegram bot start

/*----------------------Inline Handler--------------------------*/
bot.on('inlineQuery', msg => {
    let query = msg.query;
    let queryarr = query.split('');
    queryBetaArr = query.split(' ');
    const answers = bot.answerList(msg.id, { cacheTime: 1 });
    if (queryBetaArr[0] === "beta" || queryBetaArr[0] === "Beta" || queryBetaArr[0] === "BETA") {
        if(queryBetaArr[1] === undefined){queryBetaArr[1] = " "}; //Fix for .trim() error in SQL.js
        
        var para = {
            lookup: queryBetaArr[1],
            collum: "Ort",
            mode: "LIKE",
            table: "risklayer",
            limit: 10
            };

    SQL.lookup(para).then(function(getCoronaDetail) {
        let idcount = 0;
                if(Object.entries(getCoronaDetail).length === 0){
                    answers.addArticle({
                        id: 'Not found',
                        title: 'Leider habe ich keine Information über:',
                        description: queryBetaArr[1],
                        message_text: ("Leider habe ich keine Information über den angegebenen Ort " + query)
                    });
                    return bot.answerQuery(answers);
                }else{
                    getCoronaDetail.map((getCoronaDetail) => {

                        var date = new Date(getCoronaDetail.TimeStamp * 1000)
                        var year = date.getFullYear()
                        var month = date.getMonth() + 1
                        var day = date.getDate()
                        var hours = date.getHours();
                        var minutes = "0" + date.getMinutes();
                
                        var formattedTime = day + "." + month + "." + year + " " + hours + ':' + minutes.substr(-2);

                        if(Object.entries(getCoronaDetail.QuelleURL).length === 0){
                            var QuelleTemp = "Quelle nicht als Link verfügbar"
                            var MessageOut = "<b>" + getCoronaDetail.Ort + "</b>\nEinwohner: " + numberWithCommas(getCoronaDetail.population) + "\n\n - Bestätigt: " + numberWithCommas(getCoronaDetail.confirmed) + " 🦠 (" + Round3Dec((getCoronaDetail.confirmed/getCoronaDetail.population)*100) + "%)\n - Wieder gesund: " + numberWithCommas(getCoronaDetail.recovered) + " 💚(" + Round3Dec((getCoronaDetail.recovered/getCoronaDetail.population)*100) + "%)\n - Todesfälle: " + numberWithCommas(getCoronaDetail.deaths) + " ⚰️(" + Round3Dec((getCoronaDetail.deaths/getCoronaDetail.population)*100) + "%)\n\nAktuell Erkrankte: " + numberWithCommas(parseInt(getCoronaDetail.confirmed)-(parseInt(getCoronaDetail.recovered)+parseInt(getCoronaDetail.deaths))) + " 🤧\n\nQuelle: " + QuelleTemp + "\n<b>BETA MODUS</b>\nStand: <b>" + formattedTime + "</b>";
                        }else{
                            var QuelleTemp = "Link"
                            var MessageOut = "<b>" + getCoronaDetail.Ort + "</b>\nEinwohner: " + numberWithCommas(getCoronaDetail.population) + "\n\n - Bestätigt: " + numberWithCommas(getCoronaDetail.confirmed) + " 🦠 (" + Round3Dec((getCoronaDetail.confirmed/getCoronaDetail.population)*100) + "%)\n - Wieder gesund: " + numberWithCommas(getCoronaDetail.recovered) + " 💚(" + Round3Dec((getCoronaDetail.recovered/getCoronaDetail.population)*100) + "%)\n - Todesfälle: " + numberWithCommas(getCoronaDetail.deaths) + " ⚰️(" + Round3Dec((getCoronaDetail.deaths/getCoronaDetail.population)*100) + "%)\n\nAktuell Erkrankte: " + numberWithCommas(parseInt(getCoronaDetail.confirmed)-(parseInt(getCoronaDetail.recovered)+parseInt(getCoronaDetail.deaths))) + " 🤧\n\nQuelle: <a href='" + getCoronaDetail.QuelleURL + "'>" + QuelleTemp + "</a>\n<b>BETA MODUS</b>\nStand: <b>" + formattedTime + "</b>";
                        }
        
                        answers.addArticle({
                            id: idcount,
                            title: getCoronaDetail.Ort,
                            description: "Einwohner: " + numberWithCommas(getCoronaDetail.population),
                            message_text: MessageOut,
                            parse_mode: 'html',
                            disable_web_page_preview: true
                        });
                        idcount++;
                    });
                    return bot.answerQuery(answers);
                }
    }).catch(error => console.log('inlineQuery Error:', error));

    }else{
        if(queryarr.length === 0 || query === "corona"|| query === "Corona"){
            Datenquellen.getCoronaFromFile().then(function(Corona) {

                let replyMarkup = bot.inlineKeyboard([
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
        
                let MessageOut = "Corona Deutschland:\n- Bestätigt: " + numberWithCommas(Corona.confirmed) + " 🦠\n- Wieder gesund: " + numberWithCommas(Corona.recovered) + " 💚\n- Todesfälle: " + numberWithCommas(Corona.deaths) + " ⚰️\n\nAktuell Erkrankte: " + numberWithCommas(parseInt(Corona.confirmed)-(parseInt(Corona.recovered)+parseInt(Corona.deaths))) + " 🤧\n\nStand: ***" + formattedTime + "***";
        
                answers.addArticle({
                    id: 1,
                    title: "Corona Aktuell",
                    message_text: MessageOut,
                    reply_markup: replyMarkup,
                    parse_mode: 'markdown'
                })
                return bot.answerQuery(answers);
        
            }).catch(error => console.log('inlineQuery Error:', error));

        }else{
            if(BundesländerArray.includes(query)){
                var para = {
                    lookup: query,
                    collum: "Bundesland",
                    mode: "LIKE",
                    table: "region",
                    limit: 35
                    };
            }else{
            
                var para = {
                    lookup: query,
                    collum: "Ort",
                    mode: "LIKE",
                    table: "region",
                    limit: 10
                    };
            }
        
            SQL.lookup(para).then(function(getCoronaDetail) {
                let idcount = 0;
                if(Object.entries(getCoronaDetail).length === 0){
                    answers.addArticle({
                        id: 'Not found',
                        title: 'Leider habe ich keine Information über:',
                        description: query,
                        message_text: ("Leider habe ich keine Information über den angegebenen Ort " + query)
                    });
                    return bot.answerQuery(answers);
                }else{
                    getCoronaDetail.map((getCoronaDetail) => {

                        if(getCoronaDetail.TimeStamp === "123456789"){
                            var formattedTime = "Unbekannt"
                        }else{
        
                        var date = new Date(getCoronaDetail.TimeStamp * 1000)
                        var year = date.getFullYear()
                        var month = date.getMonth() + 1
                        var day = date.getDate()
                        var hours = date.getHours();
                        var minutes = "0" + date.getMinutes();
                
                        var formattedTime = day + "." + month + "." + year + " " + hours + ':' + minutes.substr(-2);
                        }
                        let MessageOut = "<b>" + getCoronaDetail.Ort + "</b> (<i>" + getCoronaDetail.Bundesland + "</i>)\n\nEinwohner: " + numberWithCommas(getCoronaDetail.population) + "\n\n - Bestätigt: " + numberWithCommas(getCoronaDetail.confirmed) + " 🦠 (" + Round3Dec((getCoronaDetail.confirmed/getCoronaDetail.population)*100) + "%)\n - Wieder gesund: " + numberWithCommas(getCoronaDetail.recovered) + " 💚(" + Round3Dec((getCoronaDetail.recovered/getCoronaDetail.population)*100) + "%)\n - Todesfälle: " + numberWithCommas(getCoronaDetail.deaths) + " ⚰️(" + Round3Dec((getCoronaDetail.deaths/getCoronaDetail.population)*100) + "%)\n\nAktuell Erkrankte: " + numberWithCommas(parseInt(getCoronaDetail.confirmed)-(parseInt(getCoronaDetail.recovered)+parseInt(getCoronaDetail.deaths))) + " 🤧\n\nQuelle: <a href='" + getCoronaDetail.QuelleURL + "'>" + getCoronaDetail.Quelle + "</a>\nStand: <b>" + formattedTime + "</b>";
                                         
                        answers.addArticle({
                            id: idcount,
                            title: getCoronaDetail.Ort,
                            description: getCoronaDetail.Bundesland + ", Einwohner: " + getCoronaDetail.population,
                            message_text: MessageOut,
                            parse_mode: 'html',
                            disable_web_page_preview: true
                        });
                        idcount++;
                    });
                    return bot.answerQuery(answers);
                }
            }).catch(error => console.log('Error:', error));
        }
}
});

/*----------------------Callback for Buttons--------------------------*/
bot.on('callbackQuery', (msg) => {
	console.log("User: " + msg.from.username + "(" + msg.from.id + ") sended request with data " + msg.data)
	
	if ('inline_message_id' in msg) {	
		var inlineId = msg.inline_message_id;
	}else{
		var chatId = msg.message.chat.id;
		var messageId = msg.message.message_id;
    }
    
    if(msg.data === 'DetailsSort'){
        bot.answerCallbackQuery(msg.id,{
            text: "Lade Details...",
            showAlert: false
        });

        let replyMarkup = bot.inlineKeyboard([
            [
                bot.inlineButton('Sortierung: Alphabetisch', {callback: 'Details'})
            ], [
                bot.inlineButton('Zurück', {callback: 'NoDetails'})
            ]
        ]);

        let MSG = "Corona Deutschland:\n";
        Datenquellen.getCoronaDetail(true).then(function(Corona) {
            Corona.map((Corona) =>{
                MSG = MSG + Corona.Bundesland + ":\n" + numberWithCommas(Corona.confirmed) + " 🦠| " + numberWithCommas(Corona.recovered) + " 💚| " + numberWithCommas(Corona.deaths) + " ⚰️\n\n";
            });

            
            MSG = MSG + "[Corona Deutschland Status](t.me/CoronaStats_DE)"

            if ('inline_message_id' in msg) {
                bot.editMessageText(
                    {inlineMsgId: inlineId}, MSG,
                    {parseMode: 'markdown', webPreview: false, replyMarkup}
                ).catch(error => console.log('Error:', error));
            }else{
                bot.editMessageText(
                    {chatId: chatId, messageId: messageId}, MSG,
                    {parseMode: 'markdown', webPreview: false, replyMarkup}
                ).catch(error => console.log('Error:', error));
            }

        }).catch(error => console.log('Knopf Error:', error));
    }

    if(msg.data === 'Details'){
        bot.answerCallbackQuery(msg.id,{
            text: "Lade Details...",
            showAlert: false
        });

        let replyMarkup = bot.inlineKeyboard([
            [
                bot.inlineButton('Sortierung: Nach Bestätigt', {callback: 'DetailsSort'})
            ], [
                bot.inlineButton('Zurück', {callback: 'NoDetails'})
            ]
        ]);

        let MSG = "Corona Deutschland:\n";
        Datenquellen.getCoronaDetail(false).then(function(Corona) {
            Corona.map((Corona) =>{
                MSG = MSG + Corona.Bundesland + ":\n" + numberWithCommas(Corona.confirmed) + " 🦠| " + numberWithCommas(Corona.recovered) + " 💚| " + numberWithCommas(Corona.deaths) + " ⚰️\n\n";
            });

            
            MSG = MSG + "[Corona Deutschland Status](t.me/CoronaStats_DE)"

            if ('inline_message_id' in msg) {
                bot.editMessageText(
                    {inlineMsgId: inlineId}, MSG,
                    {parseMode: 'markdown', webPreview: false, replyMarkup}
                ).catch(error => console.log('Error:', error));
            }else{
                bot.editMessageText(
                    {chatId: chatId, messageId: messageId}, MSG,
                    {parseMode: 'markdown', webPreview: false, replyMarkup}
                ).catch(error => console.log('Error:', error));
            }

        }).catch(error => console.log('Knopf Error:', error));
    }

    if(msg.data === 'NoDetails'){
        bot.answerCallbackQuery(msg.id,{
            text: "Lade weniger Details...",
            showAlert: false
        });

        let replyMarkup = bot.inlineKeyboard([
            [
                bot.inlineButton('Mehr Details', {callback: 'Details'})
            ]
        ]);

        let MSG = "Corona Deutschland:\n";

        Datenquellen.getCoronaFromFile().then(function(Corona) {
    
            var date = new Date(Corona.ZeitStempel * 1000)
            var year = date.getFullYear()
            var month = date.getMonth() + 1
            var day = date.getDate()
            var hours = date.getHours();
            var minutes = "0" + date.getMinutes();
    
            var formattedTime = day + "." + month + "." + year + " " + hours + ':' + minutes.substr(-2);
    
    
            let MSG = "Corona Deutschland:\n- Bestätigt: " + numberWithCommas(Corona.confirmed) + " 🦠\n- Wieder gesund: " + numberWithCommas(Corona.recovered) + " 💚\n- Todesfälle: " + numberWithCommas(Corona.deaths) + " ⚰️\n\nAktuell Erkrankte: " + numberWithCommas(parseInt(Corona.confirmed)-(parseInt(Corona.recovered)+parseInt(Corona.deaths))) + " 🤧\n\nStand: ***" + formattedTime + "***";

            if ('inline_message_id' in msg) {
                bot.editMessageText(
                    {inlineMsgId: inlineId}, MSG,
                    {parseMode: 'markdown', webPreview: false, replyMarkup}
                ).catch(error => console.log('Error:', error));
            }else{
                bot.editMessageText(
                    {chatId: chatId, messageId: messageId}, MSG,
                    {parseMode: 'markdown', webPreview: false, replyMarkup}
                ).catch(error => console.log('Error:', error));
            }

        }).catch(error => console.log('Knopf Error:', error));
    }

});
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
		Datenquellen.getCorona24().then(function(Corona) {
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
                    Corona.Bundesländer.map((Bundesländer) =>{
                        MSGBundesländer = MSGBundesländer + Bundesländer.Bundesland + "\n<b>" + numberWithCommas(Bundesländer.confirmed) + "</b> <b>(+" + Bundesländer.confirmeddiff + "</b>) 🦠 | <b>" + numberWithCommas(Bundesländer.recovered) + "</b> <b>(+" + Bundesländer.recovereddiff + "</b>) 💚 | <b>" + numberWithCommas(Bundesländer.deaths) + "</b> <b>(+" + Bundesländer.deathsdiff + "</b>) ⚰️\n\n"
                    });

                var formattedTime = day + "." + month + "." + year

                    var MessageOut = '<u><b>Zusammenfassung letzte 24h</b></u>\n - - - - - - Übersicht Alle - - - - - - \n<pre language="c++">- Bestätigt: ' + numberWithCommas(Corona.confirmed) + " 🦠 (+" + Corona.confirmeddiff + ")\n- Wieder gesund: " + numberWithCommas(Corona.recovered) + " 💚 (+" + Corona.recovereddiff + ")\n- Todesfälle: " + numberWithCommas(Corona.deaths) + " ⚰️ (+" + Corona.deathsdiff + ")\nAktuell Erkrankte: <b>" + numberWithCommas(parseInt(Corona.confirmed)-(parseInt(Corona.recovered)+parseInt(Corona.deaths))) + "</b> 🤧</pre>\n\n - - - - - - Bundesländer - - - - - - \n" + MSGBundesländer + "\n#TäglicherReport " + formattedTime;
                    
                    bot.sendMessage(-1001466291563, MessageOut, { parseMode: 'html' , webPreview: false}); //-1001466291563 206921999
					bot.sendMessage(-1001135132259, MessageOut, { parseMode: 'html' , webPreview: false});
                    
                    fs.writeFile("./data/last24.csv", Corona.confirmed + "," + Corona.recovered + "," + Corona.deaths + "," + new Date().getTime(), (err) => {if (err) console.log(err);
                        f.log("last24.csv was written...")
                    });
                    
            }
        }).catch(error => console.log('getCorona24 Error:', error));
	}

	Datenquellen.getCorona().then(function(Corona) {
        let StartTime = new Date().getTime();
        let changed = parseInt(Corona.confirmeddiff) + parseInt(Corona.recovereddiff) + parseInt(Corona.deathsdiff)
        if(changed >= 1){
            if(StartTime - Corona.Zeit <= 600000){ //600000
                f.log("Kanalpost übersprungen, da die Zeit zu gering war.")
            }else{


                    var date = new Date(Corona.ZeitStempel * 1000)
                    var year = date.getFullYear()
                    var month = date.getMonth() + 1
                    var day = date.getDate()
                    var hours = date.getHours() ;
                    var minutes = "0" + date.getMinutes();

                    var formattedTime = day + "." + month + "." + year + " " + hours + ':' + minutes.substr(-2);
                    var MessageOut = 'Corona Deutschland:\n- Bestätigt: <b>' + numberWithCommas(Corona.confirmed) + '</b> 🦠 (<b>+' + Corona.confirmeddiff + '</b>)\n- Wieder gesund: <b>' + numberWithCommas(Corona.recovered) + '</b> 💚 (<b>+' + Corona.recovereddiff + '</b>)\n- Todesfälle: <b>' + numberWithCommas(Corona.deaths) + '</b> ⚰️ (<b>+' + Corona.deathsdiff + '</b>)\nAktuell Erkrankte: <b>' + numberWithCommas(parseInt(Corona.confirmed)-(parseInt(Corona.recovered)+parseInt(Corona.deaths))) + '</b> 🤧\n\nStand: <b>' + formattedTime + '</b>';
                    bot.sendMessage(-1001466291563, MessageOut, { parseMode: 'html' , webPreview: false}); //-1001466291563 206921999

                    fs.writeFile("./data/last.csv", Corona.confirmed + "," + Corona.recovered + "," + Corona.deaths + "," + new Date().getTime() + "," + Corona.ZeitStempel * 1000, (err) => {if (err) console.log(err);
                        f.log("last.csv was written...")
                    });

                    let LogLine = Corona.ZeitStempel + "," + Corona.confirmed + "," + Corona.confirmeddiff + "," + Corona.recovered + "," + Corona.recovereddiff + "," + Corona.deaths + "," + Corona.deathsdiff + "\n"
                    fs.appendFile('./data/KanalLog.csv', LogLine, function (err) {
                        if (err) {console.log('getCorona Error:', err)}
                    })
          }
     }
    }).catch(error => console.log('getCorona Error:', error));

    if(UpdateDBMin === 10){
        SQL.updateDB().then(function(Output) {
            f.log(Output.Text + " Es wurden " + Output.count + " eingelesen von Morgenpost")
            UpdateDBMin = 0
        }).catch(error => console.log('DB Update Error:', error));
        
        SQL.updateDBRisklayer().then(function(Output) {
            f.log(Output.Text + " Es wurden " + Output.count + " eingelesen von Risklayer")
            UpdateDBMin = 0
        }).catch(error => console.log('DB Update Error:', error));
    }else{
        UpdateDBMin++
    }
    
}, 60000);

/*----------------------Start--------------------------*/
bot.on(/^\/start$/i, (msg) => {
    let MSG = "Dieser Bot postet Updates zum Corona Virus im [Corona Deutschland Kanal](t.me/CoronaStats_DE), außerdem kannst du Ihn in jedem Chat als Inline Bot nutzen.\nKlicke einfach auf den Knopf unten, wähle einen Chat und klick auf das Feld.\n\nMit /faq kannst du das Bot FAQ anzeigen.\nMit /ask kannst du eine Frage stellen die mit ins FAQ soll.\nMit /inline schickt dir der Bot 3 Videos die dir diese funktion zeigen.\nAlle weiteren Fragen bitte im [Corona DACH Chat](https://t.me/joinchat/AKrnBlRo1GoUgRoatj6LUA)"

    let replyMarkup = bot.inlineKeyboard([
        [
            bot.inlineButton('Inline', {inline: 'Corona'})
        ]
    ]);

    msg.reply.text(MSG, {parseMode: 'markdown', replyMarkup});
});

bot.on(/^\/faq$/i, (msg) => {
    bot.deleteMessage(msg.chat.id, msg.message_id);

    let MSG = "<u>Woher kommen die Daten:</u>\nFür Kanal: <a href='https://interaktiv.morgenpost.de/corona-virus-karte-infektionen-deutschland-weltweit/'>morgenpost.de</a>\nMorgenpost gibt das <a href='https://www.rki.de/DE/Content/InfAZ/N/Neuartiges_Coronavirus/Fallzahlen.html'>RKI</a>.spreadsheet an.\n\nFür Inline: <a href='https://interaktiv.morgenpost.de/corona-virus-karte-infektionen-deutschland-weltweit/'>morgenpost.de</a> & <a href='http://risklayer-explorer.com/event/100/detail'>Risklayer</a>\nHier kommen die Daten von den jeweiligen Bundesländen."
    MSG += "\n\n<u>Allgemeine Infos zu 'Wieder gesund':</u>\n- Leider sind nicht immer alle Genesungen einem Bundesland zuordenbar, diese werden unter 'Unbekannter Standort' vom Bot angezeigt. Ist der Standort zu einem späteren Zeitpunkt klar, werden diese den Bundesländern zugeordnet.\n- Leider besteht keine „Gesundmeldepflicht“, daher ist die hier gezeigte Zahl vermutlich kleiner als in Realität."
    MSG += "\n\n<u>Wie oft werden die Daten bezogen:</u>\nDaten werden jede Minute von einem internen Link bezogen und für 60 Sekunden gespeichert um die Webseite zu entlasten"
    MSG += "\n\n<u>Warum sind die Standzeiten oft identisch?</u>\nDass weiß ich nicht genau, durch Beobachtungen kann ich folgendes sagen. Jedes Bundesland aktualisiert seine Zahlen einzeln und die Zeiten werden gerundet auf die volle Stunde. Warum es teils jedoch 2h hinterher ist, weiß ich nicht. Ich zeige immer den aktuellsten Zeitstempel an, auch wenn andere Bundesländer noch nicht geupdatet haben."
    MSG += "\n\n<u>Was soll ich machen, wenn eine oder mehrere Zahlen NaN, extrem große oder negative werte zeigen?</u>\nBitte @BolverBlitz kontaktieren. Da die Daten aus einer Datei kommen muss der bot den groben Aufbau kennen um die Werte richtig zuordnen zu können, bisher wurde diese Datei 2 Mal geändert."
    MSG += "\n\n<u>Inline und Inline Knöpfe funktionieren nicht, was tun?</u>\nLeider ist das ein Bug den ich bisher weder finden noch reproduzieren konnte. Der Bot startet daher aktuell jede halbe Stunde neu, sollte es danach noch immer nicht gehen bitte @BolverBlitz kontaktieren. Die Kanalupdates funktionieren weiterhin."

    msg.reply.text(MSG, {parseMode: 'html', webPreview: false});
});

bot.on(/^\/ask$/i, (msg) => {
    msg.reply.text("Leider konnte ich deine Frage nicht finden.\n\nBitte mach: /ask Hier deine Frage!")
});

bot.on(/^\/ask(.+)$/i, (msg, props) => {
	const Para = props.match[1].split(' ');
    var MSG = Para[1];
    for(var i = 2; i < Para.length;i++){
        MSG = MSG + " " + Para[i];
    }

	bot.deleteMessage(msg.chat.id, msg.message_id);
	msg.reply.text("Deine Frage wurde gesendet!\n" + MSG)
	bot.sendMessage(config.LogChat, " Neue Frage: \n" + MSG);
});

bot.on(/^\/inline$/i, (msg) => {
    bot.sendVideo(msg.chat.id, "http://v1.bolverblitz.net/TGBotMedia/CoronaOhne.mp4")
    bot.sendVideo(msg.chat.id, "http://v1.bolverblitz.net/TGBotMedia/CoronaStadt.mp4")
    bot.sendVideo(msg.chat.id, "http://v1.bolverblitz.net/TGBotMedia/CoronaBundeland.mp4")
    msg.reply.text("Hier ein paar GIFs zur erklärung ;)\n\nMit @Corona_DEBot beta <Stadt> kann man die Risklayer als Quelle nutzen\nBeispiel: @Corona_DEBot beta Nürnberg")
});

bot.on(/^\/updateRisk$/i, (msg) => {
    SQL.updateDBRisklayer().then(function(Output) {
        f.log(Output.Text + " Es wurden " + Output.count + " eingelesen von Risklayer")
        UpdateDBMin = 0
    }).catch(error => console.log('DB Update Error:', error));
});
