const test = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/authMiddleware');
const { User } = require('../models/User');

const TEST_SECRET = process.env.JWT_SECRET || 'bitezy-development-secret-change-in-production';

test('Auth Middleware: rejects requests with no Authorization header (401)', async () => {
    let statusCode = null;
    let jsonResponse = null;
    let nextCalled = false;

    const req = { headers: {} };
    const res = {
        status(code) {
            statusCode = code;
            return {
                json(data) { jsonResponse = data; }
            };
        }
    };
    const next = () => { nextCalled = true; };

    await protect(req, res, next);
    assert.strictEqual(statusCode, 401);
    assert.strictEqual(nextCalled, false);
    assert.match(jsonResponse.message, /no token provided/i);
});

test('Auth Middleware: rejects mock tokens (401)', async () => {
    let statusCode = null;
    let jsonResponse = null;
    let nextCalled = false;

    const req = {
        headers: { authorization: 'Bearer mock_token_buyer_12345' }
    };
    const res = {
        status(code) {
            statusCode = code;
            return {
                json(data) { jsonResponse = data; }
            };
        }
    };
    const next = () => { nextCalled = true; };

    await protect(req, res, next);
    assert.strictEqual(statusCode, 401);
    assert.strictEqual(nextCalled, false);
    assert.match(jsonResponse.message, /mock token/i);
});

test('Auth Middleware: rejects malformed or tampered JWT tokens (401)', async () => {
    let statusCode = null;
    let jsonResponse = null;
    let nextCalled = false;

    const req = {
        headers: { authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature' }
    };
    const res = {
        status(code) {
            statusCode = code;
            return {
                json(data) { jsonResponse = data; }
            };
        }
    };
    const next = () => { nextCalled = true; };

    await protect(req, res, next);
    assert.strictEqual(statusCode, 401);
    assert.strictEqual(nextCalled, false);
    assert.match(jsonResponse.message, /invalid or expired/i);
});

test('Auth Middleware: successfully authenticates valid JWT and attaches user to request', async () => {
    const mockUserId = '664fa10b91e12a4b8c9d0123';
    const validToken = jwt.sign({ id: mockUserId }, TEST_SECRET, { expiresIn: '1h' });

    // Mock User.findById
    const originalFindById = User.findById;
    User.findById = (id) => ({
        select: async () => ({
            _id: id,
            name: 'Amit Roy',
            email: 'student@cuet.ac.bd',
            role: 'buyer',
            residence: 'Tareq Huda Hall, Room 314'
        })
    });

    let nextCalled = false;
    const req = {
        headers: { authorization: `Bearer ${validToken}` }
    };
    const res = {
        status(code) {
            return { json() {} };
        }
    };
    const next = () => { nextCalled = true; };

    try {
        await protect(req, res, next);
        assert.strictEqual(nextCalled, true);
        assert.ok(req.user);
        assert.strictEqual(req.user.name, 'Amit Roy');
        assert.strictEqual(req.user.role, 'buyer');
    } finally {
        // Restore original method
        User.findById = originalFindById;
    }
});
