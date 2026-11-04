
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
  ref,
  set,
  get
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-database.js";

import {
  auth,
  db,
  authPersistence
} from "./firebase.js";


document.addEventListener("DOMContentLoaded", async function () {

  const loginTab = document.getElementById("loginTab");
  const registerTab = document.getElementById("registerTab");

  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");

  const roleOptions = document.querySelectorAll(
    'input[name="accountType"]'
  );

  const loginMessage = document.getElementById("loginMessage");
  const registerMessage = document.getElementById("registerMessage");

  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");

  const fullName = document.getElementById("fullName");
  const registerEmail = document.getElementById("registerEmail");
  const phone = document.getElementById("phone");
  const registerPassword = document.getElementById("registerPassword");
  const confirmPassword = document.getElementById("confirmPassword");

  const forgotPassword = document.getElementById("forgotPassword");

  // WAIT FOR FIREBASE SESSION PERSISTENCE
  try {
    await authPersistence;
  } catch (error) {
    console.error("Session setup error:", error);
  }

  // SHOW MESSAGES
  function showMessage(element, message, success = false) {
    if (!element) return;

    element.textContent = message;
    element.style.color = success ? "#16834a" : "#d93025";
  }

  // GET SELECTED ACCOUNT TYPE
  function getSelectedRole() {
    const selected = document.querySelector(
      'input[name="accountType"]:checked'
    );

    return selected ? selected.value : "patient";
  }

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

  // URL PARAMETERS
  const params = new URLSearchParams(window.location.search);
  const accountType = params.get("type");
  const mode = params.get("mode");

  if (["patient", "doctor", "clinic"].includes(accountType)) {
    selectAccountType(accountType);
  }

  if (mode === "register") {
    showRegister();
  } else {
    showLogin();
  }

  // REDIRECT AFTER LOGIN
  function redirectByRole(role) {
    if (role === "clinic") {
      window.location.href = "clinic-dashboard.html";
    } else if (role === "doctor") {
      window.location.href = "doctor-dashboard.html";
    } else {
      window.location.href = "patient-dashboard.html";
    }
  }

  // REGISTRATION
  registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    showMessage(registerMessage, "Creating your account...");

    const name = fullName.value.trim();
    const email = registerEmail.value.trim();
    const mobile = phone.value.trim();
    const password = registerPassword.value;
    const confirm = confirmPassword.value;
    const role = getSelectedRole();

    if (password !== confirm) {
      showMessage(registerMessage, "Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      showMessage(registerMessage, "Password must contain at least 6 characters.");
      return;
    }

    try {
      await authPersistence;

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // Send email verification link
      await sendEmailVerification(user);

      // Create initial account profile
      const accountStatus = role === "patient" ? "active" : "pending";

      await set(ref(db, "users/" + user.uid), {
        uid: user.uid,
        fullName: name,
        email: email,
        phone: mobile,
        role: role,
        accountStatus: accountStatus,
        emailVerified: false,
        createdAt: Date.now()
      });

      showMessage(
        registerMessage,
        "Account created! Check your email and click the verification link before logging in.",
        true
      );

      await signOut(auth);

      registerForm.reset();

    } catch (error) {
      console.error("Registration error:", error);

      const messages = {
        "auth/email-already-in-use": "This email is already registered.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Please choose a stronger password.",
        "auth/network-request-failed": "Network error. Check your internet connection."
      };

      showMessage(
        registerMessage,
        messages[error.code] || error.message
      );
    }
  });

  // LOGIN
  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    showMessage(loginMessage, "Logging in...");

    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    const selectedRole = getSelectedRole();

    try {
      await authPersistence;

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      await user.reload();

      if (!user.emailVerified) {
        await signOut(auth);

        showMessage(
          loginMessage,
          "Please verify your email first. Check your inbox for the verification link."
        );

        return;
      }

      // Get account profile
      const snapshot = await get(
        ref(db, "users/" + user.uid)
      );

      if (!snapshot.exists()) {
        await signOut(auth);

        showMessage(
          loginMessage,
          "Account profile not found. Please contact CareBridge support."
        );

        return;
      }

      const profile = snapshot.val();

      // Check account type
      if (profile.role !== selectedRole) {
        await signOut(auth);

        showMessage(
          loginMessage,
          "You selected the wrong account type. Please select " +
          profile.role + " to continue."
        );

        return;
      }

      // Check account status
      if (profile.accountStatus === "rejected" ||
          profile.accountStatus === "suspended") {

        await signOut(auth);

        showMessage(
          loginMessage,
          "Your account is " + profile.accountStatus +
          ". Please contact CareBridge support."
        );

        return;
      }

      // Doctor and clinic approval check
      if (profile.role !== "patient" &&
          profile.accountStatus !== "approved") {

        await signOut(auth);

        showMessage(
          loginMessage,
          "Your account is awaiting CareBridge approval."
        );

        return;
      }

      redirectByRole(profile.role);

    } catch (error) {
      console.error("Login error:", error);

      const messages = {
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect email or password.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/too-many-requests": "Too many attempts. Please try again later."
      };

      showMessage(
        loginMessage,
        messages[error.code] || error.message
      );
    }
  });

  // FORGOT PASSWORD
  forgotPassword.addEventListener("click", async function (event) {
    event.preventDefault();

    const email = loginEmail.value.trim();

    if (!email) {
      showMessage(
        loginMessage,
        "Enter your email address first, then click Forgot Password."
      );

      loginEmail.focus();
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);

      showMessage(
        loginMessage,
        "Password reset link sent. Check your email.",
        true
      );

    } catch (error) {
      console.error("Password reset error:", error);

      showMessage(
        loginMessage,
        error.message
      );
    }
  });

  // EXISTING SESSION CHECK
  onAuthStateChanged(auth, async function (user) {
    if (!user) return;

    try {
      await user.reload();

      if (!user.emailVerified) return;

      const snapshot = await get(
        ref(db, "users/" + user.uid)
      );

      if (!snapshot.exists()) return;

      const profile = snapshot.val();

      if (profile.role === "patient" &&
          profile.accountStatus === "active") {
        redirectByRole("patient");
      }

      if ((profile.role === "doctor" || profile.role === "clinic") &&
          profile.accountStatus === "approved") {
        redirectByRole(profile.role);
      }

    } catch (error) {
      console.error("Session check error:", error);
    }
  });

});
