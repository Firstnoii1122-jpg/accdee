const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/telegramController');

router.post('/webhook',      controller.handleWebhook);
router.post('/uptime-alert', controller.uptimeAlert);

module.exports = router;
