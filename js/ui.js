export const UI = {
  openModal(name) { document.getElementById(`${name}-modal`)?.classList.remove('hidden'); },
  closeModal(name) { document.getElementById(`${name}-modal`)?.classList.add('hidden'); },
  openAuthModal(mode = 'login') { this.openModal('auth'); mode === 'signup' ? window.Auth.showSignup() : window.Auth.showLogin(); },
  closeAuthModal() { this.closeModal('auth'); },
  showToast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => el.remove(), 3000);
  },
  transitionTo(fn) {
    const app = document.getElementById('app');
    app.classList.add('fading');
    setTimeout(() => { fn(); app.classList.remove('fading'); }, 180);
  },
};

window.UI = UI;
