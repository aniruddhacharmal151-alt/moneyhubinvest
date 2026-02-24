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
  openDepositModal() { window.UI.openModal('deposit'); },
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
        description: 'Wallet Deposit',
        theme: { color: '#4f8cff' },
        handler: async (response) => {
          await window.App.supabaseClient.from('deposits').insert({
            user_id: window.App.currentUser.id,
            amount,
            provider: 'razorpay',
            order_id: data.orderId,
            payment_id: response.razorpay_payment_id,
            status: 'paid_pending_webhook'
          });
          successBox.textContent = 'Payment captured. Balance will update after secure webhook confirmation.';
          successBox.classList.remove('hidden');
          window.UI.showToast('Awaiting Razorpay webhook confirmation', 'success');
        },
        prefill: { email: window.App.currentUser.email }
      };
      new window.Razorpay(options).open();
    } catch (err) {
      errorBox.textContent = err.message || 'Unable to start Razorpay checkout';
      errorBox.classList.remove('hidden');
    }
  }
};

window.Payments = Payments;
