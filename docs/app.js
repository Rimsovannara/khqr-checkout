'use strict';

/* KHQR Checkout storefront.
 * Uses the Node backend (/api/*) when present; on the static GitHub Pages build
 * it falls back to a clearly-labelled DEMO mode where the whole cart → KHQR →
 * success flow runs client-side with no real charge. Catalog mirrors
 * server/products.js. */

const FALLBACK_PRODUCTS = [
  { id: 'kfe-01', name: 'Iced Cambodian Coffee', khmer: 'កាហ្វេទឹកកក', price: 1.75, emoji: '🧋', tag: 'Bestseller' },
  { id: 'kfe-02', name: 'Khmer Iced Tea',        khmer: 'តែទឹកកក',      price: 1.25, emoji: '🍵', tag: '' },
  { id: 'kfe-03', name: 'Num Krok (12 pcs)',     khmer: 'នំក្រុក',       price: 2.50, emoji: '🥟', tag: '' },
  { id: 'kfe-04', name: 'Fresh Coconut',         khmer: 'ដូងខ្ចី',       price: 2.00, emoji: '🥥', tag: '' },
  { id: 'kfe-05', name: 'Mango Sticky Rice',     khmer: 'បាយដំណើបស្វាយ',  price: 3.00, emoji: '🥭', tag: 'Popular' },
  { id: 'kfe-06', name: 'Palm Sugar Cake',       khmer: 'នំត្នោត',       price: 1.50, emoji: '🍮', tag: '' },
];

const $ = (s) => document.querySelector(s);
const money = (n) => '$' + n.toFixed(2);

const state = { mode: 'demo', products: [], byId: {}, cart: loadCart(), tranId: null };

/* ---------- init ---------- */
(async function init() {
  await detectMode();
  state.products = await loadProducts();
  state.byId = Object.fromEntries(state.products.map((p) => [p.id, p]));
  pruneCart();
  renderMode();
  renderGrid();
  renderCart();
  updateBar();
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
    try { const r = await fetch('api/products'); if (r.ok) return await r.json(); } catch (_) {}
  }
  return FALLBACK_PRODUCTS;
}

/* ---------- rendering ---------- */
function renderMode() {
  const b = $('#modeBadge');
  if (state.mode === 'payway') { b.textContent = 'Live · Sandbox'; b.className = 'badge live'; }
  else { b.textContent = 'Demo'; b.className = 'badge'; }
}

function renderGrid() {
  $('#grid').innerHTML = state.products.map((p) => `
    <article class="card" id="card-${p.id}" data-id="${p.id}">
      <div class="card-media">${p.emoji}</div>
      <div class="card-body">
        ${p.tag ? `<span class="card-tag">${p.tag}</span>` : ''}
        <h3>${p.name}</h3>
        <span class="km">${p.khmer}</span>
        <div class="card-foot">
          <span class="price">${money(p.price)}</span>
          <span class="card-action">${controlHtml(p.id)}</span>
        </div>
      </div>
    </article>`).join('');
}

/** Add button when qty is 0, an inline stepper when in the cart. */
function controlHtml(id) {
  const qty = state.cart[id] || 0;
  if (qty <= 0) return `<button class="add-btn" data-add="${id}">Add</button>`;
  return `<span class="stepper">
      <button data-dec="${id}" aria-label="Remove one">−</button>
      <span class="n" aria-live="polite">${qty}</span>
      <button data-inc="${id}" aria-label="Add one">+</button>
    </span>`;
}

/** Re-render only one card's control instead of the whole grid. */
function refreshCard(id) {
  const card = $(`#card-${id}`);
  if (!card) return;
  card.querySelector('.card-action').innerHTML = controlHtml(id);
  card.classList.toggle('in-cart', (state.cart[id] || 0) > 0);
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
          <div class="km">${p.khmer}</div>
          <div class="mini-step">
            <button data-dec="${id}" aria-label="Remove one">−</button>
            <span class="n">${qty}</span>
            <button data-inc="${id}" aria-label="Add one">+</button>
          </div>
        </div>
        <div class="ln-price">${money(p.price * qty)}</div>
      </div>`;
    }).join('');
  }
  $('#cartTotal').textContent = money(cartTotal());
  $('#checkoutBtn').disabled = cartTotal() <= 0;
}

function updateBar() {
  const count = itemCount();
  const badge = $('#cartCount');
  badge.textContent = count;
  badge.hidden = count === 0;
  const bar = $('#checkoutBar');
  bar.hidden = count === 0;
  $('#barCount').textContent = count === 1 ? '1 item' : `${count} items`;
  $('#barTotal').textContent = money(cartTotal());
}

/* ---------- cart ops ---------- */
function setQty(id, delta) {
  const next = (state.cart[id] || 0) + delta;
  if (next <= 0) delete state.cart[id]; else state.cart[id] = Math.min(99, next);
  saveCart();
  refreshCard(id);
  renderCart();
  updateBar();
}
function cartTotal() { return Object.entries(state.cart).reduce((s, [id, q]) => s + (state.byId[id]?.price || 0) * q, 0); }
function itemCount() { return Object.values(state.cart).reduce((a, b) => a + b, 0); }
function cartArray() { return Object.entries(state.cart).map(([id, qty]) => ({ id, qty })); }

function pruneCart() {
  let changed = false;
  for (const id of Object.keys(state.cart)) {
    if (!state.byId[id] || !(state.cart[id] > 0)) { delete state.cart[id]; changed = true; }
  }
  if (changed) saveCart();
}
function loadCart() {
  try { const r = JSON.parse(localStorage.getItem('khqr_cart') || '{}'); return r && typeof r === 'object' ? r : {}; }
  catch (_) { return {}; }
}
function saveCart() { try { localStorage.setItem('khqr_cart', JSON.stringify(state.cart)); } catch (_) {} }

/* ---------- checkout flow ---------- */
function renderOrderSummary() {
  const lines = Object.entries(state.cart).map(([id, qty]) => {
    const p = state.byId[id]; if (!p) return '';
    return `<div class="os-line"><span class="os-name">${p.name} × ${qty}</span><span>${money(p.price * qty)}</span></div>`;
  }).join('');
  $('#orderSummary').innerHTML = lines +
    `<div class="os-total"><span>Total</span><strong>${money(cartTotal())}</strong></div>`;
  $('#payGoTotal').textContent = money(cartTotal());
}

function validForm() {
  let ok = true;
  [['#fFirst', (v) => v], ['#fLast', (v) => v], ['#fEmail', (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)]]
    .forEach(([sel, test]) => {
      const el = $(sel); const good = test(el.value.trim());
      el.classList.toggle('invalid', !good); if (!good) ok = false;
    });
  return ok;
}

async function startCheckout() {
  if (!validForm()) { toast('Please check your name and email.'); return; }
  const cust = {
    firstname: $('#fFirst').value.trim(), lastname: $('#fLast').value.trim(),
    email: $('#fEmail').value.trim(), phone: $('#fPhone').value.trim(),
  };
  const btn = $('#payGo');

  if (state.mode === 'payway') {
    setLoading(btn, true);
    try {
      const r = await fetch('api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart: cartArray(), customer: cust }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Checkout failed');
      postToPayWay(data.url, data.fields);
    } catch (err) { setLoading(btn, false); toast(err.message); }
    return;
  }

  // demo mode: render KHQR client-side (no real charge)
  state.tranId = 'DEMO-' + Date.now();
  const total = cartTotal();
  setStep(2);
  $('#qrAmount').textContent = money(total);
  $('#qrTran').textContent = state.tranId;
  renderQr('#qrBox', `DEMO-KHQR|merchant=SangCafe|tran=${state.tranId}|amount=${total.toFixed(2)}|NOT-A-REAL-PAYMENT`, 200);
}

function completeDemoPayment() {
  $('#doneTran').textContent = state.tranId;
  $('#doneAmount').textContent = money(cartTotal());
  state.cart = {}; saveCart(); renderGrid(); renderCart(); updateBar();
  setStep(3);
}

function postToPayWay(url, fields) {
  const form = document.createElement('form');
  form.method = 'POST'; form.action = url;
  Object.entries(fields).forEach(([k, v]) => {
    const i = document.createElement('input'); i.type = 'hidden'; i.name = k; i.value = v; form.appendChild(i);
  });
  document.body.appendChild(form); form.submit();
}

function setLoading(btn, on) {
  btn.classList.toggle('loading', on); btn.disabled = on;
  btn.querySelector('.spinner').hidden = !on;
}

/* ---------- QR ---------- */
function renderQr(sel, text, size) {
  const box = $(sel); box.innerHTML = '';
  if (typeof QRCode === 'undefined') { box.textContent = '[QR unavailable]'; return; }
  new QRCode(box, { text, width: size, height: size, correctLevel: QRCode.CorrectLevel.M });
}
function drawHeroQr() { renderQr('#heroQr', 'DEMO-KHQR|SangCafe|scan-with-any-bank', 130); }

/* ---------- modal / drawer / steps ---------- */
function openCart() { $('#cartDrawer').hidden = false; $('#cartOverlay').hidden = false; }
function closeCart() { $('#cartDrawer').hidden = true; $('#cartOverlay').hidden = true; }
function openPay() {
  if (cartTotal() <= 0) return;
  closeCart();
  renderOrderSummary();
  setStep(1);
  setLoading($('#payGo'), false);
  $('#payModal').hidden = false; $('#payOverlay').hidden = false;
}
function closePay() { $('#payModal').hidden = true; $('#payOverlay').hidden = true; }

function setStep(n) {
  $('#stepDetails').hidden = n !== 1;
  $('#stepQr').hidden = n !== 2;
  $('#stepDone').hidden = n !== 3;
  document.querySelectorAll('#steps li').forEach((li) => {
    const s = Number(li.dataset.s);
    li.classList.toggle('on', s === n);
    li.classList.toggle('done', s < n);
  });
}

let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 2000);
}

/* ---------- events ---------- */
function wireEvents() {
  // add / stepper on cards
  $('#grid').addEventListener('click', (e) => {
    const a = e.target.dataset;
    if (a.add) { setQty(a.add, 1); toast('Added to cart'); }
    else if (a.inc) setQty(a.inc, 1);
    else if (a.dec) setQty(a.dec, -1);
  });
  // stepper inside drawer
  $('#cartLines').addEventListener('click', (e) => {
    const a = e.target.dataset;
    if (a.inc) setQty(a.inc, 1);
    else if (a.dec) setQty(a.dec, -1);
  });
  $('#cartBtn').addEventListener('click', openCart);
  $('#cartClose').addEventListener('click', closeCart);
  $('#cartOverlay').addEventListener('click', closeCart);
  $('#checkoutBtn').addEventListener('click', openPay);
  $('#barReview').addEventListener('click', openCart);
  $('#barCheckout').addEventListener('click', openPay);
  $('#payClose').addEventListener('click', closePay);
  $('#payOverlay').addEventListener('click', closePay);
  $('#custForm').addEventListener('submit', (e) => { e.preventDefault(); startCheckout(); });
  $('#simulatePay').addEventListener('click', completeDemoPayment);
  $('#qrBack').addEventListener('click', () => setStep(1));
  $('#payFinish').addEventListener('click', closePay);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeCart(); closePay(); } });

  // returning from a real PayWay redirect
  const paid = new URLSearchParams(location.search).get('paid');
  if (paid) {
    state.tranId = paid; state.cart = {}; saveCart(); renderGrid(); renderCart(); updateBar();
    $('#payModal').hidden = false; $('#payOverlay').hidden = false;
    $('#doneTran').textContent = paid; $('#doneAmount').textContent = 'Confirmed';
    setStep(3);
  }
}
