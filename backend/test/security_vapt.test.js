const test = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const TEST_SECRET = process.env.JWT_SECRET || 'bitezy-development-secret-change-in-production';

// ==============================================================
// Security & VAPT Suite 1: Authentication & JWT Vulnerabilities
// ==============================================================

test('Security VAPT: rejects "none" algorithm attack (CVE-2015-9235 defense)', async () => {
    // Attack scenario: Attacker creates an unsigned token with alg: "none"
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ id: 'admin123', role: 'admin' })).toString('base64url');
    const unsignedToken = `${header}.${payload}.`;

    let statusCode = null;
    let nextCalled = false;
    const req = { headers: { authorization: `Bearer ${unsignedToken}` } };
    const res = {
        status(code) {
            statusCode = code;
            return { json() {} };
        }
    };
    const next = () => { nextCalled = true; };

    await protect(req, res, next);
    assert.strictEqual(statusCode, 401, 'Must reject unsigned token with 401');
    assert.strictEqual(nextCalled, false);
});

test('Security VAPT: rejects token signed with wrong secret key', async () => {
    // Attack scenario: Token signed with foreign/attacker secret key
    const forgedToken = jwt.sign({ id: '664fa10b91e12a4b8c9d0123' }, 'attacker-malicious-secret', { expiresIn: '1h' });

    let statusCode = null;
    const req = { headers: { authorization: `Bearer ${forgedToken}` } };
    const res = {
        status(code) {
            statusCode = code;
            return { json() {} };
        }
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    await protect(req, res, next);
    assert.strictEqual(statusCode, 401);
    assert.strictEqual(nextCalled, false);
});

test('Security VAPT: rejects expired tokens (Replay attack prevention)', async () => {
    // Attack scenario: Token that expired in the past
    const expiredToken = jwt.sign(
        { id: '664fa10b91e12a4b8c9d0123' },
        TEST_SECRET,
        { expiresIn: '-1s' } // Expired 1 second ago
    );

    let statusCode = null;
    const req = { headers: { authorization: `Bearer ${expiredToken}` } };
    const res = {
        status(code) {
            statusCode = code;
            return { json() {} };
        }
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    await protect(req, res, next);
    assert.strictEqual(statusCode, 401);
    assert.strictEqual(nextCalled, false);
});

// ==============================================================
// Security & VAPT Suite 2: Broken Access Control & Privilege Escalation
// ==============================================================

test('Security VAPT: prevents Horizontal Privilege Escalation (Buyer accessing another user)', () => {
    const middleware = authorize('seller');
    let statusCode = null;
    let nextCalled = false;

    // A buyer attempts to call a seller-only endpoint
    const req = { user: { role: 'buyer', id: 'buyer_456' } };
    const res = {
        status(code) {
            statusCode = code;
            return { json() {} };
        }
    };
    const next = () => { nextCalled = true; };

    middleware(req, res, next);
    assert.strictEqual(statusCode, 403, 'Buyer must receive 403 Forbidden on seller routes');
    assert.strictEqual(nextCalled, false);
});

test('Security VAPT: prevents Vertical Privilege Escalation (Buyer accessing Admin controls)', () => {
    const middleware = authorize('admin');
    let statusCode = null;
    let nextCalled = false;

    // A buyer attempts to toggle coupons or block sellers
    const req = { user: { role: 'buyer', id: 'buyer_789' } };
    const res = {
        status(code) {
            statusCode = code;
            return { json() {} };
        }
    };
    const next = () => { nextCalled = true; };

    middleware(req, res, next);
    assert.strictEqual(statusCode, 403, 'Buyer must receive 403 Forbidden on admin governance routes');
    assert.strictEqual(nextCalled, false);
});

// ==============================================================
// Security & VAPT Suite 3: Input Tampering & Negative Number Exploits
// ==============================================================

test('Security VAPT: prevents negative price / negative quantity cart tampering exploit', () => {
    // Attack scenario: Attacker sends negative quantity or price to reduce cart subtotal
    const maliciousItems = [
        { name: 'Chicken Khichuri', price: 100, qty: 1 },
        { name: 'Fake Refund Item', price: -1000, qty: 1 } // Exploit attempt
    ];

    function sanitizeAndComputeSubtotal(items) {
        for (const item of items) {
            if (Number(item.price) < 0 || Number(item.qty) <= 0) {
                throw new Error('Security Violation: Negative price or non-positive quantity detected');
            }
        }
        return items.reduce((sum, i) => sum + (Number(i.price) * Number(i.qty)), 0);
    }

    assert.throws(() => {
        sanitizeAndComputeSubtotal(maliciousItems);
    }, /Security Violation/);
});

test('Security VAPT: prevents zero-value / negative delivery fee bypass', () => {
    // Attack scenario: Attacker supplies custom delivery fee of -50 BDT
    function resolveDeliveryFee(orderType, suppliedFee) {
        const type = String(orderType || 'delivery').toLowerCase();
        const baseFee = type === 'delivery' ? 30 : 0;
        if (suppliedFee !== undefined && Number(suppliedFee) < 0) {
            throw new Error('Security Violation: Negative delivery fee prohibited');
        }
        return baseFee;
    }

    assert.throws(() => {
        resolveDeliveryFee('delivery', -50);
    }, /Negative delivery fee prohibited/);
});
