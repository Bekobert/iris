// Iris — Collection Page
// Fetches saved products from backend, renders a filterable/sortable grid.

const API_BASE = "http://localhost:8000";

// ── State ─────────────────────────────────────────────────
let allProducts = [];
let activeCategory = "all";
let activeSort = "date_desc";
let searchQuery = "";
let accessToken = null;

// ── DOM refs ──────────────────────────────────────────────
const grid = document.getElementById("product-grid");
const statCount = document.getElementById("stat-count");
const searchInput = document.getElementById("search-input");
const sortSelect = document.getElementById("sort-select");

// ── Auth check ────────────────────────────────────────────
async function init() {
  const storage = await chrome.storage.local.get("iris_access_token");
  accessToken = storage.iris_access_token || null;

  if (!accessToken) {
    // Not logged in — redirect to auth
    window.location.href = chrome.runtime.getURL("auth.html");
    return;
  }

  fetchProducts();
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken}`,
  };
}

// ── Fetch ─────────────────────────────────────────────────
async function fetchProducts() {
  renderLoading();
  try {
    const res = await fetch(`${API_BASE}/products`, { headers: authHeaders() });
    if (res.status === 401) {
      // Token expired — go back to auth
      await chrome.storage.local.remove("iris_access_token");
      window.location.href = chrome.runtime.getURL("auth.html");
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allProducts = data.products || [];
    renderGrid();
  } catch (err) {
    renderError(err.message);
  }
}

// ── Filter + Sort ─────────────────────────────────────────
function getFiltered() {
  let list = [...allProducts];

  if (activeCategory !== "all") {
    list = list.filter((p) => p.category === activeCategory);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    list = list.filter(
      (p) =>
        p.product_name.toLowerCase().includes(q) ||
        p.store_name.toLowerCase().includes(q)
    );
  }

  list.sort((a, b) => {
    switch (activeSort) {
      case "date_asc":   return new Date(a.created_at) - new Date(b.created_at);
      case "date_desc":  return new Date(b.created_at) - new Date(a.created_at);
      case "price_asc":  return (a.price ?? Infinity) - (b.price ?? Infinity);
      case "price_desc": return (b.price ?? -Infinity) - (a.price ?? -Infinity);
      case "name_asc":   return a.product_name.localeCompare(b.product_name);
      default:           return 0;
    }
  });

  return list;
}

// ── Render helpers ────────────────────────────────────────
function renderLoading() {
  grid.innerHTML = `
    <div class="state" style="grid-column: 1/-1;">
      <div class="spinner"></div>
      <div class="state-title">Loading collection...</div>
    </div>`;
}

function renderError(msg) {
  grid.innerHTML = `
    <div class="state" style="grid-column: 1/-1;">
      <div class="state-icon">⚠️</div>
      <div class="state-title">Could not load products</div>
      <div class="state-sub">${msg}<br>Make sure the backend is running.</div>
    </div>`;
}

function renderEmpty() {
  grid.innerHTML = `
    <div class="state" style="grid-column: 1/-1;">
      <div class="state-icon">🛍️</div>
      <div class="state-title">Nothing here yet</div>
      <div class="state-sub">Snap a product from any page and save it to your collection.</div>
    </div>`;
}

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function renderGrid() {
  const list = getFiltered();
  statCount.textContent = `${allProducts.length} product${allProducts.length !== 1 ? "s" : ""}`;

  if (list.length === 0) {
    renderEmpty();
    return;
  }

  const fallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Crect width='180' height='180' fill='%231a1a22'/%3E%3C/svg%3E";

  grid.innerHTML = list.map((p) => {
    const price = p.price != null
      ? `<span class="card-price">${p.currency || "USD"} ${parseFloat(p.price).toFixed(2)}</span>`
      : `<span class="no-price">No price</span>`;

    return `
      <div class="product-card" data-id="${p.id}" data-url="${p.store_url}">
        <img class="product-img"
             src="${p.image_url || fallback}"
             alt="${p.product_name}"
             onerror="this.src='${fallback}'" />
        ${p.category ? `<span class="category-badge">${p.category}</span>` : ""}
        <button class="delete-btn" data-id="${p.id}" title="Remove">✕</button>
        <div class="card-body">
          <div class="card-name" title="${p.product_name}">${p.product_name}</div>
          <div class="card-store">${p.store_name}</div>
          <div class="card-footer">
            ${price}
            <span class="card-date">${formatDate(p.created_at)}</span>
          </div>
        </div>
      </div>`;
  }).join("");

  grid.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".delete-btn")) return;
      window.open(card.dataset.url, "_blank");
    });
  });

  grid.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteProduct(btn.dataset.id);
    });
  });
}

// ── Delete ────────────────────────────────────────────────
async function deleteProduct(productId) {
  allProducts = allProducts.filter((p) => p.id !== productId);
  renderGrid();

  try {
    const res = await fetch(`${API_BASE}/products/${productId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
    showToast("Product removed.", "info");
  } catch (err) {
    showToast("Could not delete. Try again.", "error");
    fetchProducts();
  }
}

// ── Toast ─────────────────────────────────────────────────
function showToast(msg, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className = `show ${type}`;
  setTimeout(() => { toast.className = ""; }, 3000);
}

// ── Event listeners ───────────────────────────────────────
searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderGrid();
});

sortSelect.addEventListener("change", (e) => {
  activeSort = e.target.value;
  renderGrid();
});

document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeCategory = btn.dataset.cat;
    renderGrid();
  });
});

// ── Init ──────────────────────────────────────────────────
init();
