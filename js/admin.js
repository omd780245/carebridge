
document.addEventListener("DOMContentLoaded", function () {

  // ELEMENTS
  const sidebar = document.getElementById("sidebar");
  const menuToggle = document.getElementById("menuToggle");
  const navItems = document.querySelectorAll(".nav-item");
  const sections = document.querySelectorAll(".admin-section");
  const pageTitle = document.getElementById("pageTitle");

  // SECTION TITLES
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

  // SHOW SELECTED SECTION
  function showSection(sectionId) {

    const selectedSection = document.getElementById(sectionId);

    if (!selectedSection) return;

    // Hide all sections
    sections.forEach(function (section) {
      section.classList.remove("active");
    });

    // Remove active navigation style
    navItems.forEach(function (item) {
      item.classList.remove("active");
    });

    // Show selected section
    selectedSection.classList.add("active");

    // Highlight selected navigation item
    const activeItem = document.querySelector(
      '.nav-item[data-section="' + sectionId + '"]'
    );

    if (activeItem) {
      activeItem.classList.add("active");
    }

    // Update page title
    pageTitle.textContent = sectionTitles[sectionId] || "Dashboard";

    // Close mobile sidebar
    sidebar.classList.remove("open");

    // Scroll to top
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  // NAVIGATION EVENTS
  navItems.forEach(function (item) {

    item.addEventListener("click", function () {

      const sectionId = item.dataset.section;

      showSection(sectionId);

    });

  });

  // DASHBOARD QUICK LINKS
  document.querySelectorAll("[data-open]").forEach(function (button) {

    button.addEventListener("click", function () {

      showSection(button.dataset.open);

    });

  });

  // MOBILE SIDEBAR TOGGLE
  if (menuToggle) {

    menuToggle.addEventListener("click", function () {

      sidebar.classList.toggle("open");

    });

  }

  // CLOSE SIDEBAR WHEN CLICKING OUTSIDE
  document.addEventListener("click", function (event) {

    if (
      window.innerWidth <= 760 &&
      sidebar.classList.contains("open") &&
      !sidebar.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {

      sidebar.classList.remove("open");

    }

  });

  // CURRENT DATE
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

  // LOGOUT PLACEHOLDER
  const logoutButton = document.getElementById("logoutButton");

  if (logoutButton) {

    logoutButton.addEventListener("click", function () {

      alert(
        "Admin authentication is not connected yet. Logout will be enabled after Firebase admin authentication is implemented."
      );

    });

  }

  // SEARCH INPUT PREPARATION
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

      // Firebase search will be connected later.
      console.log(
        "Search entered in " + inputId + ": " + input.value
      );

    });

  });

  // STATUS FILTER PREPARATION
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
      console.log(
        "Filter changed: " + filterId + " = " + filter.value
      );

    });

  });

  // INITIAL SECTION
  showSection("dashboard");

});
