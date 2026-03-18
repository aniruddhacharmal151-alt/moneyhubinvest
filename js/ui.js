const UPI_ID = "razerpay@upi";

window.plans = [
  { id: 1, name: "Plan A", amount: 6000, days: 35, dailyReturn: 180, totalReturn: 12000, aura: "rgba(125,211,252,.32)" },
  { id: 2, name: "Plan B", amount: 16000, days: 45, dailyReturn: 420, totalReturn: 26000, aura: "rgba(196,181,253,.30)" },
  { id: 3, name: "Plan C", amount: 22000, days: 60, dailyReturn: 560, totalReturn: 42000, aura: "rgba(244,114,182,.24)" },
  { id: 4, name: "Plan D", amount: 30000, days: 75, dailyReturn: 800, totalReturn: 60000, aura: "rgba(110,231,183,.30)" },
  { id: 5, name: "Plan E", amount: 38000, days: 95, dailyReturn: 1020, totalReturn: 76000, aura: "rgba(147,197,253,.28)" },
  { id: 6, name: "Plan F", amount: 45000, days: 120, dailyReturn: 1250, totalReturn: 90000, aura: "rgba(253,186,116,.32)" },
  { id: 7, name: "Plan G", amount: 52000, days: 150, dailyReturn: 1450, totalReturn: 104000, aura: "rgba(167,139,250,.28)" },
  { id: 8, name: "Plan H", amount: 65000, days: 180, dailyReturn: 1800, totalReturn: 130000, aura: "rgba(250,204,21,.24)" }
];

window.formatCurrency = function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount);
};

window.toggleFooterSection = function toggleFooterSection(section) {
  ["terms", "privacy", "disclaimer"].forEach((key) => {
    const content = document.getElementById(`${key}-content`);
    const icon = document.getElementById(`${key}-icon`);
    const isTarget = key === section;
    const willOpen = isTarget && !content.classList.contains("open");
    content.classList.toggle("open", willOpen);
    icon.textContent = willOpen ? "−" : "+";
  });
};

window.formatTime = function formatTime(ms) {
  if (ms <= 0) return "00 : 00 : 00 : 00";
  const sec = Math.floor(ms / 1000);
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(d).padStart(2, "0")} : ${String(h).padStart(2, "0")} : ${String(m).padStart(2, "0")} : ${String(s).padStart(2, "0")}`;
};






window.openUPIPayment = function openUPIPayment(amount) {
  const upiLink = `upi://pay?pa=${UPI_ID}&pn=InvestHub&am=${amount}&cu=INR`;
  window.location.href = upiLink;
};

window.generateQR = function generateQR(amount) {
  const upi = `upi://pay?pa=${UPI_ID}&pn=InvestHub&am=${amount}&cu=INR`;
  document.getElementById("upiQR").src =
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upi)}`;
};

window.openDepositModal = function openDepositModal(plan, amount) {
  document.getElementById("modalPlanName").innerText = plan;
  document.getElementById("modalAmount").innerText = amount;
  document.getElementById("depositModal").classList.remove("hidden");
  window.generateQR(amount);
};

window.closeDepositModal = function closeDepositModal() {
  document.getElementById("depositModal").classList.add("hidden");
};

window.attachPlanButtons = function attachPlanButtons() {
  document.querySelectorAll(".plan-btn").forEach((btn) => {
    btn.onclick = function () {
      const plan = this.dataset.plan;
      const amount = this.dataset.amount;
      window.openDepositModal(plan, amount);
    };
  });
};

window.bindUPIPayButton = function bindUPIPayButton() {
  const upiBtn = document.getElementById("upiPayBtn");
  if (!upiBtn) return;
  upiBtn.onclick = function () {
    const amount = document.getElementById("modalAmount").innerText;
    window.openUPIPayment(amount);
  };
};

window.openModal = function openModal(type, mode = "login") {
  if (type === "auth") {
    window.authMode = mode;
    window.updateAuthModal();
    document.getElementById("auth-modal").classList.remove("hidden");
    document.getElementById("auth-modal").classList.add("flex");
  }
};

window.closeModal = function closeModal(type) {
  const el = document.getElementById(`${type}-modal`);
  el.classList.add("hidden");
  el.classList.remove("flex");
};

window.closeAllNavPopovers = function closeAllNavPopovers() {
  document.getElementById("top-menu-popover").classList.add("hidden");
  document.getElementById("profile-popover").classList.add("hidden");
};

window.toggleTopMenu = function toggleTopMenu() {
  const menu = document.getElementById("top-menu-popover");
  const profile = document.getElementById("profile-popover");
  const show = menu.classList.contains("hidden");
  menu.classList.toggle("hidden", !show);
  profile.classList.add("hidden");
};

window.toggleProfilePanel = function toggleProfilePanel() {
  const profile = document.getElementById("profile-popover");
  const menu = document.getElementById("top-menu-popover");
  const show = profile.classList.contains("hidden");
  profile.classList.toggle("hidden", !show);
  menu.classList.add("hidden");
};

window.navigateFromMenu = function navigateFromMenu(section) {
  window.navigate(section);
  window.closeAllNavPopovers();
};

window.confirmLogout = function confirmLogout() {
  window.closeAllNavPopovers();
  document.getElementById("logout-modal").classList.remove("hidden");
  document.getElementById("logout-modal").classList.add("flex");
};

window.closeLogoutModal = function closeLogoutModal() {
  document.getElementById("logout-modal").classList.add("hidden");
  document.getElementById("logout-modal").classList.remove("flex");
};

window.createPlanCard = function createPlanCard(plan, loggedIn) {
  const isLowest = plan.id === window.plans[0].id;
  const isHighest = plan.id === window.plans[window.plans.length - 1].id;
  const card = document.createElement("div");
  card.className = `plan-card glass rounded-2xl p-4 tap ${isLowest ? "lowest" : ""} ${isHighest ? "highest" : ""}`;
  card.style.setProperty("--aura", plan.aura);
  card.innerHTML = `
    <h4 class="text-lg font-bold">${plan.name}</h4>
    <p class="text-sm text-slate-600 mt-1">${plan.days} Days Cycle</p>
    <p class="text-sm text-slate-600">Return: ~${Math.round((plan.totalReturn / plan.amount) * 100)}%</p>
    <div class="mt-3 space-y-1 text-sm">
      <p>Daily Return: <span class="font-semibold">${window.formatCurrency(plan.dailyReturn)}</span></p>
      <p>Total Return: <span class="font-semibold">${window.formatCurrency(plan.totalReturn)}</span></p>
      <p>Plan Amount: <span class="font-semibold">${window.formatCurrency(plan.amount)}</span></p>
    </div>
    <button class="plan-btn mt-4 w-full rounded-xl py-2 text-white ${isHighest ? "bg-amber-500 highlight-btn-gold" : "bg-blue-600"} ${isLowest ? "highlight-btn" : ""} btn-premium" data-plan="${plan.name}" data-amount="${plan.amount}">${loggedIn ? "Deposit" : "Login to Activate"}</button>
  `;

  if (!loggedIn) {
    card.querySelector("button").onclick = () => window.openModal("auth", "login");
  }
  return card;
};

window.renderPlans = function renderPlans() {
  const publicList = document.getElementById("public-plan-list");
  publicList.innerHTML = "";
  window.plans.slice(0, window.visiblePublicPlans).forEach(p => publicList.appendChild(window.createPlanCard(p, false)));
  document.getElementById("public-load-more").classList.toggle("hidden", window.visiblePublicPlans >= window.plans.length);

  const privateList = document.getElementById("private-plan-list");
  privateList.innerHTML = "";
  window.plans.slice(0, window.visiblePrivatePlans).forEach((p) => {
    const card = window.createPlanCard(p, true);
    card.classList.add("fade-slide-enter");
    privateList.appendChild(card);
  });
  document.getElementById("private-load-more").classList.toggle("hidden", window.visiblePrivatePlans >= window.plans.length);
  window.attachPlanButtons();
};

window.loadMorePlans = function loadMorePlans(type) {
  if (type === "public") window.visiblePublicPlans = Math.min(window.plans.length, window.visiblePublicPlans + 3);
  if (type === "private") window.visiblePrivatePlans = Math.min(window.plans.length, window.visiblePrivatePlans + 3);
  window.bindUPIPayButton();
window.renderPlans();
};

window.navigate = function navigate(section) {
  document.getElementById("home-section").classList.toggle("hidden", section !== "home");
  document.getElementById("deposit-section").classList.toggle("hidden", section !== "deposit");
  document.getElementById("withdraw-section").classList.toggle("hidden", section !== "withdraw");
  document.getElementById("settings-section").classList.toggle("hidden", section !== "settings");
  if (section === "withdraw") window.renderWithdrawInvestments();
  if (section === "deposit") window.renderDepositHistory(window.latestDepositRequests);
};

window.fetchInvestments = async function fetchInvestments() {
  if (!window.currentUser) return;
  const { data } = await window.supabaseClient.from("investments").select("*").eq("user_id", window.currentUser.id).order("start_timestamp", { ascending: false });
  const list = data || [];
  window.latestInvestments = list;
  window.updateDashboardStats(list);
  window.renderInvestmentTimers(list);
  window.renderWithdrawInvestments(list);
  window.renderRecentTransactions(list);
};

window.updateDashboardStats = function updateDashboardStats(investments = []) {
  const active = investments.filter(i => i.status === "active").length;
  const earnings = investments.reduce((sum, i) => {
    const plan = window.plans.find(p => p.id === i.plan_id);
    return sum + Math.max(0, (plan?.totalReturn || i.amount) - i.amount);
  }, 0);
  document.getElementById("active-count").textContent = active;
  document.getElementById("total-earnings").textContent = window.formatCurrency(earnings);
};

window.renderRecentTransactions = function renderRecentTransactions(investments = []) {
  const box = document.getElementById("recent-transactions");
  box.innerHTML = investments.slice(0, 4).map(i => `
    <div class="flex items-center justify-between border-b border-white/15 pb-2">
      <span>Plan #${i.plan_id} Activated</span>
      <span>${window.formatCurrency(i.amount)}</span>
    </div>`).join("") || '<div class="text-slate-400">No recent transactions.</div>';
};

window.renderInvestmentTimers = function renderInvestmentTimers(investments = []) {
  const container = document.getElementById("active-investments");
  container.innerHTML = "";
  if (window.countdownTimer) clearInterval(window.countdownTimer);

  if (!investments.length) {
    container.innerHTML = '<div class="text-slate-500">No investments yet.</div>';
    return;
  }

  const draw = async () => {
    const now = Date.now();
    container.innerHTML = "";
    for (const inv of investments) {
      const endMs = new Date(inv.end_timestamp).getTime();
      const left = endMs - now;
      if (left <= 0 && inv.status !== "completed") {
        await window.supabaseClient.from("investments").update({ status: "completed" }).eq("id", inv.id);
        inv.status = "completed";
      }
      const canWithdrawAt = endMs + 86400000;
      const eligible = now >= canWithdrawAt;
      container.innerHTML += `<div class="rounded-xl border border-white/40 bg-white/40 p-3">
        <div class="flex flex-wrap justify-between gap-2">
          <div><b>Plan #${inv.plan_id}</b> • ${window.formatCurrency(inv.amount)}</div>
          <div class="text-sm ${inv.status === "completed" ? "text-emerald-700" : "text-blue-700"}">${inv.status === "completed" ? "Completed" : "Active"}</div>
        </div>
        <div class="text-sm mt-1">Timer: ${inv.status === "completed" ? "Completed" : window.formatTime(left)}</div>
        <div class="text-xs text-slate-600 mt-1">Withdraw ${eligible ? "enabled" : "available 1 day after completion"}</div>
      </div>`;
    }
  };

  draw();
  window.countdownTimer = setInterval(draw, 1000);
};

document.addEventListener("click", (event) => {
  if (!event.target.closest("#user-menu")) window.closeAllNavPopovers();
});

window.bindUPIPayButton();
window.renderPlans();
