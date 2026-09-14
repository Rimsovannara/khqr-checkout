'use strict';

/**
 * Configures a single PayWayClient from environment variables.
 *
 * Credentials MUST stay on the server. Never expose API_KEY to the browser.
 * Register a free sandbox at https://sandbox.payway.com.kh/register-sandbox/
 */

const { PayWayClient } = require('payway-node');

const pw = new PayWayClient({
  merchantId: process.env.PAYWAY_MERCHANT_ID || 'ec000000',
  apiKey: process.env.PAYWAY_API_KEY || 'replace-me',
  environment: process.env.PAYWAY_ENVIRONMENT || 'sandbox', // 'sandbox' | 'production'
});

// True only when real sandbox/production credentials are present. When false the
// storefront runs in demo mode so the live GitHub Pages build still works.
const isConfigured =
  !!process.env.PAYWAY_API_KEY && process.env.PAYWAY_API_KEY !== 'replace-me';

module.exports = { pw, isConfigured };
