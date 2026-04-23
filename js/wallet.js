window.ensureWalletExists = async function ensureWalletExists() {
  const { data } = await window.supabaseClient.from("wallet").select("id").eq("user_id", window.currentUser.id).maybeSingle();
  if (!data) await window.supabaseClient.from("wallet").insert({ user_id: window.currentUser.id, balance: 0 });
};

window.loadWallet = async function loadWallet() {
  if (!window.currentUser) return;
  const { data } = await window.supabaseClient.from("wallet").select("balance").eq("user_id", window.currentUser.id).single();
  const formatted = window.formatCurrency(data?.balance || 0);
  document.getElementById("wallet-balance").textContent = formatted;
  document.getElementById("wallet-balance-mobile").textContent = formatted;
};
