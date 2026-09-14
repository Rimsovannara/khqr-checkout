# KHQR Checkout

A small demo shop that takes payments with **ABA PayWay** over KHQR — the QR standard
every Cambodian bank app can scan (ABA, ACLEDA, Wing, and the rest). You browse a menu,
build a cart, and pay by scanning one code.

I built it to show the full payment flow end to end, using my own
[`payway-node`](https://github.com/Rimsovannara/payway-node) SDK on the backend.

**Live demo:** https://rimsovannara.github.io/khqr-checkout/

The hosted demo has no server behind it, so it runs in a demo mode (no real charge) that
still walks through the whole flow. Point it at a real PayWay sandbox and the same
frontend does a genuine KHQR checkout — see [Running with PayWay](#running-with-payway).

## How it works

The browser never sees the API key and never sets its own price:

1. The frontend sends the cart and customer details to `POST /api/checkout`.
2. The server re-prices the cart from its own catalog, then signs the purchase with the
   `payway-node` SDK.
3. It returns the signed fields; the browser posts them to PayWay's hosted KHQR page.
4. PayWay calls back server-to-server; the server verifies the signature before marking
   the order paid.

## Running locally

Needs Node 18+.

```bash
git clone https://github.com/Rimsovannara/khqr-checkout.git
cd khqr-checkout
npm install
npm start          # http://localhost:3000, demo mode
```

## Running with PayWay

Register a free sandbox at https://sandbox.payway.com.kh/register-sandbox/, copy
`.env.example` to `.env`, and fill in your credentials:

```env
PAYWAY_MERCHANT_ID=ec12345
PAYWAY_API_KEY=your-secret-key
PAYWAY_ENVIRONMENT=sandbox
```

Run `npm start` again — checkout now redirects to the real KHQR page. Pay with ABA's
sandbox test wallet.

## Layout

```
docs/                 static storefront — also what GitHub Pages serves
  index.html
  styles.css
  app.js              cart, checkout flow, QR
server/
  index.js            Express app
  payway.js           PayWayClient from env
  products.js         catalog (stands in for a DB)
  routes/
    checkout.js       POST /api/checkout, GET /api/orders/:id
    callback.js       POST /api/payway/callback (signature-verified)
```

Orders are kept in memory to keep the demo simple — swap in a database for real use.

## Stack

Node.js + Express on the backend, plain JavaScript + CSS on the frontend (no build step),
payments through [`payway-node`](https://github.com/Rimsovannara/payway-node). There's a
Laravel version of the same shop on the [`laravel`](https://github.com/Rimsovannara/khqr-checkout/tree/laravel)
branch, built on [`payway-laravel`](https://github.com/Rimsovannara/payway-laravel).

Not affiliated with ABA Bank. A merchant account is required for live payments.
