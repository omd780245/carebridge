
document.addEventListener("DOMContentLoaded", function () {

  const loginTab = document.getElementById("loginTab");
  const registerTab = document.getElementById("registerTab");

  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  const roleOptions = document.querySelectorAll(
    'input[name="accountType"]'
  );

  // SHOW LOGIN FORM
  function showLogin() {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");

    loginTab.classList.add("active");
    registerTab.classList.remove("active");
  }

  // SHOW REGISTRATION FORM
  function showRegister() {
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");

    registerTab.classList.add("active");
    loginTab.classList.remove("active");
  }

  // ACCOUNT TYPE SELECTION
  function selectAccountType(type) {
    const selectedOption = document.querySelector(
      'input[name="accountType"][value="' + type + '"]'
    );

    if (!selectedOption) return;

    selectedOption.checked = true;

    document.querySelectorAll(".role-option").forEach(function (label) {
      label.classList.remove("active");
    });

    selectedOption.closest(".role-option").classList.add("active");
  }

  // ROLE SELECTION EVENTS
  roleOptions.forEach(function (option) {
    option.addEventListener("change", function () {

      document.querySelectorAll(".role-option").forEach(function (label) {
        label.classList.remove("active");
      });

      option.closest(".role-option").classList.add("active");

    });
  });

  // TAB EVENTS
  loginTab.addEventListener("click", showLogin);
  registerTab.addEventListener("click", showRegister);

  // READ URL PARAMETERS
  const params = new URLSearchParams(window.location.search);

  const accountType = params.get("type");
  const mode = params.get("mode");

  // AUTOMATICALLY SELECT ACCOUNT TYPE
  if (["patient", "doctor", "clinic"].includes(accountType)) {
    selectAccountType(accountType);
  }

  // AUTOMATICALLY OPEN CORRECT TAB
  if (mode === "register") {
    showRegister();
  } else {
    showLogin();
  }

  // DEMO LOGIN SUBMISSION
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    alert("Login is not connected yet. Firebase authentication will be added later.");
  });

  // DEMO REGISTRATION SUBMISSION
  registerForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    alert("Account registration is not connected yet. Firebase authentication will be added later.");
  });

  // FORGOT PASSWORD
  document.getElementById("forgotPassword").addEventListener("click", function (event) {
    event.preventDefault();

    alert("Password recovery will be available after Firebase authentication is connected.");
  });

});
