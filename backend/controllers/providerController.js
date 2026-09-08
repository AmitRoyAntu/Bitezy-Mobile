const mongoose = require('mongoose');
const Provider = require('../models/Provider');

// GET /api/providers (Public)
const getProviders = async (req, res) => {
    try {
        const providers = await Provider.find({}).populate('seller', 'phone name email');
        res.json(providers);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// GET /api/providers/:id (Public)
const getProviderById = async (req, res) => {
    try {
        const { id } = req.params;
        let provider = null;

        if (mongoose.Types.ObjectId.isValid(id)) {
            provider = await Provider.findById(id).populate('seller', 'phone name email');
        }

        if (!provider) {
            // Fallback search by name or first provider
            provider = await Provider.findOne({ name: new RegExp(`^${id}$`, 'i') }).populate('seller', 'phone name email');
        }

        if (!provider) {
            return res.status(404).json({ message: 'Provider not found' });
        }
        res.json(provider);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// GET /api/providers/myprovider (Private/Seller)
const getMyProvider = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Seller authentication required' });
        }

        let provider = await Provider.findOne({ seller: req.user._id });

        if (!provider && req.user.shopName) {
            provider = await Provider.findOne({ name: new RegExp(`^${req.user.shopName}$`, 'i') });
            if (provider) {
                provider.seller = req.user._id;
                await provider.save();
            }
        }

        // Auto-heal: If seller still has no provider document, create one seamlessly
        if (!provider) {
            provider = await Provider.create({
                name: req.user.shopName || `${req.user.name}'s Canteen`,
                seller: req.user._id,
                location: req.user.location || req.user.residence || 'CUET Campus',
                description: 'Fresh quality campus meals and fast delivery.',
                type: 'Canteen',
                deliveryTime: '15-20 min',
                img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
                openTime: '06:00',
                closeTime: '23:00',
                isOpen: true,
                rating: 4.8
            });
        }

        res.json(provider);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProviders,
    getProviderById,
    getMyProvider,
};
