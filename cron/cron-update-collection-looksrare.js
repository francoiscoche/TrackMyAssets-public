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

    db.query('SELECT * FROM tma_collection WHERE plateform_name = ?', [ "looksrare" ] , async(error, results) => {


        if (error) {
            console.log(error);
        }

        for (let i of results) {
            await wait(260);
            const address  = i['address'];
            const floor_price  = i['floor_price'];

            var optionsStats = {
                'method': 'GET',
                'hostname': 'api.looksrare.org',
                'path': '/api/v1/collections/stats?address=' + address,
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

                        var collectionStats = {
                            'floor_price': (resultsStats['data']['floorPrice'] / 10 ** 18),
                            'one_day_average_price': (resultsStats['data']['average24h'] / 10 ** 18),
                            'seven_day_average_price': (resultsStats['data']['average7d'] / 10 ** 18),
                            'thirty_day_average_price': (resultsStats['data']['average1m'] / 10 ** 18),
                        }

                        if ( floor_price !== collectionStats["floor_price"] ) {
                            db.query('UPDATE tma_collection SET ? WHERE address = ?', [ collectionStats, address ], (error, results) => {
                                if (error) {
                                    console.log(error);
                                }
                            });
                        }
                    }
                });

                resultStats.on("error", function (error) {
                    console.error(error);
                });
            });

            reqStats.end();
        }
        const e = new Date();
        const dateEnd = e.getTime();
        var executionTime = (dateEnd - dateStart);
        console.log("> cron-update-collection-looksrare : DATA UPDATE " + executionTime)
    })

});
