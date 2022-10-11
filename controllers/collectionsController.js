const mysql = require("mysql");
const dotenv = require('dotenv');
const sdk = require('api')('@opensea/v1.0#5zrwe3ql2r2e6mn');
var fs = require('fs');
const moment = require('moment');
dotenv.config({
	path: './.env'
});

const db = mysql.createConnection({
	host: process.env.DATABASE_HOST,
	user: process.env.DATABASE_USER,
	password: process.env.DATABASE_PASSWORD,
	database: process.env.DATABASE
});


module.exports.showChartCollection_post = (req, res) => {
    var collection_name = req.body['collection_name'];

    db.query("(SELECT floor_price, date FROM tma_fp_records WHERE collection_name = ? ORDER BY id DESC LIMIT 240) ORDER BY date ASC;",
    [ collection_name ],
    (error, results) => {
        if (error) {
            console.log(error);
        } else {
            if ( results.length >= 1 ) {
                for(let i in results){
                    date = results[i]['date'];
                    results[i]['date'] =  moment(date).format('YYYY-MM-DD HH:mm:ss');
                }
                res.json({  type: "success" , data: results });
            } else {
                res.json({ type: "error" , data: "No data available for this collection. Please try later !" });
            }
        }
    });
}


module.exports.submitWalletAddress = (req, res) => {

    const { wallet_address, custom_id } = req.body;

    if ( wallet_address != null && wallet_address != "" ) {

        sdk['getting-assets']({
        owner: wallet_address,
        order_direction: 'desc',
        limit: '50',
        include_orders: 'false',
        'X-API-KEY': process.env.API_KEY_OPENSEA
        })
        .then(success)
        .catch(error);

        function success(value) {

            if (value["assets"]) {

                var asset_collection = [];
                for (let i of value["assets"]) {

                    var id_nft = i["id"];
                    var name = i["name"];
                    var description = i["description"];
                    var external_link = i["external_link"];
                    var image_url = i["image_url"];

                    var price = i["last_sale"] ? i["last_sale"]["total_price"] : "" ;

                    if ( price ) { var total_price = ( price / 10 ** 18 ); } else { var total_price = "" ;}

                    var event_timestamp = i["last_sale"] ? i["last_sale"]["event_timestamp"] : "" ;
                    var symbol = i["last_sale"] ? i["last_sale"]["symbol"] : "" ;
                    var address_contract = i["asset_contract"]["address"];
                    var token_id = i["token_id"];


                    var collection_name = i["collection"]["name"];
                    var slug = i["collection"]["slug"];
                    var image_url_collection = i["collection"]["image_url"];

                    db.query('INSERT INTO tma_wallet SET ?', { custom_id, id_nft, name, description, external_link, image_url, total_price, event_timestamp, symbol, address_contract, token_id, collection_name, slug, image_url_collection}, async(error, result) => {
                        if (error) {
                            console.log(error);
                        }
                    });
                }
                res.json({ type: "success", message: 'Wallet found. Displaying result...' });
            }
        }
        function error(err) {
            console.log(err);
            res.status(401).json({ type: "success", message: 'Check the wallet address' });
        }
    }
};

module.exports.dscntWalletAddress = (req, res) => {

    const { wallet_address, custom_id } = req.body;

    if ( wallet_address != null && custom_id != null ) {

        db.query("DELETE FROM tma_wallet WHERE custom_id = ?",
        [custom_id],
        (error, results) => {
            if (error) {
                res.json({ type: "error", message: 'Impossible to disconnect the wallet, please contact me via Discord' });
            } else {
                res.json({ type: "success", message: 'Disconnect from the wallet' });
            }
        });
    }
};
