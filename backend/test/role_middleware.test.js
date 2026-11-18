const test = require('node:test');
const assert = require('node:assert');
const { authorize } = require('../middleware/roleMiddleware');

test('Role Middleware: rejects requests with no user object (403 Forbidden)', () => {
    const middleware = authorize('seller');
    let statusCode = null;
    let jsonResponse = null;
    let nextCalled = false;

    const req = {};
    const res = {
        status(code) {
            statusCode = code;
            return {
                json(data) {
                    jsonResponse = data;
                }
            };
        }
    };
    const next = () => { nextCalled = true; };

    middleware(req, res, next);
    assert.strictEqual(statusCode, 403);
    assert.strictEqual(nextCalled, false);
    assert.match(jsonResponse.message, /not authorized/i);
});

test('Role Middleware: rejects requests with unauthorized role (e.g. buyer accessing admin)', () => {
    const middleware = authorize('admin');
    let statusCode = null;
    let nextCalled = false;

    const req = { user: { role: 'buyer', name: 'Student User' } };
    const res = {
        status(code) {
            statusCode = code;
            return { json() {} };
        }
    };
    const next = () => { nextCalled = true; };

    middleware(req, res, next);
    assert.strictEqual(statusCode, 403);
    assert.strictEqual(nextCalled, false);
});

test('Role Middleware: allows requests with matching authorized role', () => {
    const middleware = authorize('seller');
    let nextCalled = false;

    const req = { user: { role: 'seller', shopName: 'Central Canteen' } };
    const res = {
        status() { return { json() {} }; }
    };
    const next = () => { nextCalled = true; };

    middleware(req, res, next);
    assert.strictEqual(nextCalled, true);
});

test('Role Middleware: supports multi-role authorization (seller or admin)', () => {
    const middleware = authorize('seller', 'admin');
    let nextCalls = 0;

    const res = { status() { return { json() {} }; } };
    const next = () => { nextCalls++; };

    middleware({ user: { role: 'seller' } }, res, next);
    middleware({ user: { role: 'admin' } }, res, next);

    assert.strictEqual(nextCalls, 2);
});
