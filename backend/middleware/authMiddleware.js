const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            if (!token || token.startsWith('mock_token_')) {
                return res.status(401).json({ message: 'Session expired or mock token, please log in again' });
            }

            const secret = process.env.JWT_SECRET || 'bitezy-development-secret-change-in-production';
            const decoded = jwt.verify(token, secret);

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'User account not found, please log in again' });
            }

            return next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
        }
    }

    return res.status(401).json({ message: 'Not authorized, no token provided' });
};

module.exports = { protect };
