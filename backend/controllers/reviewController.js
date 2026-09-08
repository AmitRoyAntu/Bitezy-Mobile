const mongoose = require('mongoose');
const Review = require('../models/Review');
const Provider = require('../models/Provider');

const syncProviderRating = async (providerId) => {
    try {
        if (!providerId || !mongoose.Types.ObjectId.isValid(providerId)) return;

        const stats = await Review.aggregate([
            { $match: { provider: new mongoose.Types.ObjectId(providerId) } },
            { $group: { _id: null, avgRating: { $avg: "$rating" } } },
        ]);

        const rating = stats.length > 0 ? Number(stats[0].avgRating.toFixed(1)) : 0;
        await Provider.findByIdAndUpdate(providerId, { rating });
    } catch (err) {
        console.warn('syncProviderRating error:', err.message);
    }
};

// GET /api/reviews/provider/:providerId (Public)
const getProviderReviews = async (req, res) => {
    try {
        const { providerId } = req.params;
        let queryProvider = null;

        if (mongoose.Types.ObjectId.isValid(providerId)) {
            queryProvider = providerId;
        } else {
            // Find provider by name or fallback
            const p = await Provider.findOne({
                $or: [
                    { name: new RegExp(`^${providerId}$`, 'i') },
                    { name: /canteen/i }
                ]
            });
            if (p) queryProvider = p._id;
        }

        if (!queryProvider) {
            return res.json([]);
        }

        const reviews = await Review.find({ provider: queryProvider })
            .populate('buyer', 'name')
            .sort('-createdAt');
        res.json(reviews);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// POST /api/reviews (Private)
const createReview = async (req, res) => {
    try {
        let { provider, rating, comment } = req.body;

        if (!provider || !mongoose.Types.ObjectId.isValid(provider)) {
            const foundProvider = await Provider.findOne({
                $or: [
                    { name: new RegExp(`^${provider}$`, 'i') },
                    { name: /canteen/i }
                ]
            }) || await Provider.findOne();
            if (foundProvider) {
                provider = foundProvider._id;
            } else {
                return res.status(400).json({ message: 'Valid provider is required for review' });
            }
        }

        const review = await Review.create({
            provider,
            buyer: req.user._id,
            rating: Number(rating) || 5,
            comment: comment || '',
        });

        await syncProviderRating(provider);

        const populatedReview = await Review.findById(review._id).populate('buyer', 'name');
        res.status(201).json(populatedReview);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// GET /api/reviews (Private/Admin)
const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find({})
            .populate('buyer', 'name')
            .populate('provider', 'name location')
            .sort('-createdAt');
        res.json(reviews);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// DELETE /api/reviews/:id (Private/Admin)
const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: 'Review not found' });
        }

        const review = await Review.findById(id);
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        const providerId = review.provider;
        await Review.findByIdAndDelete(id);
        await syncProviderRating(providerId);
        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProviderReviews,
    createReview,
    getAllReviews,
    deleteReview,
};
