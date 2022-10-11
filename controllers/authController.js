const bcrypt = require('bcryptjs');
const mysql = require("mysql");
const uuid = require("uuid");
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const sdk = require('api')('@opensea/v1.0#5zrwe3ql2r2e6mn');
const generator = require('generate-password');
var fs = require('fs');
const nodemailer = require('nodemailer');
const moment = require('moment');
dotenv.config({
	path: './.env'
});
const {
	stringify
} = require('querystring');
const request = require('request')

const db = mysql.createConnection({
	host: process.env.DATABASE_HOST,
	user: process.env.DATABASE_USER,
	password: process.env.DATABASE_PASSWORD,
	database: process.env.DATABASE
});

const transport = nodemailer.createTransport({
	host: 'node7-eu.n0c.com',
	port: 587,
	auth: {
		user: process.env.MAIL_USER,
		pass: process.env.MAIL_PASS
	}
});

const maxAge = 3 * 24 * 60 * 60; // 3 jours en secondes

const createToken = (email) => {
	return jwt.sign({
		email
	}, process.env.ACCESS_TOKEN_SECRET, {
		expiresIn: maxAge
	});
} // function qui return un cookies crée pour 3 jours


module.exports.signup_get = (req, res) => {
	// express va regarder directement dans le dossier views pour rechercher le fichier signup (render)
	res.render('signup');
}
module.exports.login_get = (req, res) => {
	// express va regarder directement dans le dossier views pour rechercher le fichier login (render)
	res.render('login');
}
module.exports.signup_post = (req, res) => {
	const { email, password } = req.body;

	if (!req.body.captcha)
		return res.json({
			success: false,
			msg: 'Please select captcha'
		});

	// Secret key
	const secretKey = process.env.GOOGLE_PRIVATE_KEY;

	// Verify URL
	const query = stringify({ secret: secretKey, response: req.body.captcha, remoteip: req.connection.remoteAddress });
	const verifyURL = `https://google.com/recaptcha/api/siteverify?${query}`;

	// Make a request to verifyURL
	request(verifyURL, (err, reponse, body) => {
		body = JSON.parse(body);

		// If not successful
		if (body.success !== undefined && !body.success) {
			return res.json({
				success: false,
				msg: 'Failed captcha verification, please reload the page'
			});
		} else {

			// connection sql pas comme le tuto
			db.query('SELECT email FROM tma_users WHERE email = ?', [email], async (error, results) => {
				if (error) {
					console.log(error);
				}
				if (results.length > 0) {
					return res.json({
						success: false,
						msg: 'Mail already used'
					});
				}
				// else if( password !== passwordConfirm) {
				//     console.log("alreary used");
				//     // return res.render('register', {
				//     //     message: 'The password do not match'
				//     // });
				// }

				let hashedPassword = await bcrypt.hash(password, 8);

				var uniqueId = uuid.v4();
				var customId = 'jo_' + uniqueId;
				var tokenId = Date.now();

				db.query('INSERT INTO tma_users SET ?', {
					email: email,
					password: hashedPassword,
					custom_id: customId
				}, (error, results) => {
					if (error) {
						console.log(error);
						return res.json({
							success: false,
							msg: 'Error: Please contact me at contact@trackmyassets.info or find me on Discord. (Code Error 103)'
						});
					} else {

                        var date = new Date();
                        var dateConvert = date.toISOString();

						db.query('INSERT INTO tma_users_status SET ?', {
							email: email,
							custom_id: customId,
							status_account: true,
                            date_creation: dateConvert
						}, (error, results) => {
							if (error) {
								console.log(error);
								return res.json({
									success: false,
									msg: 'Error: Please contact me at contact@trackmyassets.info or find me on Discord. (Code Error 104)'
								});

							} else {

								const mailOpt = {
									from: 'contact@trackmyassets.info',
									to: process.env.ADMIN_EMAIL,
									subject: 'TrackMyAssets - New user registered',
									// text: 'Hello People!, Welcome to Bacancy!',
									html: '<p> New user on Track My Assets just registered : ' + email + '</p>'
								};
								transport.sendMail(mailOpt, function(err, info) {
									if (err) {
										console.log(err)
									}
								});


								const token = createToken(email);
								res.cookie('jwt', token, {
									httpOnly: true,
									maxAge: maxAge * 1000
								}) // send the cookie // maxAge * 1000 => 3 days
								return res.json({
									success: true
								});


							}
						});

					}
				});
			});
		}
	})
}
module.exports.login_post = (req, res) => {
	const {
		email,
		password
	} = req.body;
	db.query('SELECT * FROM tma_users WHERE email = ?', [email], async (error, results) => {
		if (error) {
			console.log(error);
		}
		if (results.length > 0 && bcrypt.compareSync(password, results[0].password)) {
			const token = createToken(email);
			res.cookie('jwt', token, {
				httpOnly: true,
				maxAge: maxAge * 1000
			}) // send the cookie // maxAge * 1000 => 3 days
			return res.json({
				success: true
			});
		} else {
			return res.json({
				success: false,
				msg: 'Incorrect email or password'
			});
		}
	});
}

module.exports.logout_get = (req, res) => {
	res.cookie('jwt', '', {
		maxAge: 1
	}); // premiere methode pour supprimer le cookie et logout, c'est remplacer le cookie par un cookie du meme nom mais vide
	res.redirect('/');
}

module.exports.forgetPassword_post = (req, res) => {

	const {
		email
	} = req.body;

	db.query('SELECT * FROM tma_users WHERE email = ?', [email], async (error, results) => {
		if (error) {
			console.log(error);
		}
		if (results.length > 0) {

			var is_temporary_password = true;
			var tempPass = generator.generate({
				length: 10,
				numbers: true
			});
			let password = await bcrypt.hash(tempPass, 8);

			const mailOptions = {
				from: 'contact@trackmyassets.info',
				to: email,
				subject: 'TrackMyAssets - Forgot password',
				// text: 'Hello People!, Welcome to Bacancy!',
				html: '<h1> TrackMyAssets Password Recovery </h1><p>Here is your new temporary password: ' + tempPass + '</p><p>Don\'t forget to change it for your next login </p>'
			};

			db.query('UPDATE tma_users SET password = ?, is_temporary_password = ? WHERE email = ?', [password, is_temporary_password, email], (error, results) => {
				if (error) {
					console.log(error);
				} else {
					transport.sendMail(mailOptions, function(err, info) {
						if (err) {
							console.log(err)
						} else {
							console.log(info);
						}
					});
					res.status(201).json({
						result: {
							message: 'Email sent. Please login again with the password sent.'
						}
					});
				}
			});
		} else {
			res.status(400).json({
				errors: {
					message: 'Incorrect email'
				}
			});
		}
	});
}

module.exports.forgetPassword_get = (req, res) => {
	res.render('forgotPassword');
}




module.exports.deleteAccount_post = (req, res) => {

	var custom_id = req.body['customId'];
	var status_account = false;
    var date = new Date();
    var date_suppression = date.toISOString();

	db.query("DELETE FROM tma_fpalert_special WHERE custom_id = ?",
		[custom_id],
		(error, results) => {
			if (error) {
				console.log(error);
			} else {
				db.query("DELETE FROM tma_fpalert WHERE custom_id = ?",
					[custom_id],
					(error, results) => {
						if (error) {
							console.log(error);
						} else {
							db.query("DELETE FROM tma_users WHERE custom_id = ?",
								[custom_id],
								(error, results) => {
									if (error) {
										console.log(error);
									} else {

										db.query('UPDATE tma_users_status SET status_account = ?, date_suppression = ? WHERE custom_id = ?', [status_account, date_suppression, custom_id], (error, results) => {
											if (error) {
												console.log(error);
											} else {
												res.cookie('jwt', '', {
													maxAge: 1
												}); // premiere methode pour supprimer le cookie et logout, c'est remplacer le cookie par un cookie du meme nom mais vide
												res.status(201).json({
													result: true
												});
											}
										});

									}
								});
						}
					});
			}
		});
}


module.exports.changePassword_post = (req, res) => {

	const {
		oldPassword,
		newPassword,
		customId
	} = req.body;

	if (oldPassword != "" && newPassword != null && customId != "") {
		// Check previsous password
		db.query('SELECT * FROM tma_users WHERE custom_id = ?', [customId], async (error, results) => {
			if (error) {
				console.log(error);
			}

			var custom_id = customId;
			var hashedPassword = await bcrypt.hash(newPassword, 8);
			var password = hashedPassword;
			var is_temporary_password = false;

			if (results.length > 0 && bcrypt.compareSync(oldPassword, results[0].password)) {
				db.query('UPDATE tma_users SET password = ?, is_temporary_password = ? WHERE custom_id = ?', [password, custom_id, is_temporary_password], (error, results) => {
					if (error) {
						console.log(error);
					} else {
						res.cookie('jwt', '', {
							maxAge: 1
						}); // premiere methode pour supprimer le cookie et logout, c'est remplacer le cookie par un cookie du meme nom mais vide
						res.status(201).json({
							result: true
						});
					}
				});
			} else {
				res.status(400).json({
					errors: {
						message: 'You old password is incorrect'
					}
				});
			}
		});
	}
}
