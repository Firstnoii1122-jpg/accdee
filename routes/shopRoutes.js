const express        = require('express');
const router         = express.Router();
const { protect }    = require('../middleware/authMiddleware');
const shopController = require('../controllers/shopController');

router.get('/reviews/public',     shopController.getPublicReviews); // public
router.get('/products',                    shopController.getProducts); // public — guest ดูสินค้าได้ แต่กด buy ต้อง login
router.post('/buy',               protect, shopController.buyProduct);
router.get('/orders',             protect, shopController.getMyOrders);
router.post('/orders/:id/review', protect, shopController.addReview);

module.exports = router;
