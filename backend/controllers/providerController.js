const mongoose = require("mongoose");
const Provider = require("../models/Provider");
const { User } = require("../models/User");
const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");
const Review = require("../models/Review");

const calculateIsOpen = (openTime, closeTime) => {
    if (!openTime || !closeTime) return false;

    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const bdTime = new Date(utcTime + (3600000 * 6));

    const currentH = bdTime.getHours();
    const currentM = bdTime.getMinutes();
    const currentTime = currentH * 60 + currentM;

    const [openH, openM] = (openTime || "").split(":").map(Number);
    const [closeH, closeM] = (closeTime || "").split(":").map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    if (closeMinutes < openMinutes) {
        return currentTime >= openMinutes || currentTime < closeMinutes;
    }
    return currentTime >= openMinutes && currentTime < closeMinutes;
};


// GET /api/providers (Public)
const getProviders = async (req, res) => {
    try {
        const providers = await Provider.find({}).populate("seller", "phone name email isBlocked");
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
            provider = await Provider.findById(id).populate("seller", "phone name email isBlocked");
        }

        if (!provider) {
            provider = await Provider.findOne({ name: new RegExp(`^${id}$`, "i") }).populate("seller", "phone name email isBlocked");
        }

        if (!provider) {
            return res.status(404).json({ message: "Provider not found" });
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
            return res.status(401).json({ message: "Seller authentication required" });
        }

        let provider = await Provider.findOne({ seller: req.user._id });

        if (!provider && req.user.shopName) {
            provider = await Provider.findOne({ name: new RegExp(`^${req.user.shopName}$`, "i") });
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
                location: req.user.location || req.user.residence || "CUET Campus",
                description: "Fresh quality campus meals and fast delivery.",
                type: "Canteen",
                deliveryTime: "15-20 min",
                img: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80",
                openTime: "06:00",
                closeTime: "23:00",
                isOpen: true,
                rating: 0
            });
        }

        res.json(provider);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// GET /api/providers/admin/sellers (Private/Admin)
const getAdminSellers = async (req, res) => {
    try {
        const providers = await Provider.find({}).populate("seller", "-password");
        const orders = await Order.find({});
        const menuItems = await MenuItem.find({});
        const reviews = await Review.find({});

        const sellersList = providers.map(p => {
            const provId = String(p._id);
            const pOrders = orders.filter(o => String(o.provider?._id || o.provider) === provId);
            const pMenu = menuItems.filter(m => String(m.provider?._id || m.provider) === provId);
            const pReviews = reviews.filter(r => String(r.provider?._id || r.provider) === provId);
            const totalRev = pOrders.reduce((sum, o) => sum + (o.total || 0), 0);

            return {
                _id: p._id,
                id: p._id,
                name: p.name,
                type: p.type,
                location: p.location,
                deliveryTime: p.deliveryTime,
                openTime: p.openTime,
                closeTime: p.closeTime,
                isOpen: p.isOpen,
                isBlocked: p.isBlocked || p.seller?.isBlocked || false,
                img: p.img,
                description: p.description,
                seller: p.seller ? {
                    _id: p.seller._id,
                    name: p.seller.name,
                    email: p.seller.email,
                    phone: p.seller.phone,
                    isBlocked: p.seller.isBlocked || false,
                } : {
                    _id: null,
                    name: "Unassigned",
                    email: "N/A",
                    phone: "N/A",
                    isBlocked: false,
                },
                stats: {
                    totalOrders: pOrders.length,
                    totalRevenue: totalRev,
                    menuItemsCount: pMenu.length,
                    rating: p.rating || 0,
                    reviewCount: pReviews.length,
                }
            };
        });

        res.json(sellersList);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// PUT /api/providers/:id/block (Private/Admin)
const toggleProviderBlock = async (req, res) => {
    try {
        const { id } = req.params;
        const { isBlocked } = req.body;

        let provider = await Provider.findById(id);
        if (!provider) {
            return res.status(404).json({ message: "Provider not found" });
        }

        const newBlockedState = isBlocked !== undefined ? isBlocked : !provider.isBlocked;
        provider.isBlocked = newBlockedState;
        if (newBlockedState) {
            provider.isOpen = false;
        }
        await provider.save();

        if (provider.seller) {
            await User.findByIdAndUpdate(provider.seller, { isBlocked: newBlockedState });
        }

        const populated = await Provider.findById(provider._id).populate("seller", "-password");
        res.json({
            success: true,
            provider: populated,
            isBlocked: newBlockedState
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


// PUT /api/providers/:id (Private/Seller or Admin)
const updateProvider = async (req, res) => {
    try {
        const { id } = req.params;
        let provider = await Provider.findById(id);
        if (!provider) {
            return res.status(404).json({ message: "Provider not found" });
        }

        if (req.user.role !== "admin" && String(provider.seller) !== String(req.user._id)) {
            return res.status(403).json({ message: "Not authorized to update this provider" });
        }

        const allowedFields = ["name", "type", "location", "description", "openTime", "closeTime", "deliveryTime", "img", "isOpen"];
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                provider[field] = req.body[field];
            }
        });

        if (req.body.isOpen === undefined && (req.body.openTime || req.body.closeTime)) {
            provider.isOpen = calculateIsOpen(provider.openTime, provider.closeTime);
        }

        await provider.save();

        if (provider.seller && req.body.name) {
            await User.findByIdAndUpdate(provider.seller, { shopName: req.body.name });
        }

        const populated = await Provider.findById(provider._id).populate("seller", "-password");
        res.json(populated);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProviders,
    getProviderById,
    getMyProvider,
    getAdminSellers,
    toggleProviderBlock,
    updateProvider,
};
