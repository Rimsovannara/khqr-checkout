@extends('layout')

@section('content')
<section class="hero">
    <div class="wrap hero-in">
        <div class="hero-copy">
            <p class="eyebrow">Full-stack demo · Laravel + ABA PayWay</p>
            <h1>Order coffee &amp; snacks, pay by <span class="accent">KHQR</span>.</h1>
            <p class="lede">Scan once with any Cambodian banking app. Server-side checkout wired to the
                <a href="https://github.com/Rimsovannara/payway-laravel">payway-laravel</a> package.</p>
            <a href="#menu" class="btn btn-primary">Browse the menu</a>
        </div>
        <div class="hero-card" aria-hidden="true">
            <div class="qr-mini"><div class="khqr-tag">KHQR</div></div>
            <p class="hero-card-note">One QR · every bank</p>
        </div>
    </div>
</section>

<main class="wrap">
    <section id="menu" class="menu-head">
        <h2>Menu · ម៉ឺនុយ</h2>
        <p class="muted">Prices in USD. Tap to add to your cart.</p>
    </section>
    <section id="grid" class="grid">
        @foreach ($products as $p)
        <article class="card">
            <div class="card-media">{{ $p['emoji'] }}</div>
            <div class="card-body">
                @if ($p['tag'])<span class="card-tag">{{ $p['tag'] }}</span>@endif
                <h3>{{ $p['name'] }}</h3>
                <span class="km">{{ $p['khmer'] }}</span>
                <div class="card-foot">
                    <span class="price">${{ number_format($p['price'], 2) }}</span>
                    <button class="add-btn" data-add="{{ $p['id'] }}" data-price="{{ $p['price'] }}" data-name="{{ $p['name'] }}">Add +</button>
                </div>
            </div>
        </article>
        @endforeach
    </section>
</main>

<div id="cartOverlay" class="overlay" hidden></div>
<aside id="cartDrawer" class="drawer" hidden aria-label="Shopping cart">
    <div class="drawer-head"><h3>Your cart</h3><button id="cartClose" class="icon-btn" aria-label="Close cart">✕</button></div>
    <div id="cartLines" class="cart-lines"></div>
    <div class="drawer-foot">
        <form id="checkoutForm" method="POST" action="{{ route('checkout') }}">
            @csrf
            <div class="cust-form" style="margin-bottom:12px">
                <div class="field-row">
                    <label>First name<input name="customer[firstname]" value="Sok" required></label>
                    <label>Last name<input name="customer[lastname]" value="Dara" required></label>
                </div>
                <label>Email<input name="customer[email]" type="email" value="sok@example.com" required></label>
            </div>
            <input type="hidden" name="cart_json" id="cartJson" value="[]">
            <div class="total-row"><span>Total</span><strong id="cartTotal">$0.00</strong></div>
            <button type="submit" id="checkoutBtn" class="btn btn-primary btn-block" disabled style="margin-top:12px">Pay with KHQR</button>
        </form>
    </div>
</aside>

<div id="toast" class="toast" hidden></div>
@endsection

@push('scripts')
<script src="{{ asset('js/shop.js') }}"></script>
@endpush
