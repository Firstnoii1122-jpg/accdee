const express        = require('express');
const router         = express.Router();
const authController = require('../controllers/authController');
const { protect }    = require('../middleware/authMiddleware');

router.post('/register',       authController.register);
router.post('/login',          authController.login);
router.post('/verify-otp',     authController.verifyOtp);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password',  authController.resetPassword);
router.post('/logout',          protect, authController.logout);

module.exports = router;
