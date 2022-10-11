const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
dotenv.config({ path: './.env'});


// function pour la verification si le user est login pour naviguer sur certaines pages
const requireAuth = (req, res, next) => {

    const token = req.cookies.jwt; // pour récuperer le cookie depuis le navigateur // jwt est le nom du cookie

    // check is token exist
    if (token) {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                res.redirect('/login');
            } else {
                // console.log(decodedToken);
                next(); // si cookie correct on peut continuer la navigation
            }
        }); // on verifie la validé du token

    } else {
        // redirection vers login screen
        res.redirect('/login');
    }
}

// check current user
const checkUser = (req, res, next) => {
    const token = req.cookies.jwt; // pour récuperer le cookie depuis le navigateur // jwt est le nom du cookie
    // check if token exist
    if (token) {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                res.locals.user = null;
                next();
            } else {
                // console.log(decodedToken);
                let user = decodedToken;
                res.locals.user = user;
                next(); // si cookie correct on peut continuer la navigation
            }
        }); // on verifie la validé du token

    } else {
        res.locals.user = null;
        next();
    }
}




// exporter les functions pour etre utilisable ailleurs 
module.exports = { requireAuth, checkUser}