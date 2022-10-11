const cron          = require('node-cron');
const mysql         = require("mysql");
const Discord       = require('discord.js');
const client        = new Discord.Client();
const { Telegraf }  = require('telegraf');
const bot           = new Telegraf(process.env.BOT_TELEGRAM_TOKEN);


const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});



client.on("ready", () => {
    cron.schedule('20 */1 * * * *', function () {

        db.query('SELECT custom_id, floor_price, collection_name, address FROM tma_fpalert WHERE notifications_status = ?', [ true ], async (error, results) => {
            if (error) {
                console.log(error);
            }
            for (let i of results) {

                const { custom_id, collection_name } = i;
                const floor_price_db = i["floor_price"];

                if ( custom_id && custom_id != null ) {

                    db.query('SELECT chat_id_telegram, telegram_notif_status, chat_id_discord, discord_notif_status FROM tma_users WHERE custom_id = ?', [ custom_id ], async (error, res) => {
                        if (error) {
                            console.log(error);
                        }

                        for (let i of res) {

                            var nftlink = "";
                            var { chat_id_telegram, telegram_notif_status, chat_id_discord, discord_notif_status } = i;

                            db.query('SELECT floor_price, one_day_average_price, seven_day_average_price, thirty_day_average_price, plateform_name, signature FROM tma_collection WHERE collection_name = ?', [ collection_name ], async (error, results) => {
                                if (error) {
                                    console.log(error);
                                }

                                var { floor_price, one_day_average_price, seven_day_average_price, thirty_day_average_price, plateform_name, signature } = results[0];

                                if (signature) {
                                    if ( plateform_name == "magiceden" ) {
                                        nftlink = "https://www.magiceden.io/item-details/"+signature;
                                    } else if ( plateform_name == "opensea" ) {
                                        nftlink = signature;
                                    } else {
                                        nftlink = "";
                                    }
                                } else {
                                    nftlink = "";
                                }

                                if (floor_price != null && floor_price != floor_price_db) {
                                    if (floor_price > floor_price_db) {

                                        var message = '🟢 <ALERT FP> : The floor price of "' +
                                            collection_name +
                                            '" collection on "' + plateform_name + '" increased to : ' +
                                            floor_price +
                                            " ↗️ (previously: " +
                                            floor_price_db +
                                            ")\n" + nftlink;

                                    } else {
                                        var message = '🔴 <ALERT FP> : The floor price of "' +
                                            collection_name +
                                            '" collection on "' + plateform_name + '"  has dropped to : ' +
                                            floor_price +
                                            " ↘️ (previously: " +
                                            floor_price_db +
                                            ")\n" + nftlink;
                                    }

                                    // SEND DISCORD NOTIFICATIONS
                                    if ( discord_notif_status ) {
                                        client.users.fetch(chat_id_discord, false).then((user) => {
                                            user.send(message);
                                        });
                                    }
                                    // SEND TELEGRAM NOTIFICATIONS
                                    if ( telegram_notif_status ) {
                                        bot.telegram.sendMessage(chat_id_telegram, message, {})
                                    }
                                    db.query('UPDATE tma_fpalert SET floor_price = ?, one_day_average_price = ?, seven_day_average_price = ?, thirty_day_average_price = ? WHERE custom_id = ? AND collection_name = ?', [ floor_price, one_day_average_price, seven_day_average_price, thirty_day_average_price, custom_id, collection_name ], (error, results) => {
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