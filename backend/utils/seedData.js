require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Models
const { User, Buyer, Seller, Admin } = require('../models/User');
const Provider = require('../models/Provider');
const MenuItem = require('../models/MenuItem');
const Review = require('../models/Review');
const Order = require('../models/Order');
const connectDB = require('../config/db');

const loadJSON = (filename) => {
    const data = fs.readFileSync(path.join(__dirname, '../../data', `${filename}.json`), 'utf-8');
    return JSON.parse(data);
};

const seedData = async () => {
    try {
        await connectDB(process.env.MONGODB_URI || 'mongodb://localhost:27017/bitezy');
        console.log("Database connected successfully");

        // Clear existing data
        await User.deleteMany({});
        await Provider.deleteMany({});
        await MenuItem.deleteMany({});
        await Review.deleteMany({});
        await Order.deleteMany({});

        console.log('Cleared existing data.');

        // 1. Seed Users
        const usersData = loadJSON('users').users;
        const userMap = {}; // Map integer ID to MongoDB ObjectId
        
        const salt = await bcrypt.genSalt(10);
        const createdUsers = await Promise.all(usersData.map(async (u) => {
            const { id, password, ...rest } = u;
            const hashedPassword = await bcrypt.hash(password || 'demo123', salt);
            const userData = { ...rest, password: hashedPassword };

            if (userData.role === 'seller') {
                return await Seller.create(userData);
            } else if (userData.role === 'buyer') {
                return await Buyer.create(userData);
            } else if (userData.role === 'admin') {
                return await Admin.create(userData);
            } else {
                return await User.create(userData);
            }
        }));
        
        usersData.forEach((u, index) => {
            userMap[u.id] = createdUsers[index]._id;
        });
        console.log(`Seeded ${createdUsers.length} users (passwords hashed).`);

        // 2. Seed Providers
        const providersData = loadJSON('providers').providers;
        const providerMap = {};
        
        const createdProviders = await Provider.create(providersData.map(p => {
            const { id, seller, ...rest } = p;
            return {
                ...rest,
                seller: userMap[seller] || createdUsers.find(u => u.role === 'seller')?._id || new mongoose.Types.ObjectId()
            };
        }));
        
        providersData.forEach((p, index) => {
            providerMap[p.id] = createdProviders[index]._id;
        });

        // Ensure every seller created has a corresponding provider
        for (const u of usersData) {
            if (u.role === 'seller' && userMap[u.id]) {
                const sellerId = userMap[u.id];
                let existing = await Provider.findOne({ seller: sellerId });
                if (!existing && u.shopName) {
                    existing = await Provider.findOne({ name: u.shopName });
                    if (existing) {
                        existing.seller = sellerId;
                        await existing.save();
                        providerMap[u.id] = existing._id;
                    }
                }
                if (!existing) {
                    const extraProv = await Provider.create({
                        name: u.shopName || `${u.name}'s Canteen`,
                        seller: sellerId,
                        location: u.location || 'CUET Campus',
                        description: u.description || 'Fresh quality meals and snacks.',
                        type: 'Canteen',
                        deliveryTime: '15-20 min',
                        img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
                        openTime: u.openTime || '06:00',
                        closeTime: u.closeTime || '23:00',
                        isOpen: true,
                        rating: 4.8
                    });
                    providerMap[u.id] = extraProv._id;
                }
            }
        }
        console.log(`Seeded providers and linked all sellers.`);

        // 3. Seed Menu Items
        const menuData = loadJSON('menu').menu;
        const menuMap = {};
        
        const defaultProviderId = createdProviders[0]._id;
        const createdMenuItems = await MenuItem.create(menuData.map(m => {
            const { id, provider, ...rest } = m;
            return {
                ...rest,
                provider: providerMap[provider] || defaultProviderId
            };
        }));
        
        menuData.forEach((m, index) => {
            menuMap[m.id] = createdMenuItems[index]._id;
        });
        console.log(`Seeded ${createdMenuItems.length} menu items.`);

        // 4. Seed Reviews
        const reviewsData = loadJSON('reviews').reviews;
        const defaultBuyerId = createdUsers.find(u => u.role === 'buyer')?._id;
        await Review.create(reviewsData.map(r => {
            const { provider, buyer, ...rest } = r;
            return {
                ...rest,
                provider: providerMap[provider] || defaultProviderId,
                buyer: userMap[buyer] || defaultBuyerId
            };
        }));
        console.log(`Seeded ${reviewsData.length} reviews.`);

        // 5. Seed Orders
        const ordersData = loadJSON('orders').orders;
        await Order.create(ordersData.map(o => {
            const { id, customer, provider, items, ...rest } = o;
            return {
                ...rest,
                customer: userMap[customer] || defaultBuyerId,
                provider: providerMap[provider] || defaultProviderId,
                items: (items || []).map(item => ({
                    ...item,
                    menuItem: menuMap[item.menuItem] || createdMenuItems[0]._id
                }))
            };
        }));
        console.log(`Seeded ${ordersData.length} orders.`);

        // 6. Recalculate and persist provider ratings from seeded reviews
        const ratingStats = await Review.aggregate([
            {
                $group: {
                    _id: '$provider',
                    avgRating: { $avg: '$rating' }
                }
            }
        ]);

        if (ratingStats.length > 0) {
            const ratingUpdates = ratingStats.map(stat => ({
                updateOne: {
                    filter: { _id: stat._id },
                    update: { rating: Number(stat.avgRating.toFixed(1)) }
                }
            }));

            await Provider.bulkWrite(ratingUpdates);
        }
        console.log('Updated provider ratings from reviews.');

        console.log('🎉 Seeding completed successfully! All accounts and providers are live.');
        process.exit(0);
    } catch (err) {
        console.error('Error during seeding:', err);
        process.exit(1);
    }
};

seedData();
