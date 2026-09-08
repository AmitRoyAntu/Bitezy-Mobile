const express = require('express');
const router = express.Router();
const { getProviderReviews, createReview, getAllReviews, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', protect, authorize('admin'), getAllReviews);
router.get('/provider/:providerId', getProviderReviews);
router.post('/', protect, authorize('buyer'), createReview);
router.delete('/:id', protect, authorize('admin'), deleteReview);

module.exports = router;
