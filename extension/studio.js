const CATEGORIES = [
  { key: 'all', label: 'all' },
  { key: 'top', label: 'tops' },
  { key: 'outer', label: 'outer' },
  { key: 'bottom', label: 'bottoms' },
  { key: 'shoes', label: 'shoes' },
  { key: 'bag', label: 'bags' },
];

const MOCK_PRODUCTS = [
  { id: 1, name: 'Oversize T-Shirt', brand: 'Zara', price: 349, emoji: '&#128085;', cat: 'top', img: null },
  { id: 2, name: 'Crop Blouse', brand: 'Mango', price: 499, emoji: '&#128085;', cat: 'top', img: null },
  { id: 3, name: 'Fitted Knit', brand: 'COS', price: 799, emoji: '&#128085;', cat: 'top', img: null },
  { id: 4, name: 'Denim Jacket', brand: 'Mango', price: 899, emoji: '&#129441;', cat: 'outer', img: null },
  { id: 5, name: 'Trench Coat', brand: 'H&M', price: 1299, emoji: '&#129441;', cat: 'outer', img: null },
  { id: 6, name: 'Wide Leg Pants', brand: 'H&M', price: 599, emoji: '&#128086;', cat: 'bottom', img: null },
  { id: 7, name: 'Mini Skirt', brand: 'Zara', price: 449, emoji: '&#128086;', cat: 'bottom', img: null },
  { id: 8, name: 'Straight Jeans', brand: "Levi's", price: 1199, emoji: '&#128086;', cat: 'bottom', img: null },
  { id: 9, name: 'Chunky Sneaker', brand: 'New Balance', price: 2490, emoji: '&#128094;', cat: 'shoes', img: null },
  { id: 10, name: 'Loafer', brand: 'Aldo', price: 1290, emoji: '&#128094;', cat: 'shoes', img: null },
  { id: 11, name: 'Platform Boot', brand: 'Steve Madden', price: 1890, emoji: '&#128094;', cat: 'shoes', img: null },
  { id: 12, name: 'Mini Bag', brand: '& Other Stories', price: 1599, emoji: '&#128092;', cat: 'bag', img: null },
  { id: 13, name: 'Scarf', brand: 'COS', price: 399, emoji: '&#129485;', cat: 'bag', img: null },
  { id: 14, name: 'Belt', brand: 'Zara', price: 299, emoji: '&#128092;', cat: 'bag', img: null },
];

const SLOT_META = {
  top:   { label: 'top',              icon: '&#128085;' },
  outer: { label: 'outer',            icon: '&#129441;' },
  bottom:{ label: 'bottom',           icon: '&#128086;' },
  shoes: { label: 'shoes',            icon: '&#128094;' },
  bag:   { label: 'bag / accessories',icon: '&#128092;' },
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
  } catch(e) {}
  return MOCK_PRODUCTS;
}

function renderTabs() {
  document.getElementById('catTabs').innerHTML = CATEGORIES.map(c =>
    `<button class="cat-tab${activeCat === c.key ? ' active' : ''}" onclick="setCategory('${c.key}')">${c.label}</button>`
  ).join('');
}

function renderList() {
  const products = getProducts();
  const filtered = activeCat === 'all' ? products : products.filter(p => (p.cat || p.category) === activeCat);
  document.getElementById('productList').innerHTML = filtered.length === 0
    ? `<div style="font-size:11px;color:#555;padding:8px 0">no items in this category</div>`
    : filtered.map(p => {
        const imgHtml = p.img
          ? `<img src="${p.img}" alt="" />`
          : `<span>${p.emoji || '&#128092;'}</span>`;
        const price = p.price ? `&#8378;${Number(p.price).toLocaleString('tr-TR')}` : '';
        return `<div class="prod-row" draggable="true" id="prod-${p.id}"
          ondragstart="dragStart(event,${p.id})"
          ondragend="dragEnd(event)"
          onclick="clickProduct(${p.id})">
          <div class="prod-row-img">${imgHtml}</div>
          <div class="prod-row-info">
            <div class="prod-row-name">${p.name || p.title || 'Product'}</div>
            <div class="prod-row-meta">${p.brand || p.store || ''}</div>
          </div>
          <div class="prod-row-price">${price}</div>
        </div>`;
      }).join('');
}

function setCategory(key) {
  activeCat = key;
  pendingSlot = null;
  document.querySelectorAll('.slot').forEach(s => s.style.outline = 'none');
  renderTabs();
  renderList();
}

function dragStart(e, id) {
  draggedId = id;
  setTimeout(() => document.getElementById('prod-' + id)?.classList.add('dragging'), 0);
  e.dataTransfer.effectAllowed = 'copy';
}

function dragEnd() {
  document.querySelectorAll('.prod-row').forEach(r => r.classList.remove('dragging'));
  draggedId = null;
}

function dragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}

function dragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function drop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  if (draggedId === null) return;
  fillSlot(e.currentTarget.dataset.slot, draggedId);
}

function clickProduct(id) {
  if (pendingSlot) {
    fillSlot(pendingSlot, id);
    pendingSlot = null;
    document.querySelectorAll('.slot').forEach(s => s.style.outline = 'none');
  } else {
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
}

function clickSlot(key) {
  if (slots[key]) return;
  pendingSlot = key;
  document.querySelectorAll('.slot').forEach(s => s.style.outline = 'none');
  document.getElementById('slot-' + key).style.outline = '2px solid #6c63ff';
  document.getElementById('slot-' + key).style.outlineOffset = '2px';
  const catMap = { top: 'top', outer: 'outer', bottom: 'bottom', shoes: 'shoes', bag: 'bag' };
  if (catMap[key]) setCategory(catMap[key]);
}

function fillSlot(key, productId) {
  const products = getProducts();
  const p = products.find(x => x.id === productId);
  if (!p) return;
  slots[key] = p;
  const el = document.getElementById('slot-' + key);
  el.classList.add('filled');
  el.style.outline = 'none';
  const imgHtml = p.img
    ? `<div class="thumb-img"><img src="${p.img}" alt="" /></div>`
    : `<div class="thumb-img">${p.emoji || '&#128092;'}</div>`;
  const price = p.price ? `&#8378;${Number(p.price).toLocaleString('tr-TR')}` : '';
  el.innerHTML = `
    <div class="product-thumb">
      ${imgHtml}
      <div class="thumb-info">
        <div class="thumb-name">${p.name || p.title || 'Product'}</div>
        <div class="thumb-brand">${p.brand || p.store || ''}</div>
        <div class="thumb-price">${price}</div>
      </div>
    </div>
    <button class="remove-btn" onclick="removeSlot(event,'${key}')">&#x2715;</button>
  `;
  updateTotal();
}

function removeSlot(e, key) {
  e.stopPropagation();
  slots[key] = null;
  const el = document.getElementById('slot-' + key);
  el.classList.remove('filled');
  el.style.outline = 'none';
  const m = SLOT_META[key];
  el.innerHTML = `<div class="slot-icon">${m.icon}</div><span class="slot-label">${m.label}</span>`;
  el.onclick = () => clickSlot(key);
  el.ondragover = ev => { ev.preventDefault(); el.classList.add('drag-over'); };
  el.ondragleave = () => el.classList.remove('drag-over');
  el.ondrop = ev => { ev.preventDefault(); el.classList.remove('drag-over'); if (draggedId !== null) fillSlot(key, draggedId); };
  updateTotal();
}

function clearAll() {
  Object.keys(slots).forEach(k => { if (slots[k]) removeSlot({ stopPropagation: () => {} }, k); });
  pendingSlot = null;
  document.querySelectorAll('.slot').forEach(s => s.style.outline = 'none');
}

function updateTotal() {
  const items = Object.values(slots).filter(Boolean);
  const total = items.reduce((s, p) => s + (Number(p.price) || 0), 0);
  document.getElementById('totalPrice').textContent = '\u20BA' + total.toLocaleString('tr-TR');
  document.getElementById('totalSub').textContent = items.length > 0 ? `${items.length} items` : 'no items selected';
  document.getElementById('breakdown').innerHTML = items.map(p =>
    `<div class="brow"><span>${p.name || p.title}</span><span>&#8378;${Number(p.price).toLocaleString('tr-TR')}</span></div>`
  ).join('');
}

function openPreview() {
  const name = document.getElementById('outfitName').value.trim() || 'untitled outfit';
  const activeTags = [...document.querySelectorAll('.stag.active')].map(t => t.textContent);
  const items = Object.values(slots).filter(Boolean);
  const total = items.reduce((s, p) => s + (Number(p.price) || 0), 0);

  document.getElementById('prevName').textContent = name;
  document.getElementById('prevTags').innerHTML = activeTags.map(t =>
    `<span class="preview-tag">${t}</span>`
  ).join('');

  const slotOrder = ['top', 'outer', 'bottom', 'shoes', 'bag'];
  document.getElementById('prevGrid').innerHTML = slotOrder.map(k => {
    const p = slots[k];
    const wide = k === 'bag' ? ' wide' : '';
    if (!p) return `<div class="preview-slot empty${wide}"><div class="preview-slot-img">${SLOT_META[k].icon}</div><div class="preview-slot-info"><div class="preview-slot-name">${SLOT_META[k].label}</div></div></div>`;
    const imgHtml = p.img ? `<img src="${p.img}" alt="" />` : p.emoji || '&#128092;';
    return `<div class="preview-slot${wide}">
      <div class="preview-slot-img">${imgHtml}</div>
      <div class="preview-slot-info">
        <div class="preview-slot-name">${p.name || p.title}</div>
        <div class="preview-slot-price">&#8378;${Number(p.price).toLocaleString('tr-TR')}</div>
      </div>
    </div>`;
  }).join('');

  document.getElementById('prevTotal').innerHTML = `total: <strong>&#8378;${total.toLocaleString('tr-TR')}</strong>`;
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
  } catch(e) {}
  closePreview();
  clearAll();
  document.getElementById('outfitName').value = '';
  document.querySelectorAll('.stag').forEach(t => t.classList.remove('active'));
}

// Close modal on backdrop click
document.getElementById('previewModal').addEventListener('click', function(e) {
  if (e.target === this) closePreview();
});

renderTabs();
renderList();
