window.renderWithdrawInvestments = async function renderWithdrawInvestments(prefetched) {
  const { data } = prefetched
    ? { data: prefetched }
    : await window.supabaseClient.from("investments").select("*").eq("user_id", window.currentUser.id).order("start_timestamp", { ascending: false });
  const list = data || [];
  const box = document.getElementById("withdraw-investments");
  const now = Date.now();
  box.innerHTML = list.map(inv => {
    const canWithdraw = now >= (new Date(inv.end_timestamp).getTime() + 86400000);
    return `<div class="rounded-xl bg-white/50 p-3 border border-white/40 text-sm flex justify-between gap-2">
      <span>Plan #${inv.plan_id} • ${inv.status}</span>
      <span class="${canWithdraw ? "text-emerald-700" : "text-slate-500"}">${canWithdraw ? "Eligible" : "Locked"}</span>
    </div>`;
  }).join("") || '<div class="text-slate-500">No investments found.</div>';
};

window.handleWithdraw = async function handleWithdraw(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById("withdraw-amount").value);
  const upi = document.getElementById("withdraw-upi").value;
  const msg = document.getElementById("withdraw-msg");
  msg.textContent = "";
  if (!amount || amount < 1000) { msg.textContent = "Minimum withdrawal ₹1000"; return; }

  const { data: wallet } = await window.supabaseClient.from("wallet").select("balance").eq("user_id", window.currentUser.id).single();
  if (!wallet || wallet.balance < amount) { msg.textContent = "Insufficient balance"; return; }

  const { error } = await window.supabaseClient.from("withdrawals").insert({ user_id: window.currentUser.id, amount, upi_id: upi, status: "pending" });
  if (error) { msg.textContent = error.message; return; }

  await window.supabaseClient.from("transactions").insert({ user_id: window.currentUser.id, type: "withdrawal", amount, status: "pending", provider: "upi" });
  msg.textContent = "Withdrawal request submitted. Awaiting admin approval.";
  document.getElementById("withdraw-form").reset();
};
