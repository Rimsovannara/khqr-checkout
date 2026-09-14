# 🧋 KHQR Checkout — Laravel edition

The same Sang Café storefront as the [`main`](https://github.com/Rimsovannara/khqr-checkout)
branch, implemented in **Laravel** using the
[`payway-laravel`](https://github.com/Rimsovannara/payway-laravel) package.

Unlike the Node version (which redirects to PayWay's hosted page), this edition uses
`PayWay::generateQR()` to render the **KHQR image directly in the page** — the customer
scans it without leaving the site.

## What's here

These are the integration files that make the store work. Drop them into a fresh Laravel
11 app (`composer create-project laravel/laravel`), then:

```
app/Http/Controllers/ShopController.php   # menu, checkout (server-side pricing), KHQR, callback
app/Support/Catalog.php                   # product catalog (DB stand-in)
routes/web.php                            # routes incl. CSRF-exempt PayWay callback
resources/views/layout.blade.php          # shared layout
resources/views/shop/index.blade.php      # storefront + cart drawer
resources/views/shop/qr.blade.php         # KHQR display
resources/views/shop/success.blade.php    # confirmation
public/css/app.css, public/js/shop.js     # storefront assets
```

## Setup

```bash
composer require rimsovannara/payway-laravel:dev-main
```

Add credentials to `.env` (see `.env.example`), then:

```bash
php artisan serve
```

Register a free sandbox at <https://sandbox.payway.com.kh/register-sandbox/>.

## Key points a reviewer will notice

- **Server-side pricing** — `ShopController::checkout()` recomputes the total from
  `Catalog`; the client's numbers are never trusted.
- **Validated input** — `$request->validate()` guards the cart and customer fields.
- **CSRF-exempt callback** — PayWay posts server-to-server, so `/payment/callback` drops
  the CSRF middleware and confirms the payment via `PayWay::checkTransaction()` instead
  of trusting the request body.
- **Enums & facade** — uses the package's `PayWay` facade per its documented API.

---

Built by [Rim Sovannara](https://github.com/Rimsovannara) — full-stack developer, Cambodia 🇰🇭
