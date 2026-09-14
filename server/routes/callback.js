'use strict';

const express = require('express');
const { pw } = require('../payway');
const { orders } = require('./checkout');

const router = express.Router();

/**
 * POST /api/payway/callback
 * PayWay calls this server-to-server (the base64 `return_url`) after a payment.
 * ALWAYS verify the signature before trusting the status.
 */
router.post('/payway/callback', (req, res) => {
  const params = req.body || {};

  // The exact field order comes from YOUR PayWay onboarding document.
  const ok = pw.verifyCallback(params, params.hash, ['tran_id', 'status']);
  if (!ok) return res.status(400).end('bad signature');

  const order = orders.get(params.tran_id);
  if (order && String(params.status) === '0') {
    order.status = 'PAID';
  }

  // Respond 200 so PayWay stops retrying.
  res.status(200).end('ok');
});

module.exports = router;
