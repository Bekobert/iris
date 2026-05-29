// Iris — Background Service Worker

const API_BASE = "http://localhost:8000";

// ── Close sidebar when user switches tabs ─────────────────────
chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) return;
    if (
      tab.url &&
      !tab.url.startsWith("chrome") &&
      !tab.url.startsWith("chrome-extension") &&
      !tab.url.startsWith("about")
    ) {
      // Disable side panel — closes it if open
      chrome.sidePanel.setOptions({ enabled: false });
      // Re-enable immediately so icon click works again on the new tab
      setTimeout(() => {
        chrome.sidePanel.setOptions({ enabled: true });
      }, 300);
    }
  });
});

// ── Auth helpers ──────────────────────────────────────────

async function getAccessToken() {
  const { iris_access_token } = await chrome.storage.local.get("iris_access_token");
  return iris_access_token || null;
}

function authHeaders(token, extra = {}) {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    ...extra,
  };
}

// ── Extension icon click ──────────────────────────────────

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
  getAccessToken().then((token) => {
    if (!token) {
      chrome.tabs.create({ url: chrome.runtime.getURL("auth.html") });
    }
  });
});

// ── Message router ────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SEARCH_IMAGE") {
    searchImage(message.imageBase64)
      .then((results) => sendResponse({ success: true, data: results }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === "SAVE_PRODUCT") {
    saveProduct(message.product)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((err) => sendResponse({
        success: false,
        error: err.message === "FREE_TIER_LIMIT" ? "FREE_TIER_LIMIT" : err.message,
      }));
    return true;
  }

  if (message.type === "DELETE_PRODUCT") {
    deleteProduct(message.savedProductId)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === "CAPTURE_TAB") {
    chrome.tabs.captureVisibleTab(
      sender.tab.windowId,
      { format: "jpeg", quality: 92 },
      (dataUrl) => sendResponse({ dataUrl })
    );
    return true;
  }

  if (message.type === "SEARCH_RESULTS") {
    chrome.runtime.sendMessage({ type: "SEARCH_RESULTS", data: message.data });
    sendResponse({ success: true });
  }

  if (message.type === "LOGOUT") {
    chrome.storage.local.remove([
      "iris_access_token",
      "iris_refresh_token",
      "iris_user_id",
      "iris_user_email",
      "iris_user_tier",
    ]);
    sendResponse({ success: true });
  }
});

// ── API calls ─────────────────────────────────────────────

async function searchImage(imageBase64) {
  const token = await getAccessToken();
  const response = await fetch(`${API_BASE}/search`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ image_base64: imageBase64, count: 6 }),
  });
  if (!response.ok) throw new Error(`Search API error: ${response.status}`);
  return await response.json();
}

async function saveProduct(product) {
  const token = await getAccessToken();
  const body = {
    collection_id: null,
    product_name: product.product_name,
    price: product.price ?? null,
    currency: product.currency ?? "USD",
    store_name: product.store_name,
    store_url: product.store_url,
    image_url: product.image_url,
    similarity_score: product.similarity_score,
    category: product.category ?? null,
    source_api: product.source_api,
  };
  const response = await fetch(`${API_BASE}/products/save`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  if (response.status === 402) throw new Error("FREE_TIER_LIMIT");
  if (response.status === 401) throw new Error("UNAUTHORIZED");
  if (!response.ok) throw new Error(`Save API error: ${response.status}`);
  return await response.json();
}

async function deleteProduct(savedProductId) {
  const token = await getAccessToken();
  const response = await fetch(`${API_BASE}/products/${savedProductId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error(`Delete API error: ${response.status}`);
}
