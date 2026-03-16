const { createClient } = supabase;
window.supabaseClient = createClient("https://vwsbxvpghoolfqyxyovf.supabase.co", "sb_publishable_ZJcZG3Eg1glLZ1dZp90i-g_vSlo1HKK");

window.currentUser = null;
window.authMode = "login";
window.visiblePublicPlans = 6;
window.visiblePrivatePlans = 4;
window.selectedPlan = null;
window.countdownTimer = null;
window.latestInvestments = [];
window.latestDepositRequests = [];

window.toggleAuthMode = function toggleAuthMode() {
  window.authMode = window.authMode === "login" ? "signup" : "login";
  window.updateAuthModal();
};

window.updateAuthModal = function updateAuthModal() {
  document.getElementById("auth-title").textContent = window.authMode === "login" ? "Login" : "Sign Up";
  document.getElementById("auth-submit").textContent = window.authMode === "login" ? "Login" : "Create Account";
  document.getElementById("auth-switch").textContent = window.authMode === "login" ? "Need an account? Sign Up" : "Already have an account? Login";
};

window.submitAuth = async function submitAuth(e) {
  e.preventDefault();
  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;
  const res = window.authMode === "login"
    ? await window.supabaseClient.auth.signInWithPassword({ email, password })
    : await window.supabaseClient.auth.signUp({ email, password });

  if (res.error) return alert(res.error.message);
  window.closeModal("auth");
  window.navigate("home");
};

window.logout = async function logout() {
  window.closeLogoutModal();
  await window.supabaseClient.auth.signOut();
};

window.updateProfileEmail = async function updateProfileEmail(e) {
  e.preventDefault();
  const email = document.getElementById("profile-new-email").value || document.getElementById("settings-new-email").value;
  const targets = ["profile-msg", "settings-msg"];
  if (!email) return targets.forEach(id => document.getElementById(id).textContent = "Please enter a new email.");
  const { error } = await window.supabaseClient.auth.updateUser({ email });
  const text = error ? error.message : "Email update requested. Check your inbox to confirm.";
  targets.forEach(id => document.getElementById(id).textContent = text);
  document.getElementById("profile-new-email").value = "";
  document.getElementById("settings-new-email").value = "";
};

window.updateProfilePassword = async function updateProfilePassword(e) {
  e.preventDefault();
  const password = document.getElementById("profile-new-password").value || document.getElementById("settings-new-password").value;
  const targets = ["profile-msg", "settings-msg"];
  if (!password) return targets.forEach(id => document.getElementById(id).textContent = "Please enter a password.");
  const { error } = await window.supabaseClient.auth.updateUser({ password });
  const text = error ? error.message : "Password updated successfully.";
  targets.forEach(id => document.getElementById(id).textContent = text);
  document.getElementById("profile-new-password").value = "";
  document.getElementById("settings-new-password").value = "";
};

window.supabaseClient.auth.onAuthStateChange(async (_, session) => {
  window.currentUser = session?.user || null;
  document.getElementById("public-view").classList.toggle("hidden", !!window.currentUser);
  document.getElementById("dashboard-view").classList.toggle("hidden", !window.currentUser);
  document.getElementById("guest-actions").classList.toggle("hidden", !!window.currentUser);
  document.getElementById("user-menu").classList.toggle("hidden", !window.currentUser);
  document.getElementById("user-menu").classList.toggle("flex", !!window.currentUser);

  if (window.currentUser) {
    document.body.classList.toggle("mobile-dashboard", window.matchMedia("(max-width: 768px)").matches);
    document.getElementById("welcome-name").textContent = window.currentUser.email.split("@")[0];
    document.getElementById("mobile-welcome-name").textContent = window.currentUser.email.split("@")[0];
    document.getElementById("profile-email").textContent = window.currentUser.email;
    document.getElementById("profile-user-id").textContent = `User ID: ${window.currentUser.id}`;
    await window.ensureWalletExists();
    await window.loadWallet();
    await window.fetchInvestments();
    await window.fetchDepositRequests();
    window.navigate("home");
  } else {
    document.body.classList.remove("mobile-dashboard");
    window.closeAllNavPopovers();
    window.closeLogoutModal();
    window.renderPlans();
    if (window.countdownTimer) clearInterval(window.countdownTimer);
  }
});
