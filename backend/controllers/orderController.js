const mongoose = require('mongoose');
const Order = require('../models/Order');
const Provider = require('../models/Provider');

// POST /api/orders (Private/buyer)
const createOrder = async (req, res) => {
    try {
        let { provider, providerName, items, subtotal, deliveryFee, total, type, deliveryAddress } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No order items in cart' });
        }

        // Validate and resolve provider ObjectId
        if (!provider || !mongoose.Types.ObjectId.isValid(provider)) {
            const searchTarget = providerName || provider || '';
            const foundProvider = await Provider.findOne({
                $or: [
                    { name: new RegExp(`^${searchTarget}$`, 'i') },
                    { name: /canteen/i }
                ]
            }) || await Provider.findOne();

            if (foundProvider) {
                provider = foundProvider._id;
            } else {
                return res.status(400).json({ message: 'No active canteen found to place order' });
            }
        }

        const calculatedSubtotal = Number(subtotal) || items.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty || 1)), 0);
        const orderType = (type || 'delivery').toLowerCase();
        const calculatedFee = Number(deliveryFee) !== undefined ? Number(deliveryFee) : (orderType === 'delivery' ? 30 : 0);
        const calculatedTotal = Number(total) || (calculatedSubtotal + calculatedFee);

        const order = new Order({
            customer: req.user._id,
            provider,
            items: items.map(i => ({
                name: i.name,
                price: Number(i.price),
                qty: Number(i.qty) || 1,
                img: i.img || ''
            })),
            subtotal: calculatedSubtotal,
            deliveryFee: calculatedFee,
            total: calculatedTotal,
            type: orderType,
            deliveryAddress: deliveryAddress || (orderType === 'delivery' ? (req.user.residence || 'Campus Hall Room') : 'Pickup at counter')
        });

        const createdOrder = await order.save();
        const populatedOrder = await Order.findById(createdOrder._id)
            .populate('provider', 'name location')
            .populate('customer', 'name phone residence');

        res.status(201).json(populatedOrder);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// GET /api/orders/:id (Private)
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = await Order.findById(id)
            .populate('customer', 'name email phone residence')
            .populate('provider', 'name location');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// PUT /api/orders/:id/status (Private/Seller)
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (req.user.role === 'seller') {
            const provider = await Provider.findOne({ seller: req.user._id });
            if (provider && order.provider && order.provider.toString() !== provider._id.toString()) {
                // allow admin or matching seller
                if (req.user.role !== 'admin') {
                    return res.status(403).json({ message: 'You are not authorized to update this order' });
                }
            }
        }

        order.status = req.body.status || order.status;
        const updatedOrder = await order.save();

        const populated = await Order.findById(updatedOrder._id)
            .populate('provider', 'name')
            .populate('customer', 'name phone residence');

        res.json(populated);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// GET /api/orders/myorders (Private/buyer)
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ customer: req.user._id })
            .populate('provider', 'name location')
            .sort('-createdAt');
        res.json(orders);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// GET /api/orders/seller (Private/Seller)
const getSellerOrders = async (req, res) => {
    try {
        let provider = await Provider.findOne({ seller: req.user._id });

        if (!provider && req.user.shopName) {
            provider = await Provider.findOne({ name: new RegExp(`^${req.user.shopName}$`, 'i') });
            if (provider) {
                provider.seller = req.user._id;
                await provider.save();
            }
        }

        if (!provider) {
            return res.json([]);
        }

        const orders = await Order.find({ provider: provider._id })
            .populate('customer', 'name phone residence')
            .populate('provider', 'name')
            .sort('-createdAt');
        res.json(orders);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


// GET /api/orders (Private/Admin)
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('customer', 'name phone residence')
            .populate('provider', 'name location')
            .sort('-createdAt');
        res.json(orders);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createOrder,
    getOrderById,
    updateOrderStatus,
    getMyOrders,
    getSellerOrders,
    getAllOrders
};
