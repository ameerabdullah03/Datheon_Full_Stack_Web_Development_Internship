const $ = selector => document.querySelector(selector);
const API = 'https://fakestoreapi.com/products';
const CART_KEY = 'forme.cart.v1';
let products = [];
let activeCategory = 'all';
let searchText = '';
let sortMode = 'featured';
let cart = loadCart();
const money = amount => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(amount);
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const displayCategory = category => category === 'electronics' ? 'Objects' : category === 'jewelery' ? 'Jewelry' : 'Clothing';
function loadCart() { try { const value = JSON.parse(localStorage.getItem(CART_KEY) || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).filter(([id,qty]) => /^\d+$/.test(id) && Number.isInteger(qty) && qty > 0)) : {}; } catch { return {}; } }
function saveCart() { try { localStorage.setItem(CART_KEY,JSON.stringify(cart)); } catch { /* Cart remains usable for this page session. */ } }
function productCategory(product) { return product.category === 'electronics' ? 'electronics' : product.category === 'jewelery' ? 'jewelery' : 'clothing'; }
function getVisibleProducts() {
  const visible = products.filter(item => (activeCategory === 'all' || productCategory(item) === activeCategory) && item.title.toLowerCase().includes(searchText));
  if (sortMode === 'price-asc') visible.sort((a,b) => a.price-b.price);
  if (sortMode === 'price-desc') visible.sort((a,b) => b.price-a.price);
  if (sortMode === 'rating') visible.sort((a,b) => b.rating.rate-a.rating.rate);
  return visible;
}
function renderProducts() {
  const visible = getVisibleProducts();
  $('#result-count').textContent = `${String(visible.length).padStart(2,'0')} PIECES IN THE EDIT`;
  $('#product-grid').innerHTML = visible.map((item,index) => `<article class="product-card"><div class="product-image-wrap"><span class="product-badge">${index < 3 && activeCategory === 'all' && !searchText ? 'THE EDIT' : displayCategory(item.category).toUpperCase()}</span><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy"><button class="quick-add" data-add="${item.id}" type="button">ADD TO BAG&nbsp;&nbsp; +</button></div><div class="product-info"><div class="product-topline"><h3 class="product-title">${escapeHtml(item.title)}</h3><span class="product-price">${money(item.price)}</span></div><div class="product-meta"><span class="product-category">${displayCategory(item.category)}</span><span class="rating"><span>★</span> ${Number(item.rating.rate).toFixed(1)} &nbsp;(${item.rating.count})</span></div></div></article>`).join('');
  $('#empty').hidden = visible.length !== 0;
}
async function fetchProducts() {
  $('#loading').hidden = false; $('#error').hidden = true; $('#product-grid').innerHTML = '';
  try {
    const response = await fetch(API);
    if (!response.ok) throw new Error('The collection could not be loaded.');
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('The collection response was not valid.');
    products = data.filter(item => Number.isFinite(item.id) && typeof item.title === 'string' && Number.isFinite(Number(item.price)) && item.rating);
    $('#loading').hidden = true; renderProducts(); renderCart();
  } catch {
    $('#loading').hidden = true; $('#error').hidden = false;
  }
}
function cartCount() { return Object.values(cart).reduce((sum,qty) => sum+qty,0); }
function addToCart(id) { cart[id] = (cart[id] || 0) + 1; saveCart(); renderCart(); openCart(); }
function updateQuantity(id,delta) { const next = (cart[id] || 0) + delta; if (next < 1) delete cart[id]; else cart[id] = next; saveCart(); renderCart(); }
function removeFromCart(id) { delete cart[id]; saveCart(); renderCart(); }
function calculateTotal() {
  const subtotal = products.reduce((sum,item) => sum + item.price * (cart[item.id] || 0),0);
  const shipping = subtotal === 0 || subtotal >= 100 ? 0 : 6;
  const tax = subtotal * 0.08;
  return {subtotal,shipping,tax,total:subtotal+shipping+tax};
}
function renderCart() {
  const count = cartCount(); $('#cart-count').textContent = count; $('#drawer-count').textContent = `(${count})`;
  const entries = Object.entries(cart).map(([id,qty]) => ({item:products.find(product => product.id === Number(id)),qty})).filter(entry => entry.item);
  $('#cart-items').innerHTML = entries.map(({item,qty}) => `<article class="cart-line"><img src="${escapeHtml(item.image)}" alt=""><div><div class="cart-line-title">${escapeHtml(item.title)}</div><div class="cart-line-category">${displayCategory(item.category)}</div><div class="quantity"><button type="button" data-qty="${item.id}" data-delta="-1" aria-label="Decrease ${escapeHtml(item.title)} quantity">−</button><span>${qty}</span><button type="button" data-qty="${item.id}" data-delta="1" aria-label="Increase ${escapeHtml(item.title)} quantity">+</button></div></div><div class="cart-line-price">${money(item.price*qty)}<button class="remove-line" data-remove="${item.id}" type="button">Remove</button></div></article>`).join('');
  const empty = entries.length === 0; $('#cart-empty').hidden = !empty; $('#cart-items').hidden = empty; $('#cart-bottom').hidden = empty;
  const {subtotal,shipping,tax,total} = calculateTotal(); $('#subtotal').textContent = money(subtotal); $('#shipping').textContent = shipping ? money(shipping) : 'Complimentary'; $('#tax').textContent = money(tax); $('#total').textContent = money(total);
  $('#shipping-note').textContent = subtotal >= 100 ? 'Your order ships on us. Lovely.' : `Complimentary shipping over $100 · ${money(Math.max(0,100-subtotal))} to go`;
}
function openCart() { $('#cart-drawer').classList.add('open'); $('#drawer-backdrop').classList.add('open'); $('#cart-drawer').setAttribute('aria-hidden','false'); document.body.classList.add('drawer-open'); $('#close-cart').focus(); }
function closeCart() { $('#cart-drawer').classList.remove('open'); $('#drawer-backdrop').classList.remove('open'); $('#cart-drawer').setAttribute('aria-hidden','true'); document.body.classList.remove('drawer-open'); $('#open-cart').focus(); }

document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click',() => {
  activeCategory = button.dataset.category;
  document.querySelectorAll('[data-category]').forEach(item => { const selected = item === button; item.classList.toggle('selected',selected); item.setAttribute('aria-pressed',String(selected)); });
  document.querySelectorAll('[data-nav-category]').forEach(item => item.classList.toggle('selected',item.dataset.navCategory === activeCategory));
  if (button.matches('[data-nav-category]')) document.querySelectorAll('.filter-chip').forEach(item => { const selected = item.dataset.category === activeCategory; item.classList.toggle('selected',selected); item.setAttribute('aria-pressed',String(selected)); });
  if (button.matches('.filter-chip')) document.querySelectorAll('[data-nav-category]').forEach(item => item.classList.toggle('selected',item.dataset.navCategory === activeCategory));
  renderProducts();
}));
$('#search-input').addEventListener('input',event => { searchText = event.target.value.trim().toLowerCase(); renderProducts(); });
$('#sort-select').addEventListener('change',event => { sortMode = event.target.value; renderProducts(); });
$('#product-grid').addEventListener('click',event => { const button = event.target.closest('[data-add]'); if (button) addToCart(Number(button.dataset.add)); });
$('#cart-items').addEventListener('click',event => { const qty = event.target.closest('[data-qty]'), remove = event.target.closest('[data-remove]'); if (qty) updateQuantity(Number(qty.dataset.qty),Number(qty.dataset.delta)); if (remove) removeFromCart(Number(remove.dataset.remove)); });
$('#open-cart').addEventListener('click',openCart); $('#close-cart').addEventListener('click',closeCart); $('#drawer-backdrop').addEventListener('click',closeCart); $('#continue-shopping').addEventListener('click',closeCart);
document.addEventListener('keydown',event => { if (event.key === 'Escape' && $('#cart-drawer').classList.contains('open')) closeCart(); });
$('#retry-button').addEventListener('click',fetchProducts);
$('#reset-filters').addEventListener('click',() => { activeCategory='all'; searchText=''; $('#search-input').value=''; document.querySelectorAll('[data-category]').forEach(item => { const selected=item.dataset.category==='all'; item.classList.toggle('selected',selected); item.setAttribute('aria-pressed',String(selected)); }); document.querySelectorAll('[data-nav-category]').forEach(item => item.classList.toggle('selected',item.dataset.navCategory==='all')); renderProducts(); });
$('#checkout-button').addEventListener('click',() => { if (!cartCount()) return; closeCart(); $('#order-number').textContent = `FM-${Math.random().toString(36).slice(2,8).toUpperCase()}`; $('#checkout-dialog').showModal(); });
function finishCheckout() { cart={}; saveCart(); renderCart(); $('#checkout-dialog').close(); }
$('#done-button').addEventListener('click',finishCheckout); $('#checkout-close').addEventListener('click',finishCheckout); $('#checkout-dialog').addEventListener('click',event => { if (event.target === $('#checkout-dialog')) finishCheckout(); });
fetchProducts();
