const Order = require('../models/Order');
const Provider = require('../models/Provider');
const { User } = require('../models/User');

// GET /api/users (Private/Admin)
const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select("-password").sort("-createdAt");
        const orders = await Order.find({});

        const enrichedUsers = users.map(u => {
            const userOrders = orders.filter(o => String(o.customer?._id || o.customer) === String(u._id));
            const totalSpent = userOrders.reduce((s, o) => s + (o.total || 0), 0);
            return {
                ...u.toObject(),
                ordersCount: userOrders.length,
                totalSpent,
            };
        });

        res.json(enrichedUsers);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// GET /api/users/:id (Private/Admin)
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// PUT /api/users/:id/block (Private/Admin)
const updateUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isBlocked = req.body.isBlocked !== undefined ? req.body.isBlocked : user.isBlocked;
        const updatedUser = await user.save();

        if (user.role === 'seller') {
            await Provider.updateMany(
                { seller: user._id },
                { $set: { isBlocked: updatedUser.isBlocked, ...(updatedUser.isBlocked ? { isOpen: false } : {}) } }
            );
        }
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            isBlocked: updatedUser.isBlocked
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getUsers,
    getUserById,
    updateUserStatus,
};
