let signupEmailTemp = null;

export const Auth = {
  showLogin() {
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('signup-section').classList.add('hidden');
    document.getElementById('tab-login').classList.add('active');
    document.getElementById('tab-signup').classList.remove('active');
  },
  showSignup() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('signup-section').classList.remove('hidden');
    document.getElementById('tab-signup').classList.add('active');
    document.getElementById('tab-login').classList.remove('active');
  },
  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const { error } = await window.App.supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return window.UI.showToast(error.message, 'error');
    window.UI.closeAuthModal();
    window.UI.showToast('Login successful', 'success');
  },
  async sendSignupOtp() {
    const email = document.getElementById('signup-email').value.trim();
    if (!email) return window.UI.showToast('Email required', 'error');
    signupEmailTemp = email;
    const { error } = await window.App.supabaseClient.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) return window.UI.showToast(error.message, 'error');
    document.getElementById('signup-step-email').classList.add('hidden');
    document.getElementById('signup-step-otp').classList.remove('hidden');
    window.UI.showToast('OTP sent to email', 'success');
  },
  async verifySignupOtp() {
    const token = document.getElementById('signup-otp').value.trim();
    const { error } = await window.App.supabaseClient.auth.verifyOtp({ email: signupEmailTemp, token, type: 'email' });
    if (error) return window.UI.showToast(error.message, 'error');
    document.getElementById('signup-step-otp').classList.add('hidden');
    document.getElementById('signup-step-password').classList.remove('hidden');
  },
  async finishSignup() {
    const password = document.getElementById('signup-password').value;
    const { error } = await window.App.supabaseClient.auth.updateUser({ password });
    if (error) return window.UI.showToast(error.message, 'error');
    window.UI.showToast('Account created', 'success');
    window.UI.closeAuthModal();
  },
};

window.Auth = Auth;
