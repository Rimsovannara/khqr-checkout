<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'KHQR Checkout — Sang Café')</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Kantumruy+Pro:wght@400;500;600&family=Sora:wght@400;500;600;700&display=swap">
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
</head>
<body>
    <header class="topbar">
        <div class="wrap topbar-in">
            <div class="brand">
                <span class="logo">ស</span>
                <div><strong>Sang Café</strong><span class="brand-sub">សាំងកាហ្វេ · Phnom Penh · Laravel</span></div>
            </div>
            <div class="topbar-right">
                <span class="badge badge-live">ABA PAYWAY</span>
                <button id="cartBtn" class="cart-btn" aria-label="Open cart">🛒 <span id="cartCount" class="cart-count">0</span></button>
            </div>
        </div>
    </header>

    @yield('content')

    <footer class="foot">
        <div class="wrap">
            <p>Built by <a href="https://github.com/Rimsovannara">Rim Sovannara</a> · Laravel + payway-laravel · not affiliated with ABA Bank.</p>
        </div>
    </footer>
    @stack('scripts')
</body>
</html>
