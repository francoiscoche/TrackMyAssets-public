const Discord = require('discord.js');
const client = new Discord.Client();
const dotenv = require('dotenv');
const mysql = require("mysql");
const prefix = "/check ";

dotenv.config({ path: './.env'});

var jeanOmar = process.env.JEAN_OMAR_DISCORD_ID;

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});


// client.on("ready", () => {
//     client.users.fetch('204685753324666881', false).then((user) => {
//         user.send("✌ Alive !");
//     });
// });

client.on('guildMemberAdd', member => {
    member.send(`**Welcome to the Track My Assets discord**\n\n ✅ To configure the bot and receive notifications of floor price changes, please paste in this conversation (as a reply) your '/check xxx' message available in the dashboard page of the site https://trackmyassets.info/dashboard.\n\n 📨  In case of problem, bug, or request for information, do not hesitate to contact me via contact@trackmyassets.info or pm <@${jeanOmar}>.\n\n Thanks ❤️`);
});

client.on("message", message => {

    if (message.author.bot) return; // evite que le bot reponde a un autre bot
    if (message.channel.type != "dm") return;

    if (!message.content.startsWith(prefix)) {
        message.reply(`⛔️ Please paste here, only the verification code ! If you have any problem, please contact me via contact@trackmyassets.info or pm <@${jeanOmar}> on discord`);
        return;
    }

    var custom_id  = message.content.slice(prefix.length);
    var chat_id_discord         = message.author.id;
    var discord_notif_status    = true;

    db.query('SELECT email, chat_id_discord FROM tma_users WHERE custom_id = ?', [ custom_id ], async(error, results) => {
        if (error) {
            console.log(error);
        } else {
            console.log(results);
            if(results.length > 0) {
                if(results[0]['chat_id_discord'] == false || results[0]['chat_id_discord'] == null) {
                  if(results[0]['email']) {
                      var email = results[0]['email'];

                      db.query('UPDATE tma_users SET chat_id_discord = ?, discord_notif_status = ? WHERE email = ?', [ chat_id_discord, discord_notif_status, email ], (error, results) => {
                          if (error) {
                              console.log(error);
                              message.reply(`⛔️ Impossible de verify the account. Please contact me via contact@trackmyassets.info or pm <@${jeanOmar}> on discord! (DB ERROR)`);
                              return;
                          } else {
                              message.reply(`✅ Account Discord valided, please refresh the dashboard of TrackMyAssets website!`);
                              return;
                          }
                      });
                  } else {
                      message.reply(`⛔️ Impossible de verify the account. Please contact me via contact@trackmyassets.info or pm <@${jeanOmar}> on discord`);
                      return;
                  }
              } else {
                message.reply(`✅ Your account is already valided`);
                return;
              }
            } else {
              message.reply(`⛔️ Impossible de verify the account. Be sure that the code you paste is the same displayed on your TrackMyAssets account or please contact me via contact@trackmyassets.info or pm <@${jeanOmar}> on discord`);
              return;
            }
        }
    });
});

client.login(process.env.BOT_DISCORD_TOKEN); //login bot using token