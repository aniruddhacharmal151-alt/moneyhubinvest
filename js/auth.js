window.currentUser = null;
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
  const title = document.getElementById("auth-title");
  const button = document.getElementById("auth-submit");

  if (window.authMode === "login") {
    title.textContent = "Login";
    button.textContent = "Login";
  } else {
    title.textContent = "Sign Up";
    button.textContent = "Sign Up";
  }
};

window.submitAuth = async function submitAuth(e) {
  e.preventDefault();

  const email = document.getElementById("auth-email").value;
  const password = document.getElementById("auth-password").value;

  let result;

  if (window.authMode === "login") {
    result = await window.supabaseClient.auth.signInWithPassword({
      email,
      password
    });
  } else {
    result = await window.supabaseClient.auth.signUp({
      email,
      password
    });
  }

  if (result.error) {
    alert(result.error.message);
  } else {
    alert("Success!");
    document.getElementById("auth-modal").classList.add("hidden");
  }
};

window.updateProfileEmail = async function updateProfileEmail(e) {
  e.preventDefault();

  const email = document.getElementById("settings-new-email").value;

  const { error } = await window.supabaseClient.auth.updateUser({
    email: email
  });

  document.getElementById("settings-msg").textContent =
    error ? error.message : "Email updated!";
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
    }
  } else {
  if (typeof attachPlanButtons === "function") {
  attachPlanButtons();
    document.body.classList.remove("mobile-dashboard");
    window.closeAllNavPopovers();
    window.closeLogoutModal();
    window.renderPlans();
    if (window.countdownTimer) clearInterval(window.countdownTimer);
  }
});
