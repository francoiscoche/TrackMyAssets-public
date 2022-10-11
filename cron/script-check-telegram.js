const TelegramBot = require('node-telegram-bot-api');
// const { Telegraf } = require('telegraf');
// replace the value below with the Telegram token you receive from @BotFather
const token = process.env.BOT_TELEGRAM_TOKEN;
const mysql = require("mysql");
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, {polling: true});
// const bot = new Telegraf(process.env.BOT_TELEGRAM_TOKEN);
// // Matches "/echo [whatever]"
// bot.onText(/\/echo (.+)/, (msg, match) => {
//   // 'msg' is the received Message from Telegram
//   // 'match' is the result of executing the regexp above on the text content
//   // of the message

//   const chat_id_telegram = msg.chat.id;
//   const resp = match[1]; // the captured "whatever"

//   // send back the matched "whatever" to the chat
//   bot.sendMessage(chat_id_telegram, resp);
// });
const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

// Listen for any kind of message. There are different kinds of
// messages.
bot.on('message', (msg) => {


//   const chat_id_telegram = msg.chat.id;
// console.log(chat_id_telegram);
// console.log(msg.text);
    const chat_id_telegram = msg.chat.id;

    if ((msg.text).startsWith("/check")) {

        
        bot.onText(/\/check (.+)/, (msg, match) => {
        
          
            const custom_id = match[1]; 
            const telegram_notif_status    = true;
    // IF CUSTOM ID


//  const custom_id= "jo_f48be536-576f-482";
            db.query('SELECT email, chat_id_telegram FROM tma_users WHERE custom_id = ?', [ custom_id ], async(error, results) => {
           
                if (error) {
                    console.log(error);
                } else {
                    
                    console.log("COUCOUCOUOCU");
                    if(results != "") {
                        console.log(results[0]);
                        
                        if(results[0]['chat_id_telegram'] === false || results[0]['chat_id_telegram'] == null) {
                            console.log("COCOUC " );
                            if(results[0]['email']) {
                                var email = results[0]['email'];

                                db.query('UPDATE tma_users SET chat_id_telegram = ?, telegram_notif_status = ? WHERE email = ?', [ chat_id_telegram, telegram_notif_status, email ], (error, results) => {
                                    if (error) {
                                        console.log(error);
                                        bot.sendMessage(chat_id_telegram, `⛔️ Impossible de verify the account. Please contact me via contact@trackmyassets.info. (DB ERROR)`);
                                        return;
                                    } else {
                                        bot.sendMessage(chat_id_telegram, `✅ Account Discord valided, please refresh the dashboard of TrackMyAssets website!`);
                                        return;
                                    }
                                });
                            } else {
                                bot.sendMessage(chat_id_telegram, `⛔️ Impossible de verify the account. Please contact me via contact@trackmyassets.eu.`);
                                return;
                            }
                        } else {
                            console.log("Inconnu");
                        }
                    } else {
                        bot.sendMessage(chat_id_telegram, `⛔️ Impossible de verify the account. Please contact me via contact@trackmyassets.eu.`);
                    }
                }
            });
        });
    } else {
    // send a message to the chat acknowledging receipt of their message
    bot.sendMessage(chat_id_telegram, '⛔️ Not a correct command, please paste your verification code written in the dashboard (/check xxx)');

    }
});



