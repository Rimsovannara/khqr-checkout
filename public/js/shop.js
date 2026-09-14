'use strict';

/* Cart for the Laravel storefront. On checkout it serialises the cart into a
 * hidden field and submits a normal form POST to /checkout (Laravel returns the
 * KHQR page). Prices are re-validated server-side in ShopController. */

const $ = (s) => document.querySelector(s);
const money = (n) => '$' + n.toFixed(2);

const meta = {}; // id -> { name, price }
let cart = loadCart();

document.querySelectorAll('[data-add]').forEach((btn) => {
  meta[btn.dataset.add] = { name: btn.dataset.name, price: parseFloat(btn.dataset.price) };
  btn.addEventListener('click', () => { add(btn.dataset.add); });
});

function add(id) { cart[id] = (cart[id] || 0) + 1; render(); toast('Added to cart'); }
function inc(id) { cart[id] = (cart[id] || 0) + 1; render(); }
function dec(id) { cart[id] = (cart[id] || 0) - 1; if (cart[id] <= 0) delete cart[id]; render(); }
function total() { return Object.entries(cart).reduce((s, [id, q]) => s + (meta[id]?.price || 0) * q, 0); }

function render() {
  const lines = Object.entries(cart);
  const box = $('#cartLines');
  box.innerHTML = lines.length ? lines.map(([id, qty]) => `
    <div class="cart-line">
      <div><div class="nm">${meta[id]?.name || id}</div>
        <div class="qty"><button class="qbtn" data-dec="${id}">−</button><span>${qty}</span><button class="qbtn" data-inc="${id}">+</button></div>
      </div>
      <div class="ln-price">${money((meta[id]?.price || 0) * qty)}</div>
    </div>`).join('') : '<p class="empty">Your cart is empty.<br>Add something tasty 🧋</p>';
  $('#cartTotal').textContent = money(total());
  $('#cartCount').textContent = Object.values(cart).reduce((a, b) => a + b, 0);
  $('#checkoutBtn').disabled = total() <= 0;
  $('#cartJson').value = JSON.stringify(Object.entries(cart).map(([id, qty]) => ({ id, qty })));
  saveCart();
}

$('#cartLines').addEventListener('click', (e) => {
  if (e.target.dataset.inc) inc(e.target.dataset.inc);
  if (e.target.dataset.dec) dec(e.target.dataset.dec);
});
$('#cartBtn').addEventListener('click', () => { $('#cartDrawer').hidden = false; $('#cartOverlay').hidden = false; });
$('#cartClose').addEventListener('click', closeCart);
$('#cartOverlay').addEventListener('click', closeCart);
function closeCart() { $('#cartDrawer').hidden = true; $('#cartOverlay').hidden = true; }

// The server expects cart[] items; expand cart_json into cart[i][id]/cart[i][qty] on submit.
$('#checkoutForm').addEventListener('submit', (e) => {
  const items = JSON.parse($('#cartJson').value || '[]');
  items.forEach((it, i) => {
    ['id', 'qty'].forEach((k) => {
      const input = document.createElement('input');
      input.type = 'hidden'; input.name = `cart[${i}][${k}]`; input.value = it[k];
      e.target.appendChild(input);
    });
  });
});

let toastTimer;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 1600); }

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem('khqr_cart_l') || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch (_) { return {}; }
}
function saveCart() { try { localStorage.setItem('khqr_cart_l', JSON.stringify(cart)); } catch (_) {} }

// Drop any stale ids not on the current page before first render.
Object.keys(cart).forEach((id) => { if (!meta[id] || !(cart[id] > 0)) delete cart[id]; });
render();
