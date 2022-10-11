const { Router } = require('express');

// Fait reference au dossier controller pour importer les fonctions
const authController = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController');
const collectionsController = require('../controllers/collectionsController');
const router = Router();

// Route qui font référence au dossier views
// Les fontions de callback qui devrait etre dans ce fichier vont etre séparés dans le dossier controllers

// AUTH CONTROLLER
router.get('/signup', authController.signup_get);
router.post('/signup', authController.signup_post);
router.get('/login', authController.login_get);
router.post('/login', authController.login_post);
router.get('/logout', authController.logout_get);
router.post('/forgotPassword', authController.forgetPassword_post);
router.get('/forgotPassword', authController.forgetPassword_get);
router.post('/changePassword', authController.changePassword_post);
router.post('/deleteAccount', authController.deleteAccount_post);

// DASHBOARD CONTROLLER
router.post('/submitCollection', dashboardController.submitCollection_post);
router.post('/submitSpecialAlert', dashboardController.submitSpecialAlert_post);
router.post('/deleteCollection', dashboardController.deleteCollection);
router.post('/switchStatusApps', dashboardController.switchStatusApps);
router.post('/deleteAlert', dashboardController.deleteAlert);
router.post('/switchCollectionNotification', dashboardController.switchCollectionNotification);
router.post('/checkUserMail', dashboardController.checkUserMail);

// COLLECTION CONTROLLER
router.post('/showChartCollection', collectionsController.showChartCollection_post);
router.post('/submitWalletAddress', collectionsController.submitWalletAddress);
router.post('/dscntWalletAddress', collectionsController.dscntWalletAddress);


module.exports = router;