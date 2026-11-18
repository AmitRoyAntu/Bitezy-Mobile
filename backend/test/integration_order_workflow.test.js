const test = require('node:test');
const assert = require('node:assert');

// Deterministic Order Lifecycle State Machine Engine
class OrderWorkflowEngine {
    constructor(orderId, initialStatus = 'PENDING') {
        this.orderId = orderId;
        this.status = initialStatus;
        this.history = [initialStatus];
    }

    advanceStatus(newStatus, actorRole) {
        const allowedTransitions = {
            'PENDING': ['ACCEPTED', 'CANCELLED'],
            'ACCEPTED': ['PREPARING', 'CANCELLED'],
            'PREPARING': ['READY'],
            'READY': ['DELIVERED'],
            'DELIVERED': [],
            'CANCELLED': []
        };

        const target = newStatus.toUpperCase();

        // Cancellation rules
        if (target === 'CANCELLED') {
            if (!['PENDING', 'ACCEPTED'].includes(this.status)) {
                throw new Error(`Invalid transition: Order in '${this.status}' cannot be cancelled`);
            }
        } else {
            // Forward progression rules: only seller or admin can advance kitchen state
            if (!['seller', 'admin'].includes(actorRole)) {
                throw new Error(`Unauthorized transition: Role '${actorRole}' cannot advance order state to '${target}'`);
            }
        }

        if (!allowedTransitions[this.status].includes(target)) {
            throw new Error(`Illegal state transition from '${this.status}' to '${target}'`);
        }

        this.status = target;
        this.history.push(target);
        return this.status;
    }
}

test('Integration Workflow: successful happy path progression from PENDING to DELIVERED', () => {
    const order = new OrderWorkflowEngine('ORD-2026-001', 'PENDING');

    // 1. Seller accepts counter ticket
    order.advanceStatus('ACCEPTED', 'seller');
    assert.strictEqual(order.status, 'ACCEPTED');

    // 2. Kitchen begins preparation
    order.advanceStatus('PREPARING', 'seller');
    assert.strictEqual(order.status, 'PREPARING');

    // 3. Food is packed and ready
    order.advanceStatus('READY', 'seller');
    assert.strictEqual(order.status, 'READY');

    // 4. Student receives delivery at hall room
    order.advanceStatus('DELIVERED', 'seller');
    assert.strictEqual(order.status, 'DELIVERED');

    assert.deepStrictEqual(order.history, ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'DELIVERED']);
});

test('Integration Workflow: customer cancels pending order before kitchen preparation', () => {
    const order = new OrderWorkflowEngine('ORD-2026-002', 'PENDING');
    order.advanceStatus('CANCELLED', 'buyer');
    assert.strictEqual(order.status, 'CANCELLED');
});

test('Integration Workflow: blocks cancellation once food preparation commences', () => {
    const order = new OrderWorkflowEngine('ORD-2026-003', 'PENDING');
    order.advanceStatus('ACCEPTED', 'seller');
    order.advanceStatus('PREPARING', 'seller');

    // Customer attempts to cancel after cooking started
    assert.throws(() => {
        order.advanceStatus('CANCELLED', 'buyer');
    }, /cannot be cancelled/);
});

test('Integration Workflow: prevents state rollback (DELIVERED cannot revert to PENDING)', () => {
    const order = new OrderWorkflowEngine('ORD-2026-004', 'DELIVERED');

    assert.throws(() => {
        order.advanceStatus('PENDING', 'seller');
    }, /Illegal state transition/);
});

test('Integration Workflow: prevents unauthorized buyer from marking order as DELIVERED', () => {
    const order = new OrderWorkflowEngine('ORD-2026-005', 'READY');

    assert.throws(() => {
        order.advanceStatus('DELIVERED', 'buyer'); // Buyer cannot mark complete themselves
    }, /Unauthorized transition/);
});

test('Integration Workflow: enforces single-canteen cart isolation to prevent delivery collisions', () => {
    let cart = [];

    function addItemToCart(currentCart, item) {
        if (currentCart.length > 0 && currentCart[0].providerId !== item.providerId) {
            // Auto-reset cart on cross-canteen conflict
            currentCart = [];
        }
        currentCart.push(item);
        return currentCart;
    }

    // Add dish from Central Canteen
    cart = addItemToCart(cart, { id: 'd1', name: 'Chicken Khichuri', providerId: 'canteen_central' });
    assert.strictEqual(cart.length, 1);
    assert.strictEqual(cart[0].providerId, 'canteen_central');

    // Add second dish from Central Canteen
    cart = addItemToCart(cart, { id: 'd2', name: 'Egg Curry', providerId: 'canteen_central' });
    assert.strictEqual(cart.length, 2);

    // Attempt adding dish from Teachers Cafe -> triggers single-canteen reset
    cart = addItemToCart(cart, { id: 'd3', name: 'Coffee', providerId: 'teachers_cafe' });
    assert.strictEqual(cart.length, 1);
    assert.strictEqual(cart[0].providerId, 'teachers_cafe');
});
