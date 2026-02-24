import { UI } from './ui.js';
import { Auth } from './auth.js';
import { Payments } from './payments.js';
import { Admin } from './admin.js';

const { createClient } = window.supabase;

export const App = {
  supabaseClient: createClient(
    'https://vwsbxvpghoolfqyxyovf.supabase.co',
    'sb_publishable_ZJcZG3Eg1glLZ1dZp90i-g_vSlo1HKK'
  ),
  currentUser: null,
  walletSubscription: null,

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount || 0);
  },

  async ensureWalletExists() {
    if (!this.currentUser) return;
    const { data } = await this.supabaseClient.from('wallet').select('user_id').eq('user_id', this.currentUser.id).maybeSingle();
    if (!data) {
      await this.supabaseClient.from('wallet').insert({ user_id: this.currentUser.id, real_balance: 0, bonus_balance: 0, last_bonus_claim: null });
    }
  },

  async loadWallet() {
    if (!this.currentUser) return;
    const { data } = await this.supabaseClient.from('wallet').select('real_balance,bonus_balance,balance,last_bonus_claim').eq('user_id', this.currentUser.id).maybeSingle();
    const realBalance = data?.real_balance ?? data?.balance ?? 0;
    const bonusBalance = data?.bonus_balance ?? 0;
    document.getElementById('user-balance').textContent = this.formatCurrency(realBalance + bonusBalance);
    document.getElementById('dashboard-real-balance').textContent = this.formatCurrency(realBalance);
    document.getElementById('dashboard-bonus-balance').textContent = this.formatCurrency(bonusBalance);
    document.getElementById('withdraw-balance').textContent = this.formatCurrency(realBalance);
  },

  subscribeWallet() {
    this.walletSubscription?.unsubscribe?.();
    if (!this.currentUser) return;
    this.walletSubscription = this.supabaseClient
      .channel(`wallet-${this.currentUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet', filter: `user_id=eq.${this.currentUser.id}` }, () => this.loadWallet())
      .subscribe();
  },

  async loadTransactions() {
    if (!this.currentUser) return;
    const { data } = await this.supabaseClient.from('transactions').select('type,amount,status,created_at').eq('user_id', this.currentUser.id).order('created_at', { ascending: false }).limit(15);
    const tbody = document.getElementById('transactions-table');
    tbody.innerHTML = '';
    (data || []).forEach((t) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${t.type}</td><td>${this.formatCurrency(t.amount)}</td><td>${t.status}</td><td>${new Date(t.created_at).toLocaleString()}</td>`;
      tbody.appendChild(tr);
    });
  },

  async handleWithdraw(event) {
    event.preventDefault();
    const amount = Number(document.getElementById('withdraw-amount').value);
    const upi = document.getElementById('withdraw-upi').value.trim();
    const errorBox = document.getElementById('withdraw-error');
    const successBox = document.getElementById('withdraw-success');
    errorBox.classList.add('hidden'); successBox.classList.add('hidden');
    const wallet = await this.supabaseClient.from('wallet').select('real_balance,balance').eq('user_id', this.currentUser.id).maybeSingle();
    const real = wallet.data?.real_balance ?? wallet.data?.balance ?? 0;
    if (amount < 1000) { errorBox.textContent = 'Minimum withdrawal ₹1,000'; errorBox.classList.remove('hidden'); return; }
    if (amount > real) { errorBox.textContent = 'Only real balance is withdrawable.'; errorBox.classList.remove('hidden'); return; }
    const { error } = await this.supabaseClient.from('withdrawals').insert({ user_id: this.currentUser.id, amount, upi_id: upi, status: 'pending' });
    if (error) { errorBox.textContent = error.message; errorBox.classList.remove('hidden'); return; }
    successBox.textContent = 'Withdrawal request submitted for admin approval.';
    successBox.classList.remove('hidden');
    document.getElementById('withdraw-form').reset();
  },

  async claimDailyBonus() {
    if (!this.currentUser) return;
    const { data } = await this.supabaseClient.from('wallet').select('bonus_balance,last_bonus_claim').eq('user_id', this.currentUser.id).single();
    const today = new Date().toISOString().slice(0, 10);
    const claimed = data?.last_bonus_claim?.slice(0, 10) === today;
    if (claimed) return UI.showToast('Daily bonus already claimed today', 'error');
    const next = Math.min((data?.bonus_balance || 0) + 50, 500);
    await this.supabaseClient.from('wallet').update({ bonus_balance: next, last_bonus_claim: new Date().toISOString() }).eq('user_id', this.currentUser.id);
    UI.showToast('Daily bonus credited', 'success');
  },

  checkAuthAndDeposit(amount) {
    if (!this.currentUser) return UI.openAuthModal('login');
    document.getElementById('deposit-amount').value = amount;
    Payments.openDepositModal();
  },

  updateProfileSection() {
    const email = this.currentUser?.email || '—';
    const userId = this.currentUser?.id || '—';
    document.getElementById('profile-email').textContent = email;
    document.getElementById('profile-user-id').textContent = userId;
  },

  setupMenuNavigation() {
    const nav = document.getElementById('main-nav');
    // Keep all top-menu items disabled before login and activate them after auth.
    nav.addEventListener('click', (event) => {
      const link = event.target.closest('a[data-section]');
      if (!link) return;
      if (!this.currentUser) {
        event.preventDefault();
        UI.showToast('Please login to access menu sections.', 'error');
        return;
      }
      event.preventDefault();
      const target = document.getElementById(link.dataset.section);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      nav.classList.remove('open-mobile');
    });
  },

  renderAuthState() {
    const isLoggedIn = !!this.currentUser;
    document.getElementById('auth-buttons').classList.toggle('hidden', isLoggedIn);
    document.getElementById('user-menu').classList.toggle('hidden', !isLoggedIn);
    document.getElementById('marketing-view').classList.toggle('hidden', isLoggedIn);
    document.getElementById('dashboard-layout').classList.toggle('hidden', !isLoggedIn);
    document.querySelectorAll('.user-only').forEach((el) => el.classList.toggle('hidden', !isLoggedIn));
    const showAdmin = Admin.isAdmin(this.currentUser);
    document.getElementById('admin-panel').classList.toggle('hidden', !showAdmin);
    document.querySelectorAll('.admin-only').forEach((el) => el.classList.toggle('hidden', !showAdmin));
    document.querySelectorAll('.requires-login').forEach((el) => el.classList.toggle('disabled-link', !isLoggedIn));
    this.updateProfileSection();
  },

  async bootstrap() {
    document.getElementById('login-form').addEventListener('submit', Auth.handleLogin);
    document.getElementById('deposit-form').addEventListener('submit', Payments.handleDeposit.bind(Payments));
    Payments.bindPaymentTriggers();
    document.getElementById('withdraw-form').addEventListener('submit', this.handleWithdraw.bind(this));
    document.getElementById('claim-bonus-btn').addEventListener('click', this.claimDailyBonus.bind(this));

    document.getElementById('menu-toggle').addEventListener('click', () => {
      document.getElementById('main-nav').classList.toggle('open-mobile');
    });
    this.setupMenuNavigation();

    document.getElementById('admin-withdrawals-table').addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-id]');
      if (!btn) return;
      await Admin.processWithdrawal(btn.dataset.id, btn.dataset.action);
    });

    this.supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      this.currentUser = session?.user || null;
      UI.transitionTo(() => this.renderAuthState());
      if (this.currentUser) {
        // After successful login/session restore, always land on Home dashboard and load wallet/activity.
        window.location.hash = '#dashboard-layout';
        await this.ensureWalletExists();
        await this.loadWallet();
        await this.loadTransactions();
        await Admin.loadWithdrawals();
        this.subscribeWallet();
      }
    });

    const { data } = await this.supabaseClient.auth.getSession();
    this.currentUser = data?.session?.user || null;
    this.renderAuthState();
    if (this.currentUser) {
      await this.ensureWalletExists();
      await this.loadWallet();
      await this.loadTransactions();
      await Admin.loadWithdrawals();
      this.subscribeWallet();
    }
  }
};

window.App = App;
App.bootstrap();
