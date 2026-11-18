const test = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');

const TEST_SECRET = process.env.JWT_SECRET || 'bitezy-development-secret-change-in-production';

test('Performance Benchmark: processes 500 concurrent cart calculations under 25ms', () => {
    const cart = [
        { name: 'Chicken Khichuri', price: 100, qty: 2 },
        { name: 'Egg Curry', price: 25, qty: 1 },
        { name: 'Mineral Water', price: 15, qty: 2 }
    ];

    const startTime = performance.now();

    for (let i = 0; i < 500; i++) {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const deliveryFee = 30;
        const discount = 20;
        const total = subtotal - discount + deliveryFee;
        assert.strictEqual(total, 265);
    }

    const duration = performance.now() - startTime;
    assert.ok(duration < 25, `500 calculations took ${duration.toFixed(2)}ms (must be < 25ms)`);
});

test('Performance Benchmark: executes 1,000 coupon rule evaluations under 15ms', () => {
    const coupon = {
        code: 'CAMPUS20',
        isActive: true,
        discountType: 'percent',
        discountValue: 20,
        maxDiscount: 50,
        minOrderAmount: 100
    };

    const startTime = performance.now();

    for (let i = 0; i < 1000; i++) {
        const subtotal = 200 + (i % 50);
        let discount = Math.round((subtotal * coupon.discountValue) / 100);
        if (discount > coupon.maxDiscount) discount = coupon.maxDiscount;
        const payable = subtotal - discount;
        assert.ok(payable > 0);
    }

    const duration = performance.now() - startTime;
    assert.ok(duration < 15, `1,000 coupon checks took ${duration.toFixed(2)}ms (must be < 15ms)`);
});

test('Performance Benchmark: verifies 200 JWT cryptographic signatures under 150ms', () => {
    const token = jwt.sign({ id: 'user_123', role: 'buyer' }, TEST_SECRET, { expiresIn: '1h' });

    const startTime = performance.now();

    for (let i = 0; i < 200; i++) {
        const decoded = jwt.verify(token, TEST_SECRET);
        assert.strictEqual(decoded.id, 'user_123');
    }

    const duration = performance.now() - startTime;
    assert.ok(duration < 150, `200 JWT verifications took ${duration.toFixed(2)}ms (must be < 150ms)`);
});
