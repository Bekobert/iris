// Iris — Outfit Studio JS

const CATEGORIES = [
  { key: 'all', label: 'all' },
  { key: 'top', label: 'tops' },
  { key: 'outer', label: 'outer' },
  { key: 'bottom', label: 'bottoms' },
  { key: 'shoes', label: 'shoes' },
  { key: 'bag', label: 'bags' },
];

const MOCK_PRODUCTS = [
  { id: 1, name: 'Oversize T-Shirt', brand: 'Zara', price: 349, emoji: '&#128085;', cat: 'top' },
  { id: 2, name: 'Crop Blouse', brand: 'Mango', price: 499, emoji: '&#128085;', cat: 'top' },
  { id: 3, name: 'Fitted Knit', brand: 'COS', price: 799, emoji: '&#128085;', cat: 'top' },
  { id: 4, name: 'Denim Jacket', brand: 'Mango', price: 899, emoji: '&#129441;', cat: 'outer' },
  { id: 5, name: 'Trench Coat', brand: 'H&M', price: 1299, emoji: '&#129441;', cat: 'outer' },
  { id: 6, name: 'Wide Leg Pants', brand: 'H&M', price: 599, emoji: '&#128086;', cat: 'bottom' },
  { id: 7, name: 'Mini Skirt', brand: 'Zara', price: 449, emoji: '&#128086;', cat: 'bottom' },
  { id: 8, name: 'Straight Jeans', brand: "Levi's", price: 1199, emoji: '&#128086;', cat: 'bottom' },
  { id: 9, name: 'Chunky Sneaker', brand: 'New Balance', price: 2490, emoji: '&#128094;', cat: 'shoes' },
  { id: 10, name: 'Loafer', brand: 'Aldo', price: 1290, emoji: '&#128094;', cat: 'shoes' },
  { id: 11, name: 'Platform Boot', brand: 'Steve Madden', price: 1890, emoji: '&#128094;', cat: 'shoes' },
  { id: 12, name: 'Mini Bag', brand: '& Other Stories', price: 1599, emoji: '&#128092;', cat: 'bag' },
  { id: 13, name: 'Scarf', brand: 'COS', price: 399, emoji: '&#129485;', cat: 'bag' },
  { id: 14, name: 'Belt', brand: 'Zara', price: 299, emoji: '&#128092;', cat: 'bag' },
];

const SLOT_META = {
  top:    { label: 'top',               icon: '\u{1F455}' },
  outer:  { label: 'outer',             icon: '\u{1F9E5}' },
  bottom: { label: 'bottom',            icon: '\u{1F456}' },
  shoes:  { label: 'shoes',             icon: '\u{1F45E}' },
  bag:    { label: 'bag / accessories', icon: '\u{1F45C}' },
};

let slots = { top: null, outer: null, bottom: null, shoes: null, bag: null };
let activeCat = 'all';
let draggedId = null;
let pendingSlot = null;

function getProducts() {
  try {
    const raw = localStorage.getItem('iris_products');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return MOCK_PRODUCTS;
}

// ── Tabs ──────────────────────────────────────────────────────
function renderTabs() {
  const el = document.getElementById('catTabs');
  el.innerHTML = '';
  CATEGORIES.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'cat-tab' + (activeCat === c.key ? ' active' : '');
    btn.textContent = c.label;
    btn.addEventListener('click', () => setCategory(c.key));
    el.appendChild(btn);
  });
}

// ── Product list ──────────────────────────────────────────────
function renderList() {
  const products = getProducts();
  const filtered = activeCat === 'all' ? products : products.filter(p => (p.cat || p.category) === activeCat);
  const el = document.getElementById('productList');
  el.innerHTML = '';

  if (filtered.length === 0) {
    el.innerHTML = '<div style="font-size:11px;color:#555;padding:8px 0">no items in this category</div>';
    return;
  }

  filtered.forEach(p => {
    const row = document.createElement('div');
    row.className = 'prod-row';
    row.draggable = true;
    row.id = 'prod-' + p.id;

    const imgHtml = p.img
      ? `<div class="prod-row-img"><img src="${p.img}" alt="" /></div>`
      : `<div class="prod-row-img">${p.emoji || '\u{1F45C}'}</div>`;
    const price = p.price ? '\u20BA' + Number(p.price).toLocaleString('tr-TR') : '';

    row.innerHTML = `
      ${imgHtml}
      <div class="prod-row-info">
        <div class="prod-row-name">${p.name || p.title || 'Product'}</div>
        <div class="prod-row-meta">${p.brand || p.store || ''}</div>
      </div>
      <div class="prod-row-price">${price}</div>
    `;

    row.addEventListener('dragstart', e => {
      draggedId = p.id;
      e.dataTransfer.effectAllowed = 'copy';
      // Store id in dataTransfer as fallback
      e.dataTransfer.setData('text/plain', String(p.id));
      setTimeout(() => row.classList.add('dragging'), 0);
    });

    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
      // Don't clear draggedId here — drop fires before dragend in some browsers
    });

    row.addEventListener('click', () => clickProduct(p.id));

    el.appendChild(row);
  });
}

function setCategory(key) {
  activeCat = key;
  renderTabs();
  renderList();
}

// ── Slot event binding ────────────────────────────────────────
function bindSlotEvents(el, key) {
  el.addEventListener('dragover', e => {
    e.preventDefault();
    e.stopPropagation();
    el.classList.add('drag-over');
  });
  el.addEventListener('dragleave', e => {
    // Only remove if leaving the slot itself, not a child
    if (!el.contains(e.relatedTarget)) {
      el.classList.remove('drag-over');
    }
  });
  el.addEventListener('drop', e => {
    e.preventDefault();
    e.stopPropagation();
    el.classList.remove('drag-over');
    // Prefer module-level draggedId, fall back to dataTransfer
    const id = draggedId !== null ? draggedId : parseInt(e.dataTransfer.getData('text/plain'), 10);
    draggedId = null;
    if (!isNaN(id)) fillSlot(key, id);
  });
  el.addEventListener('click', () => {
    if (!slots[key]) clickSlot(key);
  });
}

// ── Init slots ────────────────────────────────────────────────
function initSlots() {
  Object.keys(SLOT_META).forEach(key => {
    const el = document.getElementById('slot-' + key);
    if (el) bindSlotEvents(el, key);
  });
}

// ── Interactions ──────────────────────────────────────────────
function clickProduct(id) {
  if (pendingSlot) {
    fillSlot(pendingSlot, id);
    pendingSlot = null;
    document.querySelectorAll('.slot').forEach(s => s.style.outline = 'none');
    return;
  }
  const products = getProducts();
  const p = products.find(x => x.id === id);
  const cat = p ? (p.cat || p.category) : null;
  if (cat && !slots[cat]) {
    fillSlot(cat, id);
  } else {
    const empty = Object.keys(slots).find(k => !slots[k]);
    if (empty) fillSlot(empty, id);
  }
}

function clickSlot(key) {
  pendingSlot = key;
  document.querySelectorAll('.slot').forEach(s => s.style.outline = 'none');
  const el = document.getElementById('slot-' + key);
  if (el) {
    el.style.outline = '2px solid #6c63ff';
    el.style.outlineOffset = '2px';
  }
  const catMap = { top: 'top', outer: 'outer', bottom: 'bottom', shoes: 'shoes', bag: 'bag' };
  if (catMap[key]) setCategory(catMap[key]);
}

function fillSlot(key, productId) {
  const products = getProducts();
  // productId may be number or string depending on source
  const p = products.find(x => x.id == productId);
  if (!p) return;

  slots[key] = p;
  draggedId = null;

  const el = document.getElementById('slot-' + key);
  if (!el) return;
  el.classList.add('filled');
  el.style.outline = 'none';
  el.innerHTML = '';

  // Build content
  const thumb = document.createElement('div');
  thumb.className = 'product-thumb';

  const imgDiv = document.createElement('div');
  imgDiv.className = 'thumb-img';
  if (p.img) {
    const img = document.createElement('img');
    img.src = p.img;
    img.alt = p.name || '';
    imgDiv.appendChild(img);
  } else {
    imgDiv.innerHTML = p.emoji || '\u{1F45C}';
  }

  const info = document.createElement('div');
  info.className = 'thumb-info';
  info.innerHTML = `
    <div class="thumb-name">${p.name || p.title || 'Product'}</div>
    <div class="thumb-brand">${p.brand || p.store || ''}</div>
    <div class="thumb-price">${p.price ? '\u20BA' + Number(p.price).toLocaleString('tr-TR') : ''}</div>
  `;

  thumb.appendChild(imgDiv);
  thumb.appendChild(info);
  el.appendChild(thumb);

  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-btn';
  removeBtn.innerHTML = '&#x2715;';
  removeBtn.addEventListener('click', e => {
    e.stopPropagation();
    removeSlot(key);
  });
  el.appendChild(removeBtn);

  // Re-bind drag/click after innerHTML reset
  bindSlotEvents(el, key);
  updateTotal();
}

function removeSlot(key) {
  slots[key] = null;
  const el = document.getElementById('slot-' + key);
  if (!el) return;
  el.classList.remove('filled');
  el.style.outline = 'none';
  el.innerHTML = '';

  const m = SLOT_META[key];
  const iconDiv = document.createElement('div');
  iconDiv.className = 'slot-icon';
  iconDiv.textContent = m.icon;
  const label = document.createElement('span');
  label.className = 'slot-label';
  label.textContent = m.label;
  el.appendChild(iconDiv);
  el.appendChild(label);

  // Re-bind events (innerHTML wipe removes old listeners)
  bindSlotEvents(el, key);
  updateTotal();
}

function clearAll() {
  Object.keys(slots).forEach(k => { if (slots[k]) removeSlot(k); });
  pendingSlot = null;
  draggedId = null;
  document.querySelectorAll('.slot').forEach(s => s.style.outline = 'none');
}

function updateTotal() {
  const items = Object.values(slots).filter(Boolean);
  const total = items.reduce((s, p) => s + (Number(p.price) || 0), 0);
  document.getElementById('totalPrice').textContent = '\u20BA' + total.toLocaleString('tr-TR');
  document.getElementById('totalSub').textContent = items.length > 0 ? `${items.length} items` : 'no items selected';
  document.getElementById('breakdown').innerHTML = items
    .map(p => `<div class="brow"><span>${p.name || p.title}</span><span>\u20BA${Number(p.price).toLocaleString('tr-TR')}</span></div>`)
    .join('');
}

// ── Preview modal ─────────────────────────────────────────────
function openPreview() {
  const name = document.getElementById('outfitName').value.trim() || 'untitled outfit';
  const activeTags = [...document.querySelectorAll('.stag.active')].map(t => t.textContent);
  const items = Object.values(slots).filter(Boolean);
  const total = items.reduce((s, p) => s + (Number(p.price) || 0), 0);

  document.getElementById('prevName').textContent = name;
  document.getElementById('prevTags').innerHTML = activeTags.map(t => `<span class="preview-tag">${t}</span>`).join('');

  const slotOrder = ['top', 'outer', 'bottom', 'shoes', 'bag'];
  document.getElementById('prevGrid').innerHTML = slotOrder.map(k => {
    const p = slots[k];
    const wide = k === 'bag' ? ' wide' : '';
    if (!p) return `<div class="preview-slot empty${wide}"><div class="preview-slot-img">${SLOT_META[k].icon}</div><div class="preview-slot-info"><div class="preview-slot-name">${SLOT_META[k].label}</div></div></div>`;
    const imgHtml = p.img ? `<img src="${p.img}" alt="" />` : p.emoji || '\u{1F45C}';
    return `<div class="preview-slot${wide}"><div class="preview-slot-img">${imgHtml}</div><div class="preview-slot-info"><div class="preview-slot-name">${p.name || p.title}</div><div class="preview-slot-price">\u20BA${Number(p.price).toLocaleString('tr-TR')}</div></div></div>`;
  }).join('');

  document.getElementById('prevTotal').innerHTML = `total: <strong>\u20BA${total.toLocaleString('tr-TR')}</strong>`;
  document.getElementById('previewModal').classList.add('open');
}

function closePreview() {
  document.getElementById('previewModal').classList.remove('open');
}

function saveOutfit() {
  const name = document.getElementById('outfitName').value.trim() || 'untitled outfit';
  const activeTags = [...document.querySelectorAll('.stag.active')].map(t => t.textContent);
  const outfit = {
    id: Date.now(),
    name,
    tags: activeTags,
    slots: { ...slots },
    total: Object.values(slots).filter(Boolean).reduce((s, p) => s + (Number(p.price) || 0), 0),
    createdAt: new Date().toISOString(),
  };
  try {
    const existing = JSON.parse(localStorage.getItem('iris_outfits') || '[]');
    existing.unshift(outfit);
    localStorage.setItem('iris_outfits', JSON.stringify(existing));
  } catch (e) {}
  closePreview();
  clearAll();
  document.getElementById('outfitName').value = '';
  document.querySelectorAll('.stag').forEach(t => t.classList.remove('active'));
}

// ── Wire up buttons ───────────────────────────────────────────
document.getElementById('previewModal').addEventListener('click', function (e) {
  if (e.target === this) closePreview();
});

document.querySelector('[onclick="clearAll()"]')?.removeAttribute('onclick');
document.querySelector('[onclick="openPreview()"]')?.removeAttribute('onclick');

document.querySelectorAll('[onclick]').forEach(el => {
  const fn = el.getAttribute('onclick');
  if (fn === 'clearAll()') { el.removeAttribute('onclick'); el.addEventListener('click', clearAll); }
  if (fn === 'openPreview()') { el.removeAttribute('onclick'); el.addEventListener('click', openPreview); }
  if (fn === 'closePreview()') { el.removeAttribute('onclick'); el.addEventListener('click', closePreview); }
  if (fn === 'saveOutfit()') { el.removeAttribute('onclick'); el.addEventListener('click', saveOutfit); }
});

// ── Init ──────────────────────────────────────────────────────
initSlots();
renderTabs();
renderList();
