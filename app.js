// **************************************************************************************//
// ****** IN CASE OF PROBLEM OR MAINTENANCE SET VARIABLE MAINTENANCE = TRUE ************ //
// **************************************************************************************//
const maintennace = false;
// **************************************************************************************//
// **************************************************************************************//

const express = require('express');
const dotenv = require('dotenv');
const mysql = require("mysql");
var cookieParser = require('cookie-parser')

//link le fichier de routes
const routes = require('./routes/routes');
const { requireAuth, checkUser } = require('./middleware/authMiddleware'); // importer le fichier
const { dashboardGlobal, getFpInfosUser, getCollection, getInfosWallet, checkMailUser } = require('./controllers/functions');

require('./cron/script-check-discord'); // importer le fichier
require('./cron/script-check-telegram'); // importer le fichier

require('./cron/cron-send-global-alert'); // importer le fichier
require('./cron/cron-send-custom-alert'); // importer le fichier

require('./cron/cron-update-collection-opensea'); // importer le fichier
require('./cron/cron-update-collection-looksrare'); // importer le fichier
require('./cron/cron-update-collection-magiceden'); // importer le fichier



// Call to the credential file
dotenv.config({ path: './.env'});

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    // port: '3000'
});

const app = express();

// middleware
app.use(express.static('public'));

app.use(express.json()); // important pour recuperer les data depuis les form envoyés en format json
app.use(cookieParser());

// view engine
app.set('view engine', 'ejs');

// database connection
db.connect( (error) => {
    if(error) {
        console.log(error);
    } else {
        console.log("Mysql connected...");
    }
})

if ( maintennace ) {
    app.get('/', (req, res) => res.render('maintenance'));
} else {
    app.get('*', checkUser); // applique cette methode sur chaque route de l'app
    app.get('/dashboard', dashboardGlobal);

    app.get('/dashboard', getFpInfosUser);
    app.get('/dashboard', requireAuth, (req, res) => res.render('dashboard'));

    app.get('/wallet', dashboardGlobal);
    app.get('/wallet', getInfosWallet);
    app.get('/wallet', requireAuth, (req, res) => res.render('wallet'));

    app.get('/collection/:collection', getCollection);
    app.get('/collection/:collection', requireAuth, (req, res) => res.render('collection'));

    app.get('/check/:hash', checkMailUser);
    app.get('/check/:hash', requireAuth, (req, res) => res.render('check-email'));

    app.get('/', (req, res) => res.render('home'));
}

app.get('/sitemap.xml', function(req, res) {
    res.sendFile( __dirname + '/sitemap.xml');
});

// Pour link le fichier de routes (au aurait pu mettre toutes les routes dans le fichier app.js mais c'est plus propre de séparer dans un fichier)
app.use(routes);
app.listen(5000, () => { console.log("Server started on port 5000");})