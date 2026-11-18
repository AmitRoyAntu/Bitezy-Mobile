const test = require('node:test');
const assert = require('node:assert');

test('Models integrity: all Mongoose models compile without errors', () => {
    assert.doesNotThrow(() => {
        require('../models/User');
        require('../models/Order');
        require('../models/Provider');
        require('../models/MenuItem');
        require('../models/Coupon');
        require('../models/Review');
    });
});

test('Routes integrity: Express routers load cleanly', () => {
    assert.doesNotThrow(() => {
        require('../routes/authRoutes');
        require('../routes/providerRoutes');
        require('../routes/menuRoutes');
        require('../routes/orderRoutes');
        require('../routes/reviewRoutes');
        require('../routes/userRoutes');
        require('../routes/couponRoutes');
    });
});
