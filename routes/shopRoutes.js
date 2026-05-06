const express        = require('express');
const router         = express.Router();
const { protect }    = require('../middleware/authMiddleware');
const shopController = require('../controllers/shopController');

router.get('/products',           protect, shopController.getProducts);
router.post('/buy',               protect, shopController.buyProduct);
router.get('/orders',             protect, shopController.getMyOrders);
router.post('/orders/:id/review', protect, shopController.addReview);

module.exports = router;
