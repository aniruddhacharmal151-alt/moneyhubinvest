window.renderDepositHistory = function renderDepositHistory(requests = []) {
  const total = requests
    .filter(r => r.status === "approved")
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);
  document.getElementById("deposit-total").textContent = window.formatCurrency(total);

  const list = document.getElementById("deposit-list");
  if (!list) return;
  list.innerHTML = "";

  (requests || []).forEach(dep => {
    const li = document.createElement("li");
    li.className = "rounded-lg bg-white/50 border border-white/30 px-3 py-2 text-sm flex items-center justify-between";
    li.innerHTML = `<span>₹${dep.amount}</span><span class="capitalize">${dep.status}</span>`;
    list.appendChild(li);
  });

  if (!requests.length) {
    const li = document.createElement("li");
    li.className = "text-slate-500 text-sm";
    li.textContent = "No deposit requests yet.";
    list.appendChild(li);
  }
};

window.loadDepositHistory = async function loadDepositHistory() {
  if (!window.currentUser) {
    const list = document.getElementById("deposit-list");
    if (list) list.innerHTML = "";
    return;
  }

  const { data, error } = await window.supabaseClient
    .from("deposit_requests")
    .select("*")
    .eq("user_id", window.currentUser.id)
    .order("created_at", { ascending: false });

  if (error) return;
  window.latestDepositRequests = data || [];
  window.renderDepositHistory(window.latestDepositRequests);
};

window.fetchDepositRequests = window.loadDepositHistory;
