window.renderDepositHistory = function (requests = []) {
  const total = requests
    .filter(r => r.status === "approved")
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  document.getElementById("deposit-total").textContent =
    window.formatCurrency(total);

  const box = document.getElementById("deposit-history");
  if (!box) return;

  box.innerHTML =
    requests.slice(0, 6).map(r => `
      <div class="flex justify-between text-sm">
        <span>${r.status}</span>
        <span>${window.formatCurrency(r.amount)}</span>
      </div>
    `).join("") || `<div>No deposit requests yet</div>`;
};

window.fetchDepositRequests = async function () {
  if (!window.currentUser) return;

  const { data } = await window.supabaseClient
    .from("deposit_requests")
    .select("*")
    .eq("user_id", window.currentUser.id)
    .order("created_at", { ascending: false });

  window.latestDepositRequests = data || [];
  window.renderDepositHistory(window.latestDepositRequests);
};

window.submitDepositRequest = async function (e) {
  if (e) e.preventDefault();

  const amount = parseFloat(document.getElementById("manual-deposit-amount").value);
  const utr = document.getElementById("manual-deposit-utr").value.trim();
  const msg = document.getElementById("deposit-msg");

  msg.textContent = "";

  if (!window.currentUser) {
    msg.textContent = "Login required";
    return;
  }

  if (!amount || amount <= 0) {
    msg.textContent = "Invalid amount";
    return;
  }

  if (!utr || utr.length < 10) {
    msg.textContent = "Invalid UTR";
    return;
  }

  const { error } = await window.supabaseClient
    .from("deposit_requests")
    .insert({
      user_id: window.currentUser.id,
      amount,
      utr,
      status: "pending"
    });

  if (error) {
    msg.textContent = error.message;
    return;
  }

  msg.textContent = "Deposit request submitted";

  document.getElementById("manual-deposit-amount").value = "";
  document.getElementById("manual-deposit-utr").value = "";

  window.fetchDepositRequests();
};
