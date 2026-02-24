let razorpayLoaded = false;

async function ensureRazorpayScript() {
  if (razorpayLoaded || window.Razorpay) return true;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });
  razorpayLoaded = true;
  return true;
}

export const Payments = {
  selectedPaymentApp: 'UPI',

  openDepositModal() { window.UI.openModal('deposit'); },

  bindPaymentTriggers() {
    // Unified third-party payment triggers: PhonePe/Paytm/GPay/UPI all open one Razorpay checkout.
    document.querySelectorAll('.payment-trigger').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!window.App.currentUser) return window.UI.openAuthModal('login');
        this.selectedPaymentApp = btn.dataset.app || 'UPI';
        this.openDepositModal();
      });
    });
  },

  async recordTransaction({ amount, paymentId, status, orderId }) {
    const payload = {
      user_id: window.App.currentUser.id,
      payment_id: paymentId,
      order_id: orderId,
      amount,
      status,
      provider: 'razorpay'
    };
    await window.App.supabaseClient.from('deposits').insert(payload);
    await window.App.supabaseClient.from('transactions').insert({
      user_id: window.App.currentUser.id,
      type: 'deposit',
      amount,
      status,
      payment_id: paymentId
    });
  },

  async finalizeSuccessfulPayment({ amount, paymentId, orderId }) {
    await this.recordTransaction({ amount, paymentId, orderId, status: 'success' });

    const { data: wallet } = await window.App.supabaseClient
      .from('wallet')
      .select('real_balance,balance')
      .eq('user_id', window.App.currentUser.id)
      .maybeSingle();
    const nextBalance = (wallet?.real_balance ?? wallet?.balance ?? 0) + amount;
    await window.App.supabaseClient
      .from('wallet')
      .update({ real_balance: nextBalance })
      .eq('user_id', window.App.currentUser.id);

    // Refresh wallet + activity immediately so the user sees real-time post-payment updates.
    await window.App.loadWallet();
    await window.App.loadTransactions();
  },

  async handleDeposit(event) {
    event.preventDefault();
    const amount = Number(document.getElementById('deposit-amount').value);
    const errorBox = document.getElementById('deposit-error');
    const successBox = document.getElementById('deposit-success');
    errorBox.classList.add('hidden'); successBox.classList.add('hidden');
    if (!window.App.currentUser) return window.UI.showToast('Please login first', 'error');
    if (!amount || amount < 2000) { errorBox.textContent = 'Minimum deposit ₹2,000'; errorBox.classList.remove('hidden'); return; }

    try {
      await ensureRazorpayScript();
      const { data, error } = await window.App.supabaseClient.functions.invoke('create-razorpay-order', { body: { amount } });
      if (error) throw error;
      const options = {
        key: data.key,
        amount: data.amount,
        currency: 'INR',
        order_id: data.orderId,
        name: 'MoneyHub Invest',
        description: `Wallet Deposit via ${this.selectedPaymentApp}`,
        method: { upi: true, card: true, netbanking: true, wallet: true },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay via UPI Apps',
                instruments: [
                  { method: 'upi', flows: ['collect', 'intent'] }
                ]
              }
            },
            sequence: ['block.upi', 'block.other'],
            preferences: { show_default_blocks: true }
          }
        },
        theme: { color: '#4f8cff' },
        handler: async (response) => {
          await this.finalizeSuccessfulPayment({ amount, paymentId: response.razorpay_payment_id, orderId: data.orderId });
          successBox.textContent = 'Payment successful and wallet updated.';
          successBox.classList.remove('hidden');
          window.UI.showToast('Deposit successful', 'success');
        },
        modal: {
          ondismiss: async () => {
            await this.recordTransaction({ amount, paymentId: null, orderId: data.orderId, status: 'cancelled' });
            errorBox.textContent = 'Payment cancelled. Please retry.';
            errorBox.classList.remove('hidden');
          }
        },
        prefill: { email: window.App.currentUser.email }
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async (resp) => {
        await this.recordTransaction({
          amount,
          paymentId: resp.error?.metadata?.payment_id || null,
          orderId: resp.error?.metadata?.order_id || data.orderId,
          status: 'failed'
        });
        errorBox.textContent = 'Payment failed. Please retry.';
        errorBox.classList.remove('hidden');
      });
      rzp.open();
    } catch (err) {
      errorBox.textContent = err.message || 'Unable to start Razorpay checkout';
      errorBox.classList.remove('hidden');
    }
  }
};

window.Payments = Payments;
