const express = require('express');
const router = express.Router();

const { getHomeData, getReviews, createReview } = require('../controllers/home.controller');
const protect = require('../middlewares/auth.middleware');

// Public landing-page data
router.get('/', getHomeData);

// Reviews
router.get('/reviews', getReviews);
router.post('/reviews', protect, createReview);

module.exports = router;
