const bcrypt = require('bcryptjs');
const mysql = require("mysql");
const uuid = require("uuid");
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const sdk = require('api')('@opensea/v1.0#5zrwe3ql2r2e6mn');
const generator = require('generate-password');
var https = require('follow-redirects').https;
var fs = require('fs');
const nodemailer = require('nodemailer');
const { exit, nextTick } = require('process');
dotenv.config({ path: './.env' });
const moment = require('moment');
const fetch = require('node-fetch');
const { stringify } = require('querystring');
const request = require('request');
const http = require("https");
const { PerformanceNodeTiming } = require('perf_hooks');


dotenv.config({
	path: './.env'
});

const db = mysql.createConnection({
	host: process.env.DATABASE_HOST,
	user: process.env.DATABASE_USER,
	password: process.env.DATABASE_PASSWORD,
	database: process.env.DATABASE
});

module.exports.submitCollection_post = (req, res) => {

    var plateform_name = req.body['plateformSelected'];
    var collection_name = req.body['collection_name'];
    var custom_id = req.body['customId'];
    var address = req.body['collection_name'];

    if (plateform_name != "" && plateform_name != null && collection_name != "" && collection_name != null) {

        // Check is user a moins de 4 alert dans bdd
        db.query('SELECT collection_name, address, plateform_name FROM tma_fpalert WHERE custom_id = ?', [custom_id], async (error, resGlobalAlert) => {
            if (error) {
                console.log(error);
            }

            if (resGlobalAlert.length < 15) {

                for (let i of resGlobalAlert) {
                    if (collection_name === i['collection_name'] || collection_name === i['address'] ) {
                        return res.status(400).json({ type: "error", message: 'You are already following this collection' });
                    }
                }

                getNumberOfCollectionsON(custom_id, function (err, data) {
                    if (err) {
                        console.log("ERROR : ", err);
                    } else {
                        if (data > 4) {
                            notifications_status = false;
                        } else {
                            notifications_status = true;
                        }
                    }

                    db.query('SELECT * FROM tma_collection WHERE collection_name = ? OR address = ?', [ collection_name, address ], (error, resultsCollection) => {
                        if (error) {
                            console.log(error);
                        }
                        if (resultsCollection.length < 1) {

                            if (plateform_name == 'opensea') {

                                sdk['retrieving-a-single-collection']({ collection_slug: collection_name })
                                    .then(success)
                                    .catch(error);

                                function success(value) {


                                    var stats = value['collection']['stats'];
                                    var primary_asset_contracts = value['collection']['primary_asset_contracts'][0];
                                    var social = value['collection'];

                                    var floor_price = stats['floor_price'] ? stats['floor_price'] : "";
                                    var one_day_average_price = stats['one_day_average_price'];
                                    var seven_day_average_price = stats['seven_day_average_price'];
                                    var thirty_day_average_price = stats['thirty_day_average_price'];
                                    var image_url = primary_asset_contracts['image_url'];
                                    var external_link = primary_asset_contracts['external_link'];
                                    var name = social['name'];

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
                                        'plateform_name' : plateform_name
                                    }

                                    if (floor_price) {
                                        db.query('INSERT INTO tma_collection SET ?', [ collectionStats ], (error, results) => {
                                            if (error) {
                                                console.log(error);
                                                res.json({ type: "error", message: "Impossible to add the collection name in the database, please try again later!" });
                                            } else {

                                                db.query('INSERT INTO tma_fpalert SET ?', { custom_id, floor_price, one_day_average_price, seven_day_average_price, thirty_day_average_price, collection_name, plateform_name, image_url, external_link, notifications_status, name }, (error, results) => {
                                                    if (error) {
                                                        console.log(error);
                                                        res.json({ type: "error", message: "Impossible to add the collection name in the database, please try again later!" });
                                                    } else {
                                                        res.json({ type: "success", message: "Collection added!" });
                                                    }
                                                });

                                            }
                                        });

                                    } else {
                                        res.json({ type: "error", message: "Impossible to get the floor price of this collection!" });
                                    }
                                }
                                function error(err) {
                                    console.log("Error: ", err);
                                    res.json({ type: "error", message: "Please check the collection name!" });
                                }
                            } else if (plateform_name == "looksrare") {
                                var optionsStats = {
                                    'method': 'GET',
                                    'hostname': 'api.looksrare.org',
                                    'path': '/api/v1/collections/stats?address=' + collection_name,
                                    'headers': {
                                    },
                                    'maxRedirects': 20
                                };

                                var options = {
                                    'method': 'GET',
                                    'hostname': 'api.looksrare.org',
                                    'path': '/api/v1/collections?address=' + collection_name,
                                    'headers': {
                                    },
                                    'maxRedirects': 20
                                };

                                var reqStats = https.request(optionsStats, function (resultStats) {
                                    var chunks = [];

                                    resultStats.on("data", function (chunk) {
                                        chunks.push(chunk);
                                    });

                                    resultStats.on("end", function (chunk) {
                                        var body = Buffer.concat(chunks);
                                        var resBody = body.toString();
                                        var resultsStats = JSON.parse(resBody);

                                        if (resultsStats['success']) {
                                            var floor_price = (resultsStats['data']['floorPrice'] / 10 ** 18)
                                            var one_day_average_price = (resultsStats['data']['average24h'] / 10 ** 18)
                                            var seven_day_average_price = (resultsStats['data']['average7d'] / 10 ** 18)
                                            var thirty_day_average_price = (resultsStats['data']['average1m'] / 10 ** 18)

                                            var req = https.request(options, function (result) {
                                                var chunks = [];

                                                result.on("data", function (chunk) {
                                                    chunks.push(chunk);
                                                });

                                                result.on("end", function (chunk) {
                                                    var body = Buffer.concat(chunks);
                                                    var resBody = body.toString();
                                                    var results = JSON.parse(resBody);

                                                    if (results['success']) {
                                                        var address = collection_name;
                                                        collection_name = (results['data']['name']);

                                                        if (floor_price) {
                                                            db.query('INSERT INTO tma_collection SET ?', { collection_name, plateform_name, floor_price, one_day_average_price, seven_day_average_price, thirty_day_average_price, address }, (error, results) => {
                                                                if (error) {
                                                                    console.log(error);
                                                                    res.json({ type: "error", message: "Impossible to add the collection name in the database, please try again later!" });
                                                                } else {
                                                                    db.query('INSERT INTO tma_fpalert SET ?', { collection_name, plateform_name, custom_id, floor_price, one_day_average_price, seven_day_average_price, thirty_day_average_price, address, notifications_status }, (error, results) => {
                                                                        if (error) {
                                                                            console.log(error);
                                                                            res.status(404).json({ type: "error", message: "Impossible to add the collection name in the database, please try again later!" });
                                                                        } else {
                                                                            res.status(201).json({ type: "success", message: "Collection added!" });
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        } else {
                                                            res.status(404).json({ type: "error", message: "Please check the collection name!" });
                                                        }
                                                    } else {
                                                        res.json({ type: "error", message: "Impossible to add the collection name in the database, please try again later!" });
                                                    }
                                                });

                                                result.on("error", function (error) {
                                                    console.error(error);
                                                });
                                            });
                                            req.end();
                                        } else {
                                            res.json({ type: "error", message: "Impossible to add the collection name in the database, please try again later!" });
                                        }
                                    });

                                    resultStats.on("error", function (error) {
                                        console.error(error);
                                    });
                                });

                                reqStats.end();

                            } else if (plateform_name == "magiceden") {

                                var options = {
                                    'method': 'GET',
                                    'hostname': 'api-mainnet.magiceden.dev',
                                    'path': '/v2/collections/' + collection_name + '/stats',
                                    'headers': {
                                    },
                                    'maxRedirects': 20
                                };

                                var req = https.request(options, function (result) {
                                    var chunks = [];

                                    result.on("data", function (chunk) {
                                        chunks.push(chunk);
                                    });

                                    result.on("end", function (chunk) {
                                        var body = Buffer.concat(chunks);
                                        var results = body.toString();
                                        // console.log(results);
                                        var results = JSON.parse(results);
                                        var floor_price = (results['floorPrice'] / 10 ** 9)
                                        var count = results['listedCount'];
                                        var one_day_average_price = (results['avgPrice24hr'] / 10 ** 9)
                                        var total_volume = (results['volumeAll'] / 10 ** 9)


                                        if (floor_price) {

                                            db.query('INSERT INTO tma_collection SET ?', { collection_name, one_day_average_price, total_volume, count, floor_price, plateform_name }, (error, results) => {
                                                if (error) {
                                                    console.log(error);
                                                    res.json({ type: "error", message: "Impossible to add the collection name in the database, please try again later!" });
                                                } else {
                                                    db.query('INSERT INTO tma_fpalert SET ?', { custom_id, floor_price, one_day_average_price, collection_name, plateform_name, notifications_status }, (error, results) => {

                                                        if (error) {
                                                            console.log(error);
                                                            res.json({ type: "error", message: "Impossible to add the collection name in the database, please try again later!" });
                                                        }
                                                        res.json({ type: "success", message: "Collection added!" });
                                                    });
                                                }
                                            });
                                        } else {
                                            res.json({ type: "error", message: "Please check the collection name!" });
                                        }
                                    });

                                    result.on("error", function (error) {
                                        console.error(error);
                                    });
                                });
                                req.end();
                            }
                        } else {

                            const { floor_price, one_day_average_price, seven_day_average_price, thirty_day_average_price, collection_name, plateform_name, image_url, 	external_link, address, name  } = resultsCollection[0];

                            db.query('INSERT INTO tma_fpalert SET ?', { custom_id, floor_price, one_day_average_price, seven_day_average_price, thirty_day_average_price, collection_name, plateform_name, image_url, 	external_link, address,  notifications_status, name }, (error, results) => {
                                if (error) {
                                    console.log(error);
                                    res.json({ type: "error", message: "Impossible to add the collection name in the database, please try again later!" });
                                } else {
                                    res.json({ type: "success", message: "Collection added!" });
                                }
                            });
                        }
                    });

                });
            } else {
                res.json({ type: "error", message: "You reached the limit of 15 follows." });
            }
        });
    } else {
        res.status(404).json({ type: "error", message: "Please check the data!" });
    }
}


module.exports.submitSpecialAlert_post = (req, res) => {

    const { collection_name, collection_price, custom_id, plateformSelected } = req.body;
    if (collection_price != "" && collection_price != null && custom_id != "" && custom_id != null && collection_name != "" && collection_name != null && plateformSelected != "" && plateformSelected != null) {
        // Check is user a moins de 3" alert dans bdd
        db.query('SELECT custom_id, collection_name, collection_price FROM tma_fpalert_special WHERE custom_id = ?', [custom_id], async (error, resSpecialAlert) => {
            if (error) {
                console.log(error);
            }

            if (resSpecialAlert.length < 3) {
				for (let i of resSpecialAlert) {
					if (collection_name === i['collection_name']) {
						if (parseFloat(collection_price) === parseFloat(i['collection_price'])) {
							return res.json({ type: "error", message: 'An collection is already set with the same price alert' });
						}
					}
				}

                if ( plateformSelected == "opensea" ) {
                    // Check if collection exist in OpenSea
                    sdk['retrieving-a-single-collection']({ collection_slug: collection_name })
                        .then(success)
                        .catch(error);

                    function success(value) {
                        if (value) {
                            var floor_price = value['collection']['stats']['floor_price'];
                            var one_day_average_price = value['collection']['stats']['one_day_average_price'];
                            var seven_day_average_price = value['collection']['stats']['seven_day_average_price'];
                            var thirty_day_average_price = value['collection']['stats']['thirty_day_average_price'];
                            var image_url = value['collection']['image_url'] != "" ? value['collection']['image_url'] : "/";
                            var external_link = value['collection']['external_link'] != "" ? value['collection']['external_link'] : "/";
                            var name = value['collection']['name'];
                            var plateform_name = plateformSelected;

                            db.query('INSERT INTO tma_fpalert_special SET ?', { collection_name, collection_price, custom_id, floor_price, one_day_average_price, seven_day_average_price, thirty_day_average_price, image_url, external_link, name, plateform_name }, (error, results) => {
                                if (error) {
                                    res.status(404).json({ type: "error", message: "Impossible to add the collection name in the database, please try again later!" });
                                } else {
                                    res.status(201).json({ type: "success", message: "Collection added!" });
                                }
                            });
                        }
                    }
                    function error(err) {
                        console.log("Error: ", err);
                        res.status(404).json({ type: "error", message: "Please check the collection name!" });
                    }
                } else if (plateformSelected == "magiceden" ) {

                    var options = {
                        'method': 'GET',
                        'hostname': 'api-mainnet.magiceden.dev',
                        'path': '/v2/collections/' + collection_name + '/stats',
                        'headers': {
                        },
                        'maxRedirects': 20
                    };

                    var req = https.request(options, function (result) {
                        var chunks = [];

                        result.on("data", function (chunk) {
                            chunks.push(chunk);
                        });

                        result.on("end", function (chunk) {
                            var body = Buffer.concat(chunks);
                            var results = body.toString();
                            // console.log(results);
                            var results = JSON.parse(results);
                            var floor_price = results['floorPrice'] ? (results['floorPrice'] / 10 ** 9) : "";
                            var one_day_average_price = results['avgPrice24hr'] ? (results['avgPrice24hr'] / 10 ** 9) : "";
                            var plateform_name = plateformSelected;

                            if (floor_price) {

                                db.query('INSERT INTO tma_fpalert_special SET ?', { collection_name, collection_price, custom_id, floor_price, one_day_average_price, plateform_name }, (error, results) => {
                                    if (error) {
                                        res.json({ type: "error", message: "Impossible to add the collection name in the database, please try again later!" });
                                    } else {
                                        res.json({ type: "success", message: "Collection added!" });
                                    }
                                });


                            } else {
                                res.json({ type: "error", message: "Please check the collection name!" });
                            }
                        });

                        result.on("error", function (error) {
                            console.error(error);
                        });
                    });
                    req.end();
                }
            } else {
                res.status(400).json({ type: "error", message: 'You already have 3 custom alerts set for this account' });
            }
        });
    }
}

module.exports.deleteCollection = (req, res) => {
	var collection_name = req.body['collection_name'];
	var custom_id = req.body['customId'];

	db.query("DELETE FROM tma_fpalert WHERE custom_id = ? AND collection_name = ?",
		[custom_id, collection_name],
		(error, results) => {
			if (error) {
				console.log(error);
			} else {
				res.status(201).json({
					email: "OUI"
				});
			}
		});
}

module.exports.switchStatusApps = (req, res) => {

	var custom_id = req.body.customId;

	if (req.body.discordStatus != null) {
		var discord_notif_status = req.body.discordStatus;
		db.query('UPDATE tma_users SET discord_notif_status = ? WHERE custom_id = ?', [discord_notif_status, custom_id], (error, results) => {
			if (error) {
				console.log(error);
			} else {
				res.status(201).json({
					result: true
				});
			}
		});
	}
	if (req.body.telegramStatus != null) {
		var telegram_notif_status = req.body.telegramStatus;
		db.query('UPDATE tma_users SET telegram_notif_status = ? WHERE custom_id = ?', [telegram_notif_status, custom_id], (error, results) => {
			if (error) {
				console.log(error);
			} else {
				res.status(201).json({
					result: true
				});
			}
		});
	}
    if (req.body.emailStatus != null) {
        var email_notif_status = req.body.emailStatus;
        db.query('UPDATE tma_users SET email_notif_status = ? WHERE custom_id = ?', [email_notif_status, custom_id], (error, results) => {
            if (error) {
                console.log(error);
            } else {
                res.status(201).json({ result: true });
            }
        });
    }
}

module.exports.deleteAlert = (req, res) => {

	var collection_name = req.body['collection_name'];
	var collection_priceString = req.body['collection_price'];
	var custom_id = req.body['customId'];
	var collection_price = parseFloat(collection_priceString, 7);

	db.query("DELETE FROM tma_fpalert_special WHERE custom_id = ? AND collection_name = ? AND collection_price = ?",
		[custom_id, collection_name, collection_price],
		(error, results) => {
			if (error) {
				console.log(error);
			} else {
				res.status(201).json({
					email: "OUI"
				});
			}
		});
}


module.exports.switchCollectionNotification = (req, res) => {

    const { notifications_status, collection_name, custom_id } = req.body;

    if (notifications_status != null && collection_name != null && custom_id != null) {

        if (notifications_status) {
            getNumberOfCollectionsON(custom_id, function (err, data) {

                if (err) {
                    console.log("ERROR : ", err);
                } else {

                    if (data > 4) {
                        res.json({ type: "error", message: 'You already receiving notifications for 5 collections, please unfollow some collections and try again.' });
                    } else {

                        db.query('UPDATE tma_fpalert SET notifications_status = ? WHERE collection_name = ? AND custom_id = ?', [notifications_status, collection_name, custom_id], (error, results) => {
                            if (error) {
                                console.log(error);
                            } else {
                                res.json({ type: "success", message: 'You\'ll now received notifications for this collection' });
                            }
                        });
                    }
                }
            });
        } else {
            db.query('UPDATE tma_fpalert SET notifications_status = ? WHERE collection_name = ? AND custom_id = ?', [notifications_status, collection_name, custom_id], (error, results) => {
                if (error) {
                    console.log(error);
                } else {
                    res.json({ type: "success", message: 'You\'ll no longer receive notifications for this collection' });
                }
            });
        }
    }
}


module.exports.checkUserMail = (req, res) => {

    const { email, custom_id } = req.body;

    var uniqueId = uuid.v4();
    var check_email_key = uniqueId;
    var check_email_link = "https://trackmyassets.info/check/" + check_email_key;

    let transport = nodemailer.createTransport({
        host: 'node7-eu.n0c.com',
        port: 587,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    });

    const mailOptions = {
        from: 'contact@trackmyassets.info',
        to: email,
        subject: 'Verify Email Address for Track My Assets',
        // text: 'Hello People!, Welcome to Bacancy!',
        html: '<h2> Track My Assets - Email confirmation </h2><p>Please, click the following link to verify your email address: <a href='+ check_email_link +'>Confirm email</a></p>'
    };

    db.query('UPDATE tma_users SET check_email_key = ? WHERE email = ? AND custom_id = ?', [check_email_key, email, custom_id], (error, results) => {
        if (error) {
            console.log(error);
        } else {
            transport.sendMail(mailOptions, function (err, info) {
                if (err) {
                    console.log(err)
                } else {
                    console.log(info);
                }
            });
            res.json({ type: "success", message: 'An email has been sent, please click on the link to confirm your email.' });
        }
    });
}



// FUNCTIONS ANNEXES
function getNumberOfCollectionsON(custom_id, callback) {
    var notifications_status = true;

    db.query('SELECT collection_name FROM tma_fpalert WHERE custom_id = ? AND notifications_status = ?', [custom_id, notifications_status], function (err, collections) {
        if (err)
            callback(err, null);
        else
        console.log(collections);
            result = collections.length;
        callback(null, result);
    });
}