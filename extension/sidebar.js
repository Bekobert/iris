// Iris — Sidebar JS

const app = document.getElementById("app");
const snapBtn = document.getElementById("snapBtn");

// ── State ─────────────────────────────────────────────────
let state = "idle"; // idle | loading | results | error
let currentResults = [];

// savedMap: product_id (adapter) → saved_product_id (Supabase UUID)
// Persisted in localStorage so saves survive sidebar close/reopen.
let savedMap = JSON.parse(localStorage.getItem("iris_saved_map") || "{}");

function persistSavedMap() {
  localStorage.setItem("iris_saved_map", JSON.stringify(savedMap));
}

// ── Render ────────────────────────────────────────────────
function render() {
  if (state === "idle") {
    app.innerHTML = `
      <div class="state">
        <div class="state-icon">👁️</div>
        <div class="state-title">Search for a product</div>
        <div class="state-sub">Press Snap and select any product on the page.</div>
      </div>`;
    return;
  }

  if (state === "loading") {
    app.innerHTML = `
      <div class="state">
        <div class="spinner"></div>
        <div class="state-title">Searching...</div>
        <div class="state-sub">Finding similar products.</div>
      </div>`;
    return;
  }

  if (state === "error") {
    app.innerHTML = `
      <div class="state">
        <div class="state-icon">⚠️</div>
        <div class="state-title">Something went wrong</div>
        <div class="state-sub">Could not reach the backend.<br>Make sure the server is running.</div>
      </div>`;
    return;
  }

  if (state === "results") {
    const cards = currentResults.results.map((p) => {
      const isSaved = !!savedMap[p.product_id];
      const score = Math.round(p.similarity_score * 100);
      const price = p.price != null
        ? `${p.currency} ${p.price.toFixed(2)}`
        : null;

      return `
        <div class="product-card" data-url="${p.store_url}" data-id="${p.product_id}">
          <img class="product-img" src="${p.image_url}" alt="${p.product_name}"
               onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2258%22 height=%2258%22><rect width=%2258%22 height=%2258%22 fill=%22%23F0EFFF%22/></svg>'" />
          <div class="product-info">
            <div class="product-name">${p.product_name}</div>
            <div class="product-store">${p.store_name}</div>
            ${price
              ? `<div class="product-price">${price}</div>`
              : `<div class="product-price no-price">No price available</div>`
            }
          </div>
          <span class="score-badge">${score}%</span>
          <button class="save-btn ${isSaved ? "saved" : ""}"
                  data-product='${JSON.stringify(p).replace(/'/g, "&#39;")}'
                  data-product-id="${p.product_id}"
                  title="${isSaved ? "Saved" : "Add to collection"}">
            ${isSaved ? "♥" : "♡"}
          </button>
        </div>`;
    }).join("");

    app.innerHTML = `
      <div class="results-header">${currentResults.total} results found</div>
      <div class="product-list">${cards}</div>
      <div class="query-id">Query: ${currentResults.query_id}</div>`;

    // Card click — open store page
    app.querySelectorAll(".product-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".save-btn")) return;
        chrome.tabs.create({ url: card.dataset.url });
      });
    });

    // Save button
    app.querySelectorAll(".save-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const product = JSON.parse(btn.dataset.product);
        toggleSave(product, btn);
      });
    });
  }
}

// ── Save / Unsave ─────────────────────────────────────────
function toggleSave(product, btn) {
  const alreadySaved = !!savedMap[product.product_id];

  if (alreadySaved) {
    // Optimistic UI update
    const savedProductId = savedMap[product.product_id];
    delete savedMap[product.product_id];
    persistSavedMap();
    btn.classList.remove("saved");
    btn.textContent = "♡";
    btn.title = "Add to collection";

    // Fire delete request (best-effort, no UI rollback for now)
    chrome.runtime.sendMessage(
      { type: "DELETE_PRODUCT", savedProductId },
      () => {}
    );
  } else {
    // Optimistic UI update — mark as saving
    btn.disabled = true;
    btn.textContent = "…";

    chrome.runtime.sendMessage({ type: "SAVE_PRODUCT", product }, (response) => {
      btn.disabled = false;

      if (response && response.success) {
        // Store the Supabase UUID so we can delete it later
        savedMap[product.product_id] = response.data.saved_product_id;
        persistSavedMap();
        btn.classList.add("saved");
        btn.textContent = "♥";
        btn.title = "Saved";
      } else {
        // Revert
        btn.textContent = "♡";
        btn.title = "Add to collection";

        if (response && response.error === "FREE_TIER_LIMIT") {
          showToast("Free plan limit reached (20 products). Upgrade to Pro.", "warn");
        } else {
          showToast("Could not save product. Try again.", "error");
        }
      }
    });
  }
}

// ── Toast ─────────────────────────────────────────────────
function showToast(message, type = "info") {
  const existing = document.getElementById("iris-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "iris-toast";
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 3500);
}

// ── Snap button ───────────────────────────────────────────
snapBtn.addEventListener("click", () => {
  state = "loading";
  render();

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript(
      { target: { tabId: tabs[0].id }, files: ["content.js"] },
      () => {
        chrome.tabs.sendMessage(tabs[0].id, { type: "ACTIVATE_CROP" });
      }
    );
  });
});

// ── Listen for results from background ───────────────────
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "SEARCH_RESULTS") {
    if (message.data) {
      currentResults = message.data;
      state = "results";
    } else {
      state = "error";
    }
    render();
  }
});

// ── Initial render ────────────────────────────────────────
render();
