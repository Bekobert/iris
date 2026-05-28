// Iris — Auth Page

const API_BASE = 'http://localhost:8000';

const emailEl   = document.getElementById('email');
const passEl    = document.getElementById('password');
const submitBtn = document.getElementById('submit-btn');
const errorEl   = document.getElementById('error-msg');
const infoEl    = document.getElementById('info-msg');
const tabLogin  = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');

let mode = 'login'; // 'login' | 'signup'

// ── Tab switch ────────────────────────────────────────────
tabLogin.addEventListener('click', () => {
  mode = 'login';
  tabLogin.classList.add('active');
  tabSignup.classList.remove('active');
  submitBtn.textContent = 'Sign In';
  clearMessages();
});

tabSignup.addEventListener('click', () => {
  mode = 'signup';
  tabSignup.classList.add('active');
  tabLogin.classList.remove('active');
  submitBtn.textContent = 'Create Account';
  clearMessages();
});

// ── Submit ────────────────────────────────────────────────
submitBtn.addEventListener('click', async () => {
  clearMessages();
  const email    = emailEl.value.trim();
  const password = passEl.value;

  if (!email || !password) {
    showError('Please enter your email and password.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Please wait...';

  try {
    const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Signup — email confirmation required
      if (res.status === 400 && data.detail && data.detail.includes('e-posta')) {
        showInfo('Account created! Check your email to confirm, then sign in.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
        return;
      }
      showError(data.detail || 'Something went wrong.');
      submitBtn.disabled = false;
      submitBtn.textContent = mode === 'login' ? 'Sign In' : 'Create Account';
      return;
    }

    // Save token + user info
    await chrome.storage.local.set({
      iris_access_token:  data.access_token,
      iris_refresh_token: data.refresh_token,
      iris_user_id:       data.user_id,
      iris_user_email:    data.email,
      iris_user_tier:     data.tier,
    });

    // chrome.sidePanel.open() can only be called from a direct user gesture
    // (icon click in background), not from a message. Show success instead.
    showSuccess(data.email);

  } catch (err) {
    showError('Cannot reach the backend. Make sure the server is running.');
    submitBtn.disabled = false;
    submitBtn.textContent = mode === 'login' ? 'Sign In' : 'Create Account';
  }
});

// ── Success screen ────────────────────────────────────────
function showSuccess(email) {
  document.querySelector('.auth-box').innerHTML = `
    <div style="text-align:center; padding: 32px 16px;">
      <div style="font-size:48px; margin-bottom:16px;">👁️</div>
      <div style="font-size:18px; font-weight:600; margin-bottom:8px; color:#1a1a2e;">
        Welcome to Iris!
      </div>
      <div style="font-size:13px; color:#666; margin-bottom:24px;">
        Signed in as <strong>${email}</strong>
      </div>
      <div style="font-size:13px; color:#444; background:#f5f5ff; border-radius:10px; padding:14px;">
        Click the <strong>Iris icon</strong> in your toolbar to open the sidebar.
      </div>
    </div>
  `;
}

// ── Helpers ───────────────────────────────────────────────
function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.add('show');
}

function showInfo(msg) {
  infoEl.textContent = msg;
  infoEl.classList.add('show');
}

function clearMessages() {
  errorEl.classList.remove('show');
  infoEl.classList.remove('show');
}
