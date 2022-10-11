const cron          = require('node-cron');
const dotenv        = require('dotenv');
const mysql         = require("mysql");
const { Telegraf }  = require('telegraf');
const Discord       = require('discord.js');
const client        = new Discord.Client();
const nodemailer    = require('nodemailer');

dotenv.config({ path: './.env' });

let transport = nodemailer.createTransport({
    host: 'node7-eu.n0c.com',
    port: 587,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

const bot = new Telegraf(process.env.BOT_TELEGRAM_TOKEN);

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

client.on("ready", () => {

    cron.schedule('0 */1 * * * *', function () {
        db.query('SELECT custom_id, collection_price, collection_name, price_history, plateform_name FROM tma_fpalert_special', async (error, results) => {
            if (error) {
                console.log(error);
            }
            for (let i of results) {
                if (i['custom_id']) {
                    db.query('SELECT email, chat_id_telegram, telegram_notif_status, chat_id_discord, discord_notif_status, email_notif_status FROM tma_users WHERE custom_id = ?', [i['custom_id']], async (error, res) => {
                        if (error) {
                            console.log(error);
                        }

                        var { custom_id, collection_price, collection_name, price_history, plateform_name } = i;

                        for (let i of res) {

                            var { email, chat_id_telegram, telegram_notif_status, chat_id_discord, discord_notif_status, email_notif_status } = i;

                            db.query('SELECT floor_price FROM tma_collection WHERE collection_name = ? AND plateform_name = ?', [ collection_name, plateform_name ], async (error, results) => {
                                if (error) {
                                    console.log(error);
                                }

                                var { floor_price, one_day_average_price, seven_day_average_price, thirty_day_average_price } = results[0];

                                if (floor_price != null) {
                                    if (price_history) {
                                        if (floor_price > price_history && collection_price < floor_price && collection_price > price_history) {

                                            // Croisement a la hausse
                                            var message = '🔔↗️ <PRICE CUSTOM ALERT FP> : The floor price of "' +
                                                collection_name +
                                                '" collection on "' + plateform_name + '" just crossed your alert upwards. \n' +
                                                " \n- Actual floor price : " + floor_price + "" +
                                                " \n- Your alert : " + collection_price + "";

                                        } else if (floor_price < price_history && collection_price > floor_price && collection_price < price_history) {

                                            // Croisement a la baisse
                                            var message = '🔔↘️ <PRICE CUSTOM ALERT FP> : The floor price of "' +
                                                collection_name +
                                                '" collection on "' + plateform_name + '" just crossed your downside alert. \n' +
                                                " \n- Actual floor price : " + floor_price + "" +
                                                " \n- Your alert : " + collection_price + "";
                                        } else if (floor_price == collection_price && floor_price != price_history) {

                                            // Target reached
                                            var message = '🔔 <PRICE CUSTOM ALERT FP> : The floor price of "' +
                                                collection_name +
                                                '" collection on "' + plateform_name + '" just reached your alert. \n' +
                                                " \n- Actual floor price : " + floor_price + "" +
                                                " \n- Your alert : " + collection_price + "";
                                        }
                                        if (message) {
                                            const mailOptions = {
                                                from: 'contact@trackmyassets.info',
                                                to: email,
                                                subject: 'Your custom target has just been hit! - ('+collection_name+' collection)',
                                                html: '<h2> TrackMyAssets - Custom target </h2><p>'+ message +'</p>'
                                            };

                                            // SEND DISCORD NOTIFICATIONS
                                            if (discord_notif_status) {

                                                client.users.fetch(chat_id_discord, false).then((user) => {
                                                    user.send(message);
                                                });
                                            }
                                            // SEND TELEGRAM NOTIFICATIONS
                                            if (telegram_notif_status) {
                                                bot.telegram.sendMessage(chat_id_telegram, message, {})
                                            }
                                            // SEND EMAIL NOTIFICATIONS
                                            if (email_notif_status) {
                                                transport.sendMail(mailOptions, function (err, info) {
                                                    if (err) {
                                                        console.log(err)
                                                    } else {
                                                        console.log(info);
                                                    }
                                                });
                                            }
                                        }
                                    }

                                    price_history = floor_price;

                                    db.query("UPDATE tma_fpalert_special SET price_history = ?, floor_price = ?, one_day_average_price = ?, seven_day_average_price = ?, thirty_day_average_price = ? WHERE custom_id = ? AND collection_name = ? ", [price_history, floor_price, one_day_average_price, seven_day_average_price, thirty_day_average_price, custom_id, collection_name], (error, results) => {
                                        if (error) {
                                            console.log(error);
                                        } else {
                                            console.log("UPDATE IN DBB DONE");
                                        }
                                    });
                                }
                            })
                        }
                    });
                }
            }
        });
    });
});
client.login(process.env.BOT_DISCORD_TOKEN); //login bot using token