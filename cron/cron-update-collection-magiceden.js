// *****************************************************************************************************
// ****************      CRON THAT UPDATE EVERY MINUTE THE tma_collection TABLE     ********************
// *****************************************************************************************************

const cron      = require('node-cron');
const mysql     = require("mysql");
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const https     = require('follow-redirects').https;

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});


cron.schedule('0 */1 * * * *', function () {
    const d = new Date();
    const dateStart = d.getTime();

    db.query('SELECT * FROM tma_collection  WHERE plateform_name = ?', [ "magiceden" ] , async(error, results) => {


        if (error) {
            console.log(error);
        }

        for (let i of results) {
            await wait(260);
            const collection_name  = i['collection_name'];
            const floor_price  = i['floor_price'];

            var options = {
                'method': 'GET',
                'hostname': 'api-mainnet.magiceden.dev',
                'path': '/v2/collections/' + collection_name + '/stats',
                'headers': {},
                'maxRedirects': 20
            };

            var optionsActi = {
                'method': 'GET',
                'hostname': 'api-mainnet.magiceden.dev',
                'path': '/v2/collections/' + collection_name + '/activities?offset=0&limit=100',
                'headers': {},
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
                    var results = JSON.parse(results);

                    var collectionStatsME = {
                        'floor_price' : (results['floorPrice'] / 10 ** 9),
                        'count' : results['listedCount'],
                        'one_day_average_price' : (results['avgPrice24hr'] / 10 ** 9),
                        'total_volume' : (results['volumeAll'] / 10 ** 9)
                    }

                    floor_price_updated = collectionStatsME['floor_price'];

                    if ( floor_price != floor_price_updated) {


                        var reqActivities = https.request(optionsActi, function (resultActivities) {
                            var chunksActivities = [];

                            resultActivities.on("data", function (chunk) {
                                chunksActivities.push(chunk);
                            });

                            resultActivities.on("end", function (chunk) {
                                var body = Buffer.concat(chunksActivities);
                                var resultsActivities = body.toString();
                                var resultsActivities = JSON.parse(resultsActivities);

                                var blockTime = 0;
                                var signature = "";
                                collectionStatsME["signature"] = signature;

                                db.query('UPDATE tma_collection SET ? WHERE collection_name = ?', [ collectionStatsME, collection_name ], (error, results) => {
                                    if (error) {
                                        console.log(error);
                                    }
                                });
                                for ( let j of resultsActivities ) {
                                    if ( collection_name == j['collection'] && j['price'] == floor_price_updated && j['type'] == "list") {

                                        if ( j['blockTime'] > blockTime) {
                                            blockTime = j['blockTime'];
                                            signature = j['tokenMint'];

                                            db.query('UPDATE tma_collection SET signature = ? WHERE collection_name = ?', [ signature, collection_name ], (error, results) => {
                                                if (error) {
                                                    console.log(error);
                                                    res.json({ type: "error", message: "Impossible to add the collection name in the database, please try again later!" });
                                                }
                                            });
                                        }
                                    }
                                }
                            })
                        });
                        reqActivities.end();
                    }
                });

                result.on("error", function (error) {
                    console.error(error);
                });
            });
            req.end()
        }
        const e = new Date();
        const dateEnd = e.getTime();
        var executionTime = (dateEnd - dateStart);
        console.log("> cron-update-collection-magiceden : DATA UPDATE " + executionTime)
    })
});
