// *****************************************************************************************************
// ****************      CRON THAT UPDATE EVERY MINUTE THE tma_collection TABLE     ********************
// *****************************************************************************************************

const cron      = require('node-cron');
const mysql     = require("mysql");
const sdk       = require('api')('@opensea/v1.0#5zrwe3ql2r2e6mn');
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});


cron.schedule('0 */1 * * * *', function () {
    const d = new Date();
    const dateStart = d.getTime();

    db.query('SELECT * FROM tma_collection  WHERE plateform_name = ?', [ "opensea" ] , async(error, results) => {


        if (error) {
            console.log(error);
        }

        for (let i of results) {
            await wait(260);
            const collection_name  = i['collection_name'];
            const floor_price  = i['floor_price'];

            const options = {
                method: 'GET',
                headers: {Accept: 'application/json', 'X-API-KEY': '329681f0b9bf4daa9e051e211a86d41b'}
                };

            sdk['retrieving-a-single-collection']({collection_slug: collection_name})
            .then(success)
            .catch(error);

            function success(value) {
                var stats = value['collection']['stats'];
                var primary_asset_contracts = value['collection']['primary_asset_contracts'][0];
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
                    'signature': ""
                }

                if ( floor_price !== collectionStats["floor_price"] ) {

                        fetch('https://api.opensea.io/api/v1/events?collection_slug='+ collection_name +'&event_type=created', options)
                        .then(response => response.json())
                        .then(successNFT)
                        .catch(errorNFT);

                    function successNFT(value) {

                        var signature = "";

                        if ( typeof value["asset_events"] !== 'undefined' ) {
                            for ( let i of value["asset_events"] ) {

                                var fp = (i["starting_price"] / 10 ** 18);

                                if ( collectionStats["floor_price"] == fp) {
                                    signature = i["asset"]["permalink"];

                                    db.query('UPDATE tma_collection SET signature = ? WHERE collection_name = ?', [ signature, collection_name ], (error, results) => {
                                        if (error) {
                                            console.log(error);
                                        }
                                    })
                                }
                            }
                        }
                    }
                    function errorNFT(err){
                        console.log(err);
                    }

                    db.query('UPDATE tma_collection SET ? WHERE collection_name = ?', [ collectionStats, collection_name ], (error, results) => {
                        if (error) {
                            console.log(error);
                        }
                    })
                }
            }

            function error(value) {
                console.log(value);
            }
        }
        const e = new Date();
        const dateEnd = e.getTime();
        var executionTime = (dateEnd - dateStart);
        console.log("> cron-update-collection-opensea : DATA UPDATE " + executionTime)
    })
});
