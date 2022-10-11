const mysql = require("mysql");
const dotenv = require('dotenv');
dotenv.config({ path: './.env'});
const jwt = require("jsonwebtoken");
const sdk = require('api')('@opensea/v1.0#5zrwe3ql2r2e6mn');
const url  = require('url');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

// Récupere des informations global sur l'utilisateur puis envoi vers le dashboard
const dashboardGlobal = (req, res, next) => {

    const token = req.cookies.jwt; // pour récuperer le cookie depuis le navigateur // jwt est le nom du cookie
    // check if token exist
    if (token) {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                res.locals.custom_id = null;
                next();
            } else {
                let email = decodedToken.email;

                if (email) {
                    db.query('SELECT custom_id, chat_id_telegram, telegram_notif_status, chat_id_discord, discord_notif_status, is_temporary_password, is_checked_email, email_notif_status FROM tma_users WHERE email = ?', [email], async(error, results) => {
                        if (error) {
                            console.log(error);
                        }

                        if (results.length > 0 ) {
                            res.locals.custom_id = results[0]['custom_id'];
                            res.locals.chat_id_telegram = results[0]['chat_id_telegram'];
                            res.locals.telegram_notif_status = results[0]['telegram_notif_status'];
                            res.locals.chat_id_discord = results[0]['chat_id_discord'];
                            res.locals.discord_notif_status = results[0]['discord_notif_status'];
                            res.locals.is_temporary_password = results[0]['is_temporary_password'];
                            res.locals.is_checked_email = results[0]['is_checked_email'];
                            res.locals.email_notif_status = results[0]['email_notif_status'];
                            next();
                        }
                    });
                }
                // res.locals.user = user;
                // next(); // si cookie correct on peut continuer la navigation
            }
        });
    } else {
        res.locals.custom_id = null;
        next();
    }
}

const getCollection = (req, res, next) => {

    var url_parts = url.parse(req.url);
    var str= url_parts.pathname;
    var collection_name = str.split('/collection/')[1];

    db.query('SELECT * FROM tma_collection WHERE collection_name = ?', [collection_name], async(error, result) => {
        if (error) {
            console.log(error);
        }

        if (result.length < 1) {

            sdk['retrieving-a-single-collection']({collection_slug: collection_name})
            .then(success)
            .catch(error);

            function success(value) {

                var stats = value['collection']['stats'];
                var primary_asset_contracts = value['collection'];
                var social = value['collection'];

                var collectionStats = {
                    'collection_name': collection_name,
                    'one_day_volume': stats['one_day_volume'],
                    'one_day_change': stats['one_day_change'],
                    'one_day_sales': stats['one_day_sales'],
                    'one_day_average_price': stats['one_day_average_price'],
                    'seven_day_volume': stats['seven_day_volume'],
                    'seven_day_change': stats['seven_day_change'],
                    'seven_day_sales': stats['seven_day_sales'],
                    'seven_day_average_price': stats['seven_day_average_price'],
                    'thirty_day_volume': stats['thirty_day_volume'],
                    'thirty_day_change': stats['thirty_day_change'],
                    'thirty_day_sales': stats['thirty_day_sales'],
                    'thirty_day_average_price': stats['thirty_day_average_price'],
                    'total_volume': stats['total_volume'],
                    'total_sales': stats['total_sales'],
                    'total_supply': stats['total_supply'],
                    'count': stats['count'],
                    'num_owners': stats['num_owners'],
                    'average_price': stats['average_price'],
                    'market_cap': stats['market_cap'],
                    'floor_price': stats['floor_price'],
                    'image_url': primary_asset_contracts['image_url'],
                    'external_link': primary_asset_contracts['external_link'],
                    'telegram_url': social['telegram_url'],
                    'discord_url': social['discord_url'],
                    'twitter_username': social['twitter_username'],
                    'description': primary_asset_contracts['description'],
                    'name': social['name'],
                }

                db.query('INSERT INTO tma_collection SET ?', collectionStats, (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(404).json({ type: "error", message: "Impossible to add the collection name in the database, please try again later!" });
                    } else {

                        res.locals.collection = collectionStats;
                        next();
                    }
                });
            }

            function error(err) {
                console.log("Error: ", err);
                res.status(404).json({ type: "error", message: "Please check the collection name!" });
            }
        } else {
            res.locals.collection = result;
            next();
        }
    });
}

// Envoi les informations de la table tma_fpalert pour l'affichage dans le tableau du dashboard
const getFpInfosUser = (req, res, next) => {

    const token = req.cookies.jwt; // pour récuperer le cookie depuis le navigateur // jwt est le nom du cookie
    // check if token exist
    if (token) {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                next();
            } else {
                let email = decodedToken.email;

                if (email) {
                    db.query('SELECT custom_id, chat_id_telegram FROM tma_users WHERE email = ?', [email], async(error, results) => {

                        var custom_id = results[0]['custom_id'];
                        db.query('SELECT * FROM tma_fpalert_special WHERE custom_id = ?', [custom_id], async(error, getFpSpecialInfosUser) => {
                            if (error) {
                                console.log(error);
                            }
                            res.locals.getFpSpecialInfosUser = getFpSpecialInfosUser;
                        });
                        db.query('SELECT * FROM tma_fpalert WHERE custom_id = ?', [custom_id], async(error, getInfosFromAlert) => {
                            if (error) {
                                console.log(error);
                            }
                            res.locals.getCollectionsInfos = getInfosFromAlert;
                            next();
                        });
                    });
                }
            }
        });
    }
}

const getInfosWallet = (req, res, next) => {
    var custom_id = res.locals.custom_id;
    var arrCollectionName = [];
    var arrTest = [];

    db.query('SELECT * FROM tma_wallet WHERE custom_id = ?', [custom_id], async (error, getInfosWallet) => {
        if (error) {
            console.log(error);
        }

        for (var i in getInfosWallet) {
            if (arrTest.indexOf(getInfosWallet[i].collection_name) == -1) {

                arrCollectionName.push({
                    collection_name: getInfosWallet[i].collection_name,
                    collection_img_url: getInfosWallet[i].image_url_collection,
                    slug: getInfosWallet[i].slug
                });

                arrTest.push(getInfosWallet[i].collection_name);
            }
        }
        res.locals.arrCollectionName = arrCollectionName;
        res.locals.getInfosWallet = getInfosWallet;
        next();
    });
}

const checkMailUser = (req, res, next) => {

    var url_parts = url.parse(req.url);
    var str = url_parts.pathname;
    var check_email_key = str.split('/check/')[1];
    var is_checked_email = true;

    db.query('SELECT email, custom_id FROM tma_users WHERE check_email_key = ?', [check_email_key], async (error, results) => {
        if (error) {
            console.log(error);
        }
        if (results.length > 0) {

            var custom_id = results[0].custom_id;
            var email = results[0].email;

            db.query('UPDATE tma_users SET is_checked_email = ? WHERE email = ? AND custom_id = ?', [is_checked_email, email, custom_id], (error, results) => {
                if (error) {
                    console.log(error);
                } else {

                    res.locals.results = true;
                    next();
                }
            });
        } else {
            res.locals.results = false;
            next();
        }
    });
}

// exporter les functions pour etre utilisable ailleurs
module.exports = { dashboardGlobal, getFpInfosUser, getCollection, getInfosWallet, checkMailUser}