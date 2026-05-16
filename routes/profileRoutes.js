const express           = require('express');
const router            = express.Router();
const { protect }       = require('../middleware/authMiddleware');
const profileController = require('../controllers/profileController');

router.get('/profile',                   protect, profileController.getProfile);
router.put('/profile/username',          protect, profileController.updateUsername);
router.put('/profile/change-password',   protect, profileController.changePassword);

module.exports = router;
