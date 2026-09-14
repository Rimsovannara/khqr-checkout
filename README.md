# KHQR Checkout — Laravel

The Laravel version of my [KHQR Checkout](https://github.com/Rimsovannara/khqr-checkout)
demo shop, built on the [`payway-laravel`](https://github.com/Rimsovannara/payway-laravel)
package.

The main difference from the Node version: instead of redirecting to PayWay's hosted
page, this one uses `PayWay::generateQR()` to render the KHQR image directly in the page,
so the customer scans it without leaving the site.

## What's in here

These are the integration files. Drop them into a fresh Laravel 11 app
(`composer create-project laravel/laravel`) and install the package:

```bash
composer require rimsovannara/payway-laravel:dev-main
```

```
app/Http/Controllers/ShopController.php   menu, checkout, KHQR, callback
app/Support/Catalog.php                   product catalog (stands in for a DB)
routes/web.php                            routes; the PayWay callback is CSRF-exempt
resources/views/                          blade templates
public/css/app.css, public/js/shop.js    storefront assets
```

## Setup

Add your credentials to `.env` (see `.env.example`), then:

```bash
php artisan serve
```

Free sandbox: https://sandbox.payway.com.kh/register-sandbox/

## Notes

- The cart total is recomputed on the server in `ShopController::checkout()` — the
  browser's numbers aren't trusted.
- The `/payment/callback` route drops CSRF because PayWay posts to it server-to-server,
  and confirms the payment with `PayWay::checkTransaction()` rather than trusting the
  request body.

Not affiliated with ABA Bank.
