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

window.openUTRModal = function openUTRModal(amount) {
  document.getElementById("utr-amount").textContent = amount;
  document.getElementById("utr-input").value = "";
  document.getElementById("utr-msg").textContent = "";
  document.getElementById("utr-modal").classList.remove("hidden");
  document.getElementById("payment-screen").classList.add("hidden");
};

window.closeUTRModal = function closeUTRModal() {
  document.getElementById("utr-modal").classList.add("hidden");
};

window.submitUTR = async function submitUTR() {
  const utr = document.getElementById("utr-input").value.trim();
  const amount = localStorage.getItem("pendingDepositAmount");
  const msg = document.getElementById("utr-msg");
  msg.textContent = "";

  if (!utr) { msg.textContent = "Enter UTR number"; return; }
  if (utr.length < 10) { msg.textContent = "UTR must be at least 10 characters"; return; }
  if (!amount || Number(amount) <= 0) { msg.textContent = "Invalid amount"; return; }

  const { data: { user } } = await window.supabaseClient.auth.getUser();
  if (!user) { msg.textContent = "Login required"; return; }

  const { error } = await window.supabaseClient
    .from("deposit_requests")
    .insert({ user_id: user.id, amount: Number(amount), utr, status: "pending" });

  if (error) {
    msg.textContent = error.message;
  } else {
    msg.textContent = "Deposit request submitted. Status: Pending Verification";
    localStorage.removeItem("pendingDepositAmount");
    localStorage.removeItem("pendingDepositTime");
    setTimeout(() => {
      window.closeUTRModal();
      window.loadDepositHistory();
      window.loadWallet();
    }, 700);
  }
};

window.submitDepositRequest = async function submitDepositRequest(e) {
  // legacy form hook support
  if (e) e.preventDefault();
  return window.submitUTR();
};

document.addEventListener("DOMContentLoaded", () => {
  const amount = localStorage.getItem("pendingDepositAmount");
  const time = localStorage.getItem("pendingDepositTime");
  if (amount && time) {
    const age = Date.now() - parseInt(time, 10);
    if (age < 600000) window.openUTRModal(amount);
  }

  const submitBtn = document.getElementById("submit-utr-btn");
  if (submitBtn) submitBtn.addEventListener("click", window.submitUTR);
  window.loadDepositHistory();
});
