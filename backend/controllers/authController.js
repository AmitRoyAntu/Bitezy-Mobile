const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Buyer, Seller } = require('../models/User');
const Provider = require('../models/Provider');
const { sendMail } = require('../utils/mailer');

// Helper to check if current time is within open/close window
const calculateIsOpen = (openTime, closeTime) => {
    if (!openTime || !closeTime) return false;

    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const bdTime = new Date(utcTime + (3600000 * 6));

    const currentH = bdTime.getHours();
    const currentM = bdTime.getMinutes();
    const currentTime = currentH * 60 + currentM;

    const [openH, openM] = openTime.split(':').map(Number);
    const [closeH, closeM] = closeTime.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    if (closeMinutes < openMinutes) {
        return currentTime >= openMinutes || currentTime < closeMinutes;
    }
    return currentTime >= openMinutes && currentTime < closeMinutes;
};

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'bitezy-development-secret-change-in-production', {
        expiresIn: '30d',
    });
};

// POST /api/auth/register (Public)
const registerUser = async (req, res) => {
    try {
        const {
            name, email, password, phone, role,
            buyerType, cuetId, department, residence,
            shopName, location, description, openTime, closeTime,
            type, deliveryTime, img
        } = req.body;

        if (!name || !email || !password || !phone) {
            return res.status(400).json({ message: 'Please add all required fields' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let user;
        if (role === 'seller') {
            user = await Seller.create({
                name,
                email: normalizedEmail,
                phone,
                password: hashedPassword,
                role: 'seller'
            });

            const isOpen = calculateIsOpen(openTime, closeTime);
            await Provider.create({
                name: shopName || `${name}'s Shop`,
                seller: user._id,
                location: location || '',
                description: description || '',
                type: type || 'Canteen',
                deliveryTime: deliveryTime || '',
                img: img || '',
                openTime: openTime || '',
                closeTime: closeTime || '',
                isOpen: isOpen,
                rating: 0
            });
        } else {
            user = await Buyer.create({
                name,
                email: normalizedEmail,
                phone,
                password: hashedPassword,
                role: role || 'buyer',
                buyerType,
                cuetId,
                department,
                residence
            });
        }

        if (user) {
            return res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                ...(user.role === 'buyer' ? {
                    residence: user.residence,
                    buyerType: user.buyerType,
                    cuetId: user.cuetId,
                    department: user.department
                } : {
                    shopName: shopName,
                }),
                token: generateToken(user._id),
            });
        } else {
            return res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// POST /api/auth/login (Public)
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            console.log(`Login failed: No user found for ${normalizedEmail}`);
            return res.status(401).json({ message: 'No account found with this email. Please register or seed accounts.' });
        }

        if (user.isBlocked) {
            return res.status(403).json({ message: 'This account has been suspended by administration.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`Login failed: Incorrect password for ${normalizedEmail}`);
            return res.status(401).json({ message: 'Incorrect password. Please try again.' });
        }

        let shopName;
        if (user.role === 'seller') {
            const provider = await Provider.findOne({ seller: user._id });
            shopName = provider ? provider.name : undefined;
        }

        return res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            residence: user.residence,
            buyerType: user.buyerType,
            cuetId: user.cuetId,
            department: user.department,
            shopName,
            token: generateToken(user._id),
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// PUT /api/auth/profile (Private)
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = req.body.name || user.name;
        user.phone = req.body.phone || user.phone;

        if (user.role === 'buyer') {
            user.buyerType = req.body.buyerType || user.buyerType;
            user.cuetId = req.body.cuetId || user.cuetId;
            user.department = req.body.department || user.department;
            user.residence = req.body.residence || user.residence;
        }

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();

        if (updatedUser.role === 'seller') {
            const provider = await Provider.findOne({ seller: updatedUser._id });
            const currentOpen = req.body.openTime || (provider ? provider.openTime : '08:00');
            const currentClose = req.body.closeTime || (provider ? provider.closeTime : '20:00');
            const isOpen = calculateIsOpen(currentOpen, currentClose);

            const providerFields = {
                name: req.body.shopName,
                location: req.body.location,
                description: req.body.description,
                openTime: req.body.openTime,
                closeTime: req.body.closeTime,
                type: req.body.type,
                deliveryTime: req.body.deliveryTime,
                img: req.body.img,
                isOpen: isOpen
            };

            Object.keys(providerFields).forEach(key => providerFields[key] === undefined && delete providerFields[key]);

            await Provider.findOneAndUpdate(
                { seller: updatedUser._id },
                { $set: providerFields },
                { upsert: true, new: true }
            );
        }

        const responseData = {
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            phone: updatedUser.phone,
            token: generateToken(updatedUser._id),
        };

        if (updatedUser.role === 'buyer') {
            responseData.residence = updatedUser.residence;
            responseData.buyerType = updatedUser.buyerType;
            responseData.cuetId = updatedUser.cuetId;
            responseData.department = updatedUser.department;
        } else if (updatedUser.role === 'seller') {
            const provider = await Provider.findOne({ seller: updatedUser._id });
            if (provider) {
                responseData.shopName = provider.name;
                responseData.location = provider.location;
                responseData.description = provider.description;
                responseData.openTime = provider.openTime;
                responseData.closeTime = provider.closeTime;
                responseData.type = provider.type;
                responseData.deliveryTime = provider.deliveryTime;
                responseData.img = provider.img;
                responseData.isOpen = provider.isOpen;
            }
        }

        return res.json(responseData);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// GET /api/auth/me (Private)
const getMe = async (req, res) => {
    try {
        let user = await User.findById(req.user._id).select("-password").lean();
        if (user) {
            if (user.role === "seller") {
                const provider = await Provider.findOne({ seller: user._id }).lean();
                if (provider) {
                    user.shopName = provider.name;
                    user.location = provider.location;
                    user.description = provider.description;
                    user.openTime = provider.openTime;
                    user.closeTime = provider.closeTime;
                    user.type = provider.type;
                    user.deliveryTime = provider.deliveryTime;
                    user.img = provider.img;
                }
            }
            res.json(user);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/auth/forgot-password (Public)
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const normalizedEmail = email ? email.toLowerCase().trim() : '';
        const user = await User.findOne({ email: normalizedEmail });
        
        if (!user) {
            return res.status(404).json({ message: 'User with this email not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otpCode = otp;
        user.otpExpires = Date.now() + (5 * 60 * 1000); // 5 minutes
        await user.save();

        const mailOptions = {
            to: normalizedEmail,
            subject: 'Bitezy Password Reset',
            text: `Your password reset code is ${otp}. It will expire in 5 minutes.`,
            html: `
            <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #0f583e;">bite<span style="color: #EE5253;">zy</span></h1>
                </div>
                <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; text-align: center; margin-bottom: 30px;">
                    <p style="margin: 0; color: #4b5563; font-size: 16px; font-weight: 500;">Your Password Reset Code</p>
                    <h2 style="margin: 15px 0; color: #111827; font-size: 36px; font-weight: 800; letter-spacing: 4px;">${otp}</h2>
                    <p style="margin: 0; color: #9ca3af; font-size: 13px;">This code expires in <span style="color: #dc2626; font-weight: 600;">5 minutes</span></p>
                </div>
            </div>
            `
        };

        try {
            await sendMail(mailOptions);
        } catch (mailErr) {
            console.error('Error sending reset email:', mailErr.message || mailErr);
        }

        console.log(`Password reset OTP for ${normalizedEmail}: ${otp}`);
        return res.json({ message: 'Reset code generated.' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// POST /api/auth/reset-password (Public)
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Email, OTP, and new password are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.otpCode || !user.otpExpires || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Reset code expired or not requested' });
        }

        if (user.otpCode !== otp.toString()) {
            return res.status(400).json({ message: 'Invalid reset code' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.otpCode = undefined;
        user.otpExpires = undefined;
        await user.save();

        let shopName = undefined;
        if (user.role === 'seller') {
            const provider = await Provider.findOne({ seller: user._id });
            shopName = provider ? provider.name : undefined;
        }

        return res.json({
            message: 'Password has been successfully reset',
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            residence: user.residence,
            buyerType: user.buyerType,
            cuetId: user.cuetId,
            department: user.department,
            shopName,
            token: generateToken(user._id),
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    updateProfile,
    getMe,
    forgotPassword,
    resetPassword
};
