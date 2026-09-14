'use strict';

const express = require('express');
const { pw, isConfigured } = require('../payway');
const { byId } = require('../products');

const router = express.Router();

// In-memory order store. Swap for a real database in production.
const orders = new Map();

/** Recalculate the total on the SERVER from trusted prices — never trust the client's amount. */
function priceCart(cart) {
  let amount = 0;
  const items = [];
  for (const line of cart) {
    const product = byId[line.id];
    if (!product) continue;
    const qty = Math.max(1, Math.min(99, parseInt(line.qty, 10) || 1));
    amount += product.price * qty;
    items.push({ name: product.name, quantity: qty, price: product.price });
  }
  return { amount: Math.round(amount * 100) / 100, items };
}

/**
 * POST /api/checkout
 * Body: { cart: [{ id, qty }], customer: { firstname, lastname, email, phone } }
 * Returns the signed PayWay purchase so the frontend can open KHQR / ABA Pay.
 */
router.post('/checkout', (req, res) => {
  const { cart = [], customer = {} } = req.body || {};
  const { amount, items } = priceCart(cart);

  if (amount <= 0) return res.status(400).json({ error: 'Cart is empty.' });

  const tran_id = 'KHQR-' + Date.now();
  const order = { tran_id, amount, items, status: 'PENDING', createdAt: Date.now() };
  orders.set(tran_id, order);

  const base = `${req.protocol}://${req.get('host')}`;
  const purchase = {
    tran_id,
    amount,
    currency: 'USD',
    payment_option: 'abapay_khqr', // KHQR first; empty string shows every method
    items: Buffer.from(JSON.stringify(items)).toString('base64'),
    firstname: customer.firstname || 'Guest',
    lastname: customer.lastname || 'Customer',
    email: customer.email || 'guest@example.com',
    phone: customer.phone || '',
    return_url: Buffer.from(`${base}/api/payway/callback`).toString('base64'),
    continue_success_url: `${base}/?paid=${tran_id}`,
    cancel_url: `${base}/?cancelled=${tran_id}`,
  };

  // buildPurchase returns { url, fields, hash } — the frontend can POST `fields`
  // to `url`, or we can hand back a ready-to-submit form via buildPurchaseFormHtml.
  const { url, fields } = pw.buildPurchase(purchase);
  res.json({ mode: 'payway', tran_id, amount, url, fields });
});

/**
 * GET /api/orders/:id
 * Confirms payment server-to-server via PayWay's Check Transaction API.
 */
router.get('/orders/:id', async (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Unknown order.' });

  if (isConfigured) {
    try {
      const result = await pw.checkTransaction(order.tran_id);
      if (result?.data?.status === 0 || result?.data?.payment_status === 'APPROVED') {
        order.status = 'PAID';
      }
    } catch (err) {
      // Leave status as-is; the client can retry.
    }
  }
  res.json({ tran_id: order.tran_id, amount: order.amount, status: order.status });
});

module.exports = { router, orders };
