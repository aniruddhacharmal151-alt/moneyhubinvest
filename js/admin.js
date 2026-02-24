const ADMIN_EMAILS = ['admin@moneyhubinvest.com'];

export const Admin = {
  isAdmin(user) { return !!user && ADMIN_EMAILS.includes(user.email); },
  async loadWithdrawals() {
    if (!this.isAdmin(window.App.currentUser)) return;
    const { data, error } = await window.App.supabaseClient
      .from('withdrawals')
      .select('id,user_id,amount,upi_id,status,created_at')
      .order('created_at', { ascending: false });
    if (error) return;
    const tbody = document.getElementById('admin-withdrawals-table');
    tbody.innerHTML = '';
    data.forEach((w) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${w.user_id.slice(0, 8)}...</td><td>₹${w.amount}</td><td>${w.upi_id}</td><td>${w.status}</td><td>
        <button class="btn soft" data-action="approve" data-id="${w.id}">Approve</button>
        <button class="btn ghost" data-action="reject" data-id="${w.id}">Reject</button>
      </td>`;
      tbody.appendChild(tr);
    });
  },
  async processWithdrawal(id, action) {
    const payload = { withdrawal_id: id, action };
    const rpc = await window.App.supabaseClient.rpc('process_withdrawal', payload);
    if (rpc.error) {
      await window.App.supabaseClient.from('withdrawals').update({ status: action === 'approve' ? 'approved' : 'rejected' }).eq('id', id);
    }
    window.UI.showToast(`Withdrawal ${action}d`, 'success');
    await this.loadWithdrawals();
  }
};

window.Admin = Admin;
