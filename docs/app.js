'use strict';

/* KHQR Checkout storefront.
 * Talks to the Node backend when one is present (/api/*). On the static GitHub
 * Pages build there is no backend, so it falls back to a clearly-labelled DEMO
 * mode: the full cart → KHQR → success flow runs client-side with no real charge.
 * The product catalog mirrors server/products.js. */

const FALLBACK_PRODUCTS = [
  { id: 'kfe-01', name: 'Iced Cambodian Coffee', khmer: 'កាហ្វេទឹកកក', price: 1.75, emoji: '🧋', tag: 'Bestseller' },
  { id: 'kfe-02', name: 'Khmer Iced Tea',        khmer: 'តែទឹកកក',      price: 1.25, emoji: '🍵', tag: '' },
  { id: 'kfe-03', name: 'Num Krok (12 pcs)',     khmer: 'នំក្រុក',       price: 2.50, emoji: '🥟', tag: '' },
  { id: 'kfe-04', name: 'Fresh Coconut',         khmer: 'ដូងខ្ចី',       price: 2.00, emoji: '🥥', tag: '' },
  { id: 'kfe-05', name: 'Mango Sticky Rice',     khmer: 'បាយដំណើបស្វាយ',  price: 3.00, emoji: '🥭', tag: 'Popular' },
  { id: 'kfe-06', name: 'Palm Sugar Cake',       khmer: 'នំត្នោត',       price: 1.50, emoji: '🍮', tag: '' },
];

const $ = (sel) => document.querySelector(sel);
const money = (n) => '$' + n.toFixed(2);

const state = {
  mode: 'demo',
  products: [],
  byId: {},
  cart: loadCart(),
  tranId: null,
};

/* ---------- init ---------- */
(async function init() {
  await detectMode();
  state.products = await loadProducts();
  state.byId = Object.fromEntries(state.products.map((p) => [p.id, p]));
  pruneCart(); // drop any stale ids left in localStorage from an older catalog
  renderMode();
  renderGrid();
  renderCart();
  drawHeroQr();
  wireEvents();
})();

async function detectMode() {
  try {
    const r = await fetch('api/config', { cache: 'no-store' });
    if (r.ok) state.mode = (await r.json()).mode || 'demo';
  } catch (_) { state.mode = 'demo'; }
}

async function loadProducts() {
  if (state.mode !== 'demo') {
    try {
      const r = await fetch('api/products');
      if (r.ok) return await r.json();
    } catch (_) { /* fall through */ }
  }
  return FALLBACK_PRODUCTS;
}

/* ---------- rendering ---------- */
function renderMode() {
  const badge = $('#modeBadge');
  if (state.mode === 'payway') {
    badge.textContent = 'LIVE · SANDBOX';
    badge.classList.remove('badge-demo');
    badge.classList.add('badge-live');
  } else {
    badge.textContent = 'DEMO MODE';
  }
}

function renderGrid() {
  $('#grid').innerHTML = state.products.map((p) => `
    <article class="card">
      <div class="card-media">${p.emoji}</div>
      <div class="card-body">
        ${p.tag ? `<span class="card-tag">${p.tag}</span>` : ''}
        <h3>${p.name}</h3>
        <span class="km">${p.khmer}</span>
        <div class="card-foot">
          <span class="price">${money(p.price)}</span>
          <button class="add-btn" data-add="${p.id}">Add +</button>
        </div>
      </div>
    </article>`).join('');
}

function renderCart() {
  const lines = Object.entries(state.cart);
  const box = $('#cartLines');
  if (!lines.length) {
    box.innerHTML = '<p class="empty">Your cart is empty.<br>Add something tasty 🧋</p>';
  } else {
    box.innerHTML = lines.map(([id, qty]) => {
      const p = state.byId[id]; if (!p) return '';
      return `<div class="cart-line">
        <div>
          <div class="nm">${p.name}</div>
          <div class="qty">
            <button class="qbtn" data-dec="${id}" aria-label="Decrease">−</button>
            <span>${qty}</span>
            <button class="qbtn" data-inc="${id}" aria-label="Increase">+</button>
          </div>
        </div>
        <div class="ln-price">${money(p.price * qty)}</div>
      </div>`;
    }).join('');
  }
  const total = cartTotal();
  $('#cartTotal').textContent = money(total);
  $('#cartCount').textContent = Object.values(state.cart).reduce((a, b) => a + b, 0);
  $('#checkoutBtn').disabled = total <= 0;
  saveCart();
}

/* ---------- cart ops ---------- */
function addToCart(id) { state.cart[id] = (state.cart[id] || 0) + 1; renderCart(); toast('Added to cart'); }
function inc(id) { state.cart[id] = (state.cart[id] || 0) + 1; renderCart(); }
function dec(id) { state.cart[id] = (state.cart[id] || 0) - 1; if (state.cart[id] <= 0) delete state.cart[id]; renderCart(); }
function cartTotal() { return Object.entries(state.cart).reduce((s, [id, q]) => s + (state.byId[id]?.price || 0) * q, 0); }
function cartArray() { return Object.entries(state.cart).map(([id, qty]) => ({ id, qty })); }

function pruneCart() {
  let changed = false;
  for (const id of Object.keys(state.cart)) {
    if (!state.byId[id] || !(state.cart[id] > 0)) { delete state.cart[id]; changed = true; }
  }
  if (changed) saveCart();
}
function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem('khqr_cart') || '{}');
    return raw && typeof raw === 'object' ? raw : {};
  } catch (_) { return {}; }
}
function saveCart() { try { localStorage.setItem('khqr_cart', JSON.stringify(state.cart)); } catch (_) {} }

/* ---------- checkout ---------- */
async function startCheckout() {
  const cust = {
    firstname: $('#fFirst').value.trim(),
    lastname: $('#fLast').value.trim(),
    email: $('#fEmail').value.trim(),
    phone: $('#fPhone').value.trim(),
  };

  if (state.mode === 'payway') {
    // Real integration: server signs the purchase, browser is posted to PayWay.
    try {
      const r = await fetch('api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart: cartArray(), customer: cust }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Checkout failed');
      postToPayWay(data.url, data.fields); // leaves the page for PayWay's hosted checkout
      return;
    } catch (err) {
      toast(err.message);
      return;
    }
  }

  // Demo mode: render a KHQR-style code client-side. No real payment.
  state.tranId = 'DEMO-' + Date.now();
  const total = cartTotal();
  showStep('qr');
  $('#qrAmount').textContent = money(total);
  $('#qrTran').textContent = state.tranId;
  renderQr('#qrBox', `DEMO-KHQR|merchant=SangCafe|tran=${state.tranId}|amount=${total.toFixed(2)}|NOT-A-REAL-PAYMENT`, 200);
}

function postToPayWay(url, fields) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = url;
  Object.entries(fields).forEach(([k, v]) => {
    const input = document.createElement('input');
    input.type = 'hidden'; input.name = k; input.value = v;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}

function completeDemoPayment() {
  showStep('done');
  $('#doneTran').textContent = state.tranId;
  $('#doneAmount').textContent = money(cartTotal());
  state.cart = {};
  renderCart();
}

/* ---------- QR helpers ---------- */
function renderQr(sel, text, size) {
  const box = $(sel);
  box.innerHTML = '';
  if (typeof QRCode === 'undefined') { box.textContent = '[QR unavailable]'; return; }
  new QRCode(box, { text, width: size, height: size, correctLevel: QRCode.CorrectLevel.M });
}
function drawHeroQr() {
  renderQr('#heroQr', 'DEMO-KHQR|SangCafe|scan-with-any-bank', 130);
}

/* ---------- modal / drawer plumbing ---------- */
function openCart() { $('#cartDrawer').hidden = false; $('#cartOverlay').hidden = false; }
function closeCart() { $('#cartDrawer').hidden = true; $('#cartOverlay').hidden = true; }
function openPay() {
  $('#paySummaryTotal').textContent = money(cartTotal());
  showStep('details');
  $('#payModal').hidden = false; $('#payOverlay').hidden = false;
}
function closePay() { $('#payModal').hidden = true; $('#payOverlay').hidden = true; }
function showStep(step) {
  $('#stepDetails').hidden = step !== 'details';
  $('#stepQr').hidden = step !== 'qr';
  $('#stepDone').hidden = step !== 'done';
}

let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 1800);
}

/* ---------- events ---------- */
function wireEvents() {
  $('#grid').addEventListener('click', (e) => {
    const id = e.target.dataset.add; if (id) addToCart(id);
  });
  $('#cartLines').addEventListener('click', (e) => {
    if (e.target.dataset.inc) inc(e.target.dataset.inc);
    if (e.target.dataset.dec) dec(e.target.dataset.dec);
  });
  $('#cartBtn').addEventListener('click', openCart);
  $('#cartClose').addEventListener('click', closeCart);
  $('#cartOverlay').addEventListener('click', closeCart);
  $('#checkoutBtn').addEventListener('click', () => { closeCart(); openPay(); });
  $('#payClose').addEventListener('click', closePay);
  $('#payOverlay').addEventListener('click', closePay);
  $('#custForm').addEventListener('submit', (e) => { e.preventDefault(); startCheckout(); });
  $('#simulatePay').addEventListener('click', completeDemoPayment);
  $('#payFinish').addEventListener('click', closePay);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeCart(); closePay(); } });

  // Returning from a real PayWay redirect: ?paid=<tran_id>
  const paid = new URLSearchParams(location.search).get('paid');
  if (paid) {
    state.tranId = paid; state.cart = {}; renderCart();
    openPay(); showStep('done');
    $('#doneTran').textContent = paid;
    $('#doneAmount').textContent = 'paid';
  }
}
