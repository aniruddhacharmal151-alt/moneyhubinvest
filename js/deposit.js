window.renderDepositHistory = function renderDepositHistory(requests = []) {
  const total = requests.filter(r => r.status === "approved").reduce((sum, r) => sum + Number(r.amount || 0), 0);
  document.getElementById("deposit-total").textContent = window.formatCurrency(total);
  const box = document.getElementById("deposit-history");
  box.innerHTML = requests.slice(0, 6).map(r => `
    <div class="flex items-center justify-between rounded-lg bg-white/50 border border-white/30 px-3 py-2">
      <span>${new Date(r.created_at).toLocaleDateString("en-IN")} • ${r.status}</span>
      <span class="font-semibold">${window.formatCurrency(r.amount)}</span>
    </div>
  `).join("") || '<div class="text-slate-500">No deposit requests yet.</div>';
};

window.fetchDepositRequests = async function fetchDepositRequests() {
  if (!window.currentUser) return;
  const { data } = await window.supabaseClient
    .from("deposit_requests")
    .select("*")
    .eq("user_id", window.currentUser.id)
    .order("created_at", { ascending: false });
  window.latestDepositRequests = data || [];
  window.renderDepositHistory(window.latestDepositRequests);
};

window.submitDepositRequest = async function submitDepositRequest(e) {
  e.preventDefault();
  const amount = parseFloat(document.getElementById("manual-deposit-amount").value);
  const utr = document.getElementById("manual-deposit-utr").value.trim();
  const msg = document.getElementById("deposit-msg");
  msg.textContent = "";

  if (!window.currentUser) { msg.textContent = "Please login to submit a deposit request."; return; }
  if (!amount || amount <= 0) { msg.textContent = "Amount must be greater than 0."; return; }
  if (!utr) { msg.textContent = "Enter UTR number."; return; }
  if (utr.length < 10) { msg.textContent = "UTR must be at least 10 characters."; return; }

  const { error } = await window.supabaseClient.from("deposit_requests").insert({
    user_id: window.currentUser.id,
    amount,
    utr,
    status: "pending"
  });
  if (error) { msg.textContent = error.message; return; }

  await window.supabaseClient.from("transactions").insert({
    user_id: window.currentUser.id,
    type: "deposit",
    amount,
    status: "pending",
    provider: "upi_manual",
    reference_id: utr
  });

  msg.innerHTML = "Deposit request submitted<br>Status: Pending Verification";
  document.getElementById("manual-deposit-utr").value = "";
  document.getElementById("manual-deposit-amount").value = "";
  await window.fetchDepositRequests();
};
