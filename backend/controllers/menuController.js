const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Provider = require('../models/Provider');

// GET /api/menu (Public)
const getMenuItems = async (req, res) => {
    try {
        const vendorId = req.query.vendor;
        const availableOnly = req.query.available === 'true';
        
        let query = {};

        if (vendorId) {
            if (mongoose.Types.ObjectId.isValid(vendorId)) {
                query.provider = vendorId;
            } else {
                // Try finding provider by name or fallback
                const p = await Provider.findOne({
                    $or: [
                        { name: new RegExp(`^${vendorId}$`, 'i') },
                        { name: /canteen/i }
                    ]
                });
                if (p) query.provider = p._id;
            }
        }

        if (availableOnly) {
            query.available = true;
        }
        
        const items = await MenuItem.find(query).populate('provider', 'name location');
        res.json(items);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// GET /api/menu/:id (Public)
const getMenuItemById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        const item = await MenuItem.findById(id).populate('provider', 'name');
        if (!item) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.json(item);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// POST /api/menu (Private/Seller)
const createMenuItem = async (req, res) => {
    try {
        const { name, category, price, desc, img } = req.body;
        
        let provider = await Provider.findOne({ seller: req.user._id });
        
        if (!provider) {
            provider = await Provider.create({
                name: req.user.shopName || `${req.user.name}'s Canteen`,
                seller: req.user._id,
                location: req.user.residence || 'CUET Campus',
                type: 'Canteen',
                deliveryTime: '15-20 min',
                isOpen: true,
                rating: 4.8
            });
        }

        const item = await MenuItem.create({
            name, 
            category: category || 'Main', 
            price: Number(price) || 0, 
            desc: desc || '', 
            img: img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80', 
            available: true, 
            provider: provider._id
        });
        
        res.status(201).json(item);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// PUT /api/menu/:id (Private/Seller)
const updateMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        const item = await MenuItem.findById(id);
        if (!item) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        const provider = await Provider.findOne({ seller: req.user._id });
        if (req.user.role !== 'admin' && (!provider || item.provider.toString() !== provider._id.toString())) {
            return res.status(403).json({ message: 'Not authorized to update this item' });
        }

        const updatedItem = await MenuItem.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updatedItem);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// DELETE /api/menu/:id (Private/Seller)
const deleteMenuItem = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        const item = await MenuItem.findById(id);
        if (!item) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        const provider = await Provider.findOne({ seller: req.user._id });
        if (req.user.role !== 'admin' && (!provider || item.provider.toString() !== provider._id.toString())) {
            return res.status(403).json({ message: 'Not authorized to delete this item' });
        }

        await MenuItem.findByIdAndDelete(id);
        res.json({ message: 'Item removed successfully' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMenuItems,
    getMenuItemById,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
};
