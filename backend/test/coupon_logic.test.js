const test = require('node:test');
const assert = require('node:assert');

// Core coupon business logic extracted from couponController
function evaluateCoupon(coupon, subtotal, orderType = 'delivery') {
    if (!coupon || !coupon.isActive) {
        return { valid: false, error: 'Invalid or inactive coupon code' };
    }

    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
        return { valid: false, error: 'This coupon code has expired' };
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return { valid: false, error: 'This coupon has reached its maximum usage limit' };
    }

    const cartSubtotal = Number(subtotal) || 0;
    if (coupon.minOrderAmount && cartSubtotal < coupon.minOrderAmount) {
        return {
            valid: false,
            error: `Minimum order of ৳${coupon.minOrderAmount} required`
        };
    }

    let discountAmount = 0;
    const isDelivery = String(orderType || 'delivery').toLowerCase() === 'delivery';

    if (coupon.discountType === 'percent') {
        discountAmount = Math.round((cartSubtotal * coupon.discountValue) / 100);
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
        }
    } else if (coupon.discountType === 'flat') {
        discountAmount = Math.min(cartSubtotal, coupon.discountValue);
    } else if (coupon.discountType === 'delivery') {
        discountAmount = isDelivery ? (coupon.discountValue || 30) : 0;
    }

    return {
        valid: true,
        discountAmount,
        finalPayable: Math.max(0, cartSubtotal - discountAmount)
    };
}

test('Coupon Logic: calculates percentage discount accurately', () => {
    const coupon = {
        code: 'CAMPUS20',
        isActive: true,
        discountType: 'percent',
        discountValue: 20, // 20%
        minOrderAmount: 100
    };

    const res = evaluateCoupon(coupon, 250);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.discountAmount, 50); // 20% of 250 = 50
    assert.strictEqual(res.finalPayable, 200);
});

test('Coupon Logic: enforces maximum discount cap for percentage vouchers', () => {
    const coupon = {
        code: 'HALFPRICE',
        isActive: true,
        discountType: 'percent',
        discountValue: 50, // 50%
        maxDiscount: 60,   // Capped at 60 BDT
        minOrderAmount: 100
    };

    const res = evaluateCoupon(coupon, 300); // 50% would be 150 BDT, but capped at 60
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.discountAmount, 60);
    assert.strictEqual(res.finalPayable, 240);
});

test('Coupon Logic: computes flat discount without exceeding cart subtotal', () => {
    const coupon = {
        code: 'FLAT30',
        isActive: true,
        discountType: 'flat',
        discountValue: 30,
        minOrderAmount: 50
    };

    const res = evaluateCoupon(coupon, 120);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.discountAmount, 30);
    assert.strictEqual(res.finalPayable, 90);
});

test('Coupon Logic: rejects vouchers when cart subtotal is below minimum order amount', () => {
    const coupon = {
        code: 'FESTIVE100',
        isActive: true,
        discountType: 'flat',
        discountValue: 20,
        minOrderAmount: 150
    };

    const res = evaluateCoupon(coupon, 100); // 100 < 150
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /Minimum order of ৳150 required/);
});

test('Coupon Logic: rejects expired vouchers', () => {
    const coupon = {
        code: 'EXPIRED10',
        isActive: true,
        discountType: 'percent',
        discountValue: 10,
        expiresAt: new Date('2024-01-01') // Past date
    };

    const res = evaluateCoupon(coupon, 200);
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /has expired/i);
});

test('Coupon Logic: rejects vouchers that exceeded their usage limit', () => {
    const coupon = {
        code: 'LIMITED5',
        isActive: true,
        discountType: 'flat',
        discountValue: 15,
        usageLimit: 5,
        usedCount: 5 // Exhausted
    };

    const res = evaluateCoupon(coupon, 150);
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /maximum usage limit/i);
});
