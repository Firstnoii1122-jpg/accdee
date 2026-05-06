const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/telegramController');

router.post('/webhook', controller.handleWebhook);

module.exports = router;
