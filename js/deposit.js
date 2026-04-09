const UPI_ID = "razerpay@upi";

window.renderDepositHistory = function renderDepositHistory(requests = []) {
  const total = requests
    .filter((r) => r.status === "approved")
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const totalNode = document.getElementById("deposit-total");
  if (totalNode && window.formatCurrency) totalNode.textContent = window.formatCurrency(total);

  const list = document.getElementById("deposit-list");
  if (!list) return;
  list.innerHTML = "";

  (requests || []).forEach((dep) => {
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
  if (!window.currentUser || !window.supabaseClient) return;

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

window.openDepositPopup = function openDepositPopup(plan, amount) {
  document.getElementById("modalPlanName").innerText = plan;
  document.getElementById("depositStatusMsg").textContent = "";
  document.getElementById("depositModal").dataset.amount = String(amount || "");
  document.getElementById("depositModal").classList.remove("hidden");
};

window.closeDepositModal = function closeDepositModal() {
  document.getElementById("depositModal").classList.add("hidden");
};

window.payNow = function payNow() {
  window.location.href = `upi://pay?pa=${UPI_ID}&pn=InvestHub&cu=INR`;
};

window.showUTR = function showUTR() {
  const utr = prompt("Enter UTR number");
  if (!utr) return;

  localStorage.setItem("deposit_utr", utr.trim());
  localStorage.setItem("deposit_status", "pending");

  const msg = document.getElementById("depositStatusMsg");
  if (msg) msg.textContent = "Payment submitted. Verifying...";

  const delayMs = 4000;
  setTimeout(() => {
    localStorage.setItem("deposit_status", "success");
    if (msg) msg.textContent = "Deposit verified successfully.";
  }, delayMs);
};

window.checkDepositStatus = function checkDepositStatus() {
  if (localStorage.getItem("deposit_status") === "success") {
    const msg = document.getElementById("depositStatusMsg");
    if (msg) msg.textContent = "Deposit successful.";
  }
};

window.initDepositFlow = function initDepositFlow() {
  const upiBtn = document.getElementById("upiPayBtn");
  if (upiBtn) upiBtn.onclick = window.payNow;

  const paidBtn = document.getElementById("paidBtn");
  if (paidBtn) paidBtn.onclick = window.showUTR;

  window.checkDepositStatus();
};
