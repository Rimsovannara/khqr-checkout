'use strict';

/**
 * Product catalog. In a real store this comes from a database; kept inline here
 * so the demo runs with zero setup. Prices are in USD (PayWay also supports KHR).
 * The same list is mirrored in docs/app.js for the static demo-mode build.
 */

const PRODUCTS = [
  { id: 'kfe-01', name: 'Iced Cambodian Coffee', khmer: 'កាហ្វេទឹកកក', price: 1.75, emoji: '🧋', tag: 'Bestseller' },
  { id: 'kfe-02', name: 'Khmer Iced Tea',        khmer: 'តែទឹកកក',      price: 1.25, emoji: '🍵', tag: '' },
  { id: 'kfe-03', name: 'Num Krok (12 pcs)',     khmer: 'នំក្រុក',       price: 2.50, emoji: '🥟', tag: '' },
  { id: 'kfe-04', name: 'Fresh Coconut',         khmer: 'ដូងខ្ចី',       price: 2.00, emoji: '🥥', tag: '' },
  { id: 'kfe-05', name: 'Mango Sticky Rice',     khmer: 'បាយដំណើបស្វាយ',  price: 3.00, emoji: '🥭', tag: 'Popular' },
  { id: 'kfe-06', name: 'Palm Sugar Cake',       khmer: 'នំត្នោត',       price: 1.50, emoji: '🍮', tag: '' },
];

const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));

module.exports = { PRODUCTS, byId };
