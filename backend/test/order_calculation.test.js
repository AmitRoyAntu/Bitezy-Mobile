const test = require('node:test');
const assert = require('node:assert');

// Pure calculation logic extracted from orderController
function computeOrderTotals(items, orderType, discount = 0, customFee = undefined) {
    if (!items || items.length === 0) {
        throw new Error('No order items in cart');
    }

    const subtotal = items.reduce((sum, item) => {
        const price = Number(item.price) || 0;
        const qty = Number(item.qty) || 1;
        return sum + (price * qty);
    }, 0);

    const type = String(orderType || 'delivery').toLowerCase();
    const deliveryFee = customFee !== undefined ? Number(customFee) : (type === 'delivery' ? 30 : 0);
    const total = Math.max(0, subtotal - Number(discount) + deliveryFee);

    return {
        subtotal,
        deliveryFee,
        discount: Number(discount),
        total
    };
}

function resolveDeliveryAddress(orderType, userResidence, requestedAddress) {
    const type = String(orderType || 'delivery').toLowerCase();
    if (requestedAddress && requestedAddress.trim()) {
        return requestedAddress.trim();
    }
    if (type === 'delivery') {
        return userResidence || 'Campus Hall Room';
    }
    return 'Pickup at counter';
}

test('Order Calculation: computes accurate subtotal for multiple line items and quantities', () => {
    const cart = [
        { name: 'Chicken Khichuri', price: 100, qty: 2 }, // 200
        { name: 'Boiled Egg', price: 20, qty: 1 },        // 20
        { name: 'Mineral Water', price: 15, qty: 3 }       // 45
    ];

    const result = computeOrderTotals(cart, 'delivery');
    assert.strictEqual(result.subtotal, 265);
    assert.strictEqual(result.deliveryFee, 30);
    assert.strictEqual(result.total, 295);
});

test('Order Calculation: waives delivery fee for pickup / dine-in orders', () => {
    const cart = [
        { name: 'Special Beef Tehari', price: 140, qty: 1 }
    ];

    const result = computeOrderTotals(cart, 'pickup');
    assert.strictEqual(result.subtotal, 140);
    assert.strictEqual(result.deliveryFee, 0);
    assert.strictEqual(result.total, 140);
});

test('Order Calculation: deducts promotional discount accurately from grand total', () => {
    const cart = [
        { name: 'Chicken Roast Polau', price: 160, qty: 1 },
        { name: 'Borhani', price: 40, qty: 1 }
    ]; // Subtotal: 200 BDT

    const discount = 40; // 40 BDT coupon
    const result = computeOrderTotals(cart, 'delivery', discount);

    assert.strictEqual(result.subtotal, 200);
    assert.strictEqual(result.discount, 40);
    assert.strictEqual(result.deliveryFee, 30);
    assert.strictEqual(result.total, 190); // 200 - 40 + 30
});

test('Order Calculation: throws validation error when cart items array is empty', () => {
    assert.throws(() => {
        computeOrderTotals([], 'delivery');
    }, /No order items in cart/);
});

test('Order Address Binding: binds student hall room as default delivery destination', () => {
    const addr1 = resolveDeliveryAddress('delivery', 'Tareq Huda Hall, Room 314', '');
    assert.strictEqual(addr1, 'Tareq Huda Hall, Room 314');

    const addr2 = resolveDeliveryAddress('delivery', null, 'Dr. QK Hall, Room 102');
    assert.strictEqual(addr2, 'Dr. QK Hall, Room 102');

    const addr3 = resolveDeliveryAddress('pickup', 'Tareq Huda Hall, Room 314', '');
    assert.strictEqual(addr3, 'Pickup at counter');
});
