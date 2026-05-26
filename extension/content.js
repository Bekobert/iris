// Iris — Content Script
// Activated by sidebar when user clicks Snap.
// Draws a crosshair overlay, lets user drag-select a region,
// crops it via canvas, and sends base64 to background for search.

(function () {
  // Guard: don't inject twice
  if (document.getElementById("iris-overlay")) return;

  // ── Overlay ──────────────────────────────────────────────
  const overlay = document.createElement("div");
  overlay.id = "iris-overlay";
  Object.assign(overlay.style, {
    position: "fixed",
    inset: "0",
    zIndex: "2147483647",
    cursor: "crosshair",
    background: "rgba(0,0,0,0.35)",
  });

  // Selection rectangle
  const selBox = document.createElement("div");
  Object.assign(selBox.style, {
    position: "fixed",
    border: "2px solid #fff",
    boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)",
    display: "none",
    pointerEvents: "none",
    zIndex: "2147483648",
  });

  // Hint label
  const hint = document.createElement("div");
  hint.textContent = "Drag to select a product — Esc to cancel";
  Object.assign(hint.style, {
    position: "fixed",
    top: "16px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "rgba(0,0,0,0.75)",
    color: "#fff",
    padding: "6px 14px",
    borderRadius: "6px",
    fontSize: "13px",
    fontFamily: "system-ui, sans-serif",
    pointerEvents: "none",
    zIndex: "2147483649",
    whiteSpace: "nowrap",
  });

  document.body.appendChild(overlay);
  document.body.appendChild(selBox);
  document.body.appendChild(hint);

  // ── Drag state ───────────────────────────────────────────
  let startX = 0, startY = 0, isDragging = false;

  function cleanup() {
    overlay.remove();
    selBox.remove();
    hint.remove();
    document.removeEventListener("keydown", onKeyDown);
  }

  function getRect(ax, ay, bx, by) {
    return {
      x: Math.min(ax, bx),
      y: Math.min(ay, by),
      w: Math.abs(bx - ax),
      h: Math.abs(by - ay),
    };
  }

  function updateSelBox(rect) {
    Object.assign(selBox.style, {
      display: rect.w > 4 && rect.h > 4 ? "block" : "none",
      left: rect.x + "px",
      top: rect.y + "px",
      width: rect.w + "px",
      height: rect.h + "px",
    });
  }

  overlay.addEventListener("mousedown", (e) => {
    e.preventDefault();
    startX = e.clientX;
    startY = e.clientY;
    isDragging = true;
    selBox.style.display = "none";
  });

  overlay.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const rect = getRect(startX, startY, e.clientX, e.clientY);
    updateSelBox(rect);
  });

  overlay.addEventListener("mouseup", (e) => {
    if (!isDragging) return;
    isDragging = false;

    const rect = getRect(startX, startY, e.clientX, e.clientY);

    // Minimum selection size — avoid accidental single clicks
    if (rect.w < 16 || rect.h < 16) {
      cleanup();
      return;
    }

    cleanup();
    captureRegion(rect);
  });

  function onKeyDown(e) {
    if (e.key === "Escape") {
      cleanup();
      // Tell sidebar the user cancelled so it can return to idle state
      chrome.runtime.sendMessage({ type: "SEARCH_CANCELLED" });
    }
  }
  document.addEventListener("keydown", onKeyDown);

  // ── Capture ──────────────────────────────────────────────
  function captureRegion(rect) {
    // 1. Ask background to capture the full visible tab as JPEG dataUrl
    chrome.runtime.sendMessage({ type: "CAPTURE_TAB" }, (response) => {
      if (!response || !response.dataUrl) {
        chrome.runtime.sendMessage({ type: "SEARCH_RESULTS", data: null });
        return;
      }

      const img = new Image();
      img.onload = () => {
        // 2. Scale rect from CSS pixels to device pixels
        const dpr = window.devicePixelRatio || 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(rect.w * dpr);
        canvas.height = Math.round(rect.h * dpr);

        const ctx = canvas.getContext("2d");
        ctx.drawImage(
          img,
          Math.round(rect.x * dpr),
          Math.round(rect.y * dpr),
          Math.round(rect.w * dpr),
          Math.round(rect.h * dpr),
          0, 0,
          canvas.width,
          canvas.height
        );

        // 3. Export as base64 JPEG (strip the data:image/jpeg;base64, prefix)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
        const base64 = dataUrl.split(",")[1];

        // 4. Send to background → backend
        chrome.runtime.sendMessage(
          { type: "SEARCH_IMAGE", imageBase64: base64 },
          (result) => {
            chrome.runtime.sendMessage({
              type: "SEARCH_RESULTS",
              data: result && result.success ? result.data : null,
            });
          }
        );
      };

      img.onerror = () => {
        chrome.runtime.sendMessage({ type: "SEARCH_RESULTS", data: null });
      };

      img.src = response.dataUrl;
    });
  }
})();
