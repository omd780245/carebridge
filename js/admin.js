
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import { auth, authPersistence, db } from "./firebase.js";

import {
  ref,
  get
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-database.js";

document.addEventListener("DOMContentLoaded", async function () {

  // ==========================================
  // LOGIN ELEMENTS
  // ==========================================

  const loginScreen = document.getElementById("adminLoginScreen");
  const adminLayout = document.getElementById("adminLayout");
  const loginForm = document.getElementById("adminLoginForm");
  const emailInput = document.getElementById("adminEmail");
  const passwordInput = document.getElementById("adminPassword");
  const loginButton = document.getElementById("adminLoginButton");
  const loginMessage = document.getElementById("adminLoginMessage");

  const logoutButton = document.getElementById("logoutButton");

  // ==========================================
  // LOGIN MESSAGE
  // ==========================================

  /**
 * @param {string} message
 */
function showLoginMessage(message) {
    if (loginMessage) {
      loginMessage.textContent = message;
    }
  }

  // ==========================================
  // SHOW LOGIN SCREEN
  // ==========================================

  function showLoginScreen() {
    if (loginScreen) {
      loginScreen.hidden = false;
    }

    if (adminLayout) {
      adminLayout.hidden = true;
    }
  }

  // ==========================================
  // SHOW ADMIN DASHBOARD
  // ==========================================

  function showAdminDashboard() {
    if (loginScreen) {
      loginScreen.hidden = true;
    }

    if (adminLayout) {
      adminLayout.hidden = false;
    }

    showSection("dashboard");
  }

  // ==========================================
  // FIREBASE AUTHENTICATION STATE
  // ==========================================

  showLoginScreen();

  try {
    await authPersistence;

    /**
 * @param {any} user
 */
/**
 * @param {any} user
 */
onAuthStateChanged(auth, async function (/** @type {any} */ user) {

      if (!user) {
        showLoginScreen();
        return;
      }

      try {
        // Read the authenticated user's administrator record.
const adminRef = ref(db, "admins/" + user.uid);
const adminSnapshot = await get(adminRef);

if (!adminSnapshot.exists()) {
  await signOut(auth);
  showLoginScreen();

  showLoginMessage(
    "This account does not have administrator permission."
  );

  return;
}

const adminData = adminSnapshot.val();

const isAuthorizedAdmin =
  adminData.role === "super_admin" &&
  adminData.status === "active";

if (!isAuthorizedAdmin) {
  await signOut(auth);
  showLoginScreen();

  showLoginMessage(
    "Administrator access is inactive or unauthorized."
  );

  return;
}

showAdminDashboard();

      } catch (error) {
        console.error("Admin authorization error:", error);

        await signOut(auth);
        showLoginScreen();

        showLoginMessage(
          "Unable to verify administrator permission. Please try again."
        );
      }

    });

  } catch (error) {
    console.error("Firebase initialization error:", error);

    showLoginScreen();

    showLoginMessage(
      "Firebase could not initialize. Please refresh the page."
    );
  }

  // ==========================================
  // ADMIN LOGIN FORM
  // ==========================================

  if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

      event.preventDefault();

      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email || !password) {
        showLoginMessage("Please enter your email and password.");
        return;
      }

      loginButton.disabled = true;
      loginButton.textContent = "Signing in...";
      showLoginMessage("");

      try {
        await authPersistence;

        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Authorization is checked by onAuthStateChanged.
        // Signing in alone does not grant admin access.

      } catch (error) {
        console.error("Admin login error:", error);

        if (error.code === "auth/invalid-credential") {
          showLoginMessage("Incorrect email or password.");
        } else if (error.code === "auth/too-many-requests") {
          showLoginMessage("Too many attempts. Try again later.");
        } else if (error.code === "auth/network-request-failed") {
          showLoginMessage("Network error. Check your internet connection.");
        } else {
          showLoginMessage("Login failed. Please try again.");
        }

      } finally {
        loginButton.disabled = false;
        loginButton.textContent = "Sign In to Dashboard";
      }

    });

  }

  // ==========================================
  // ADMIN DASHBOARD ELEMENTS
  // ==========================================

  const sidebar = document.getElementById("sidebar");
  const menuToggle = document.getElementById("menuToggle");
  const pageTitle = document.getElementById("pageTitle");

  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".admin-section");

  // ==========================================
  // SECTION TITLES
  // ==========================================

  const sectionTitles = {
    dashboard: "Dashboard",
    doctors: "Doctor Management",
    institutions: "Clinics & Hospitals",
    patients: "Patient Management",
    appointments: "Appointment Management",
    payments: "Payments & Finance",
    verification: "Verification Centre",
    reviews: "Reviews & Complaints",
    content: "Website Content",
    analytics: "Reports & Analytics",
    notifications: "Notifications",
    settings: "Platform Settings",
    admins: "Admin Access"
  };

  // ==========================================
  // SHOW SELECTED SECTION
  // ==========================================

  /**
   * @param {string} sectionId
   */
  function showSection(sectionId) {

    const selectedSection = document.getElementById(sectionId);

    if (!selectedSection) {
      console.warn("Admin section not found:", sectionId);
      return;
    }

    sections.forEach(function (section) {
      section.classList.remove("active");
    });

    navItems.forEach(function (item) {
      item.classList.remove("active");
    });

    selectedSection.classList.add("active");

    const activeItem = document.querySelector(
      '.nav-item[data-section="' + sectionId + '"]'
    );

    if (activeItem) {
      activeItem.classList.add("active");
    }

    if (pageTitle) {
      pageTitle.textContent =
        sectionTitles[sectionId] || "Dashboard";
    }

    if (sidebar) {
      sidebar.classList.remove("open");
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  // ==========================================
  // NAVIGATION EVENTS
  // ==========================================

  navItems.forEach(function (item) {

    item.addEventListener("click", function () {

      const sectionId = item.dataset.section;

      if (!sectionId) {
        console.warn("Navigation item has no data-section.");
        return;
      }

      showSection(sectionId);

    });

  });

  // ==========================================
  // DASHBOARD QUICK LINKS
  // ==========================================

  const quickLinks = document.querySelectorAll("[data-open]");

  quickLinks.forEach(function (button) {

    button.addEventListener("click", function () {

      const sectionId = button.dataset.open;

      if (!sectionId) {
        console.warn("Quick link has no data-open value.");
        return;
      }

      showSection(sectionId);

    });

  });

  // ==========================================
  // MOBILE SIDEBAR TOGGLE
  // ==========================================

  if (menuToggle && sidebar) {

    menuToggle.addEventListener("click", function () {

      const isOpen = sidebar.classList.toggle("open");

      menuToggle.setAttribute(
        "aria-expanded",
        String(isOpen)
      );

      menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Close sidebar" : "Open sidebar"
      );

    });

  }

  // ==========================================
  // CLOSE SIDEBAR WHEN CLICKING OUTSIDE
  // ==========================================

  document.addEventListener("click", function (event) {

    if (!sidebar || !menuToggle) return;

    if (
      window.innerWidth <= 760 &&
      sidebar.classList.contains("open") &&
      event.target instanceof Node &&
      !sidebar.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {

      sidebar.classList.remove("open");

      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open sidebar");

    }

  });

  // ==========================================
  // CURRENT DATE
  // ==========================================

  const currentDate = document.getElementById("currentDate");

  if (currentDate) {

    currentDate.textContent = new Date().toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );

  }

  // ==========================================
  // ADMIN LOGOUT
  // ==========================================

  if (logoutButton) {

    logoutButton.addEventListener("click", async function () {

      try {
        await signOut(auth);
        showLoginMessage("You have been signed out.");

      } catch (error) {
        console.error("Logout error:", error);
        alert("Unable to sign out. Please try again.");
      }

    });

  }

  // ==========================================
  // SEARCH INPUT PREPARATION
  // ==========================================

  const searchInputs = [
    "doctorSearch",
    "institutionSearch",
    "patientSearch",
    "appointmentSearch"
  ];

  searchInputs.forEach(function (inputId) {

    const input = document.getElementById(inputId);

    if (!input) return;

    input.addEventListener("input", function () {
      // Database search will be connected later.
    });

  });

  // ==========================================
  // STATUS FILTER PREPARATION
  // ==========================================

  const filterIds = [
    "doctorStatusFilter",
    "institutionStatusFilter",
    "appointmentStatusFilter",
    "verificationType",
    "verificationStatus"
  ];

  filterIds.forEach(function (filterId) {

    const filter = document.getElementById(filterId);

    if (!filter) return;

    filter.addEventListener("change", function () {
      // Database filtering will be connected later.
    });

  });

});
