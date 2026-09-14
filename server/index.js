'use strict';

/**
 * KHQR Checkout — demo storefront backend.
 *
 *   PAYWAY_MERCHANT_ID=ec12345 PAYWAY_API_KEY=your-key npm start
 *
 * Then open http://localhost:3000. Without credentials the same frontend still
 * runs in DEMO mode (no real charges), which is what the GitHub Pages build uses.
 */

const path = require('path');
const express = require('express');
const { PRODUCTS } = require('./products');
const { isConfigured } = require('./payway');
const { router: checkoutRouter } = require('./routes/checkout');
const callbackRouter = require('./routes/callback');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // PayWay callback posts form-encoded

// Tell the frontend whether a live PayWay backend is available.
app.get('/api/config', (_req, res) => res.json({ mode: isConfigured ? 'payway' : 'demo' }));
app.get('/api/products', (_req, res) => res.json(PRODUCTS));

app.use('/api', checkoutRouter);
app.use('/api', callbackRouter);

// Serve the same static storefront that GitHub Pages serves.
app.use(express.static(path.join(__dirname, '..', 'docs')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  const mode = isConfigured ? 'PayWay sandbox/production' : 'DEMO (no credentials)';
  console.log(`KHQR Checkout running on http://localhost:${PORT}  [${mode}]`);
});
