
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
  ref,
  get,
  set
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-database.js";

import {
  auth,
  db,
  authPersistence
} from "./firebase.js";


document.addEventListener("DOMContentLoaded", async function () {

  // =====================================
  // 1. ELEMENTS AND FIREBASE SESSION
  // =====================================

  const profileForm = document.getElementById("clinicProfileForm");
  const editSection = document.getElementById("editProfileSection");
  const openEditButton = document.getElementById("openProfileEdit");
  const cancelButton = document.getElementById("cancelProfileEdit");

  const totalElement = document.getElementById("totalDoctors");
  const approvedElement = document.getElementById("approvedDoctors");
  const pendingElement = document.getElementById("pendingDoctors");

  const nameDisplay = document.getElementById("institutionName");
  const typeDisplay = document.getElementById("institutionType");
  const addressDisplay = document.getElementById("institutionAddress");
  const phoneDisplay = document.getElementById("institutionPhone");
  const emailDisplay = document.getElementById("institutionEmail");
  const hoursDisplay = document.getElementById("institutionHours");

  const fields = {
    name: document.getElementById("profileName"),
    type: document.getElementById("profileType"),
    registration: document.getElementById("profileRegistration"),
    phone: document.getElementById("profilePhone"),
    email: document.getElementById("profileEmail"),
    city: document.getElementById("profileCity"),
    pincode: document.getElementById("profilePincode"),
    address: document.getElementById("profileAddress"),
    description: document.getElementById("profileDescription"),
    services: document.getElementById("profileServices"),
    opening: document.getElementById("profileOpening"),
    closing: document.getElementById("profileClosing")
  };

  const logoInput = document.getElementById("profileLogo");
  const logoPreview = document.getElementById("logoPreview");
  const logoDisplay = document.getElementById("institutionLogoDisplay");
  const defaultLogoIcon = document.getElementById("defaultLogoIcon");

  let currentUser = null;
  let institutionData = null;
  let selectedLogoFile = null;
  let previewURL = null;
  let savedLogoURL = null;

  // =====================================
  // 2. LOGOUT
  // =====================================

  window.logout = async function () {
    try {
      await signOut(auth);
      window.location.replace("login.html");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Unable to log out. Please try again.");
    }
  };

  // =====================================
  // 3. DOCTOR COUNTERS
  // TEMPORARY: LOCAL STORAGE
  // =====================================

  function loadDoctorCounters() {
    let doctors = [];

    try {
      doctors = JSON.parse(
        localStorage.getItem("carebridgeDoctors")
      ) || [];
    } catch (error) {
      console.error("Doctor counter error:", error);
    }

    const activeDoctors = doctors.filter(function (doctor) {
      return doctor.institutionStatus !== "removed";
    });

    if (totalElement) {
      totalElement.textContent = activeDoctors.length;
    }

    if (approvedElement) {
      approvedElement.textContent = activeDoctors.filter(function (doctor) {
        return doctor.status === "approved";
      }).length;
    }

    if (pendingElement) {
      pendingElement.textContent = activeDoctors.filter(function (doctor) {
        return doctor.status === "pending";
      }).length;
    }
  }

  loadDoctorCounters();

  // =====================================
  // 4. PROFILE DISPLAY
  // =====================================

  function updateProfileDisplay(profile) {

    if (nameDisplay) {
      nameDisplay.textContent =
        profile.institutionName || "Your Clinic / Hospital Name";
    }

    if (typeDisplay) {
      typeDisplay.textContent =
        profile.institutionType || "Clinic / Hospital";
    }

    if (addressDisplay) {
      const addressParts = [
        profile.address,
        profile.area,
        profile.city,
        profile.pincode
      ].filter(Boolean);

      addressDisplay.textContent =
        addressParts.length
          ? addressParts.join(", ")
          : "Address not added yet";
    }

    if (phoneDisplay) {
      phoneDisplay.textContent =
        profile.phone || "Phone number not added yet";
    }

    if (emailDisplay) {
      emailDisplay.textContent =
        profile.email || "Email not added yet";
    }

    if (hoursDisplay) {
      hoursDisplay.textContent =
        profile.opening && profile.closing
          ? profile.opening + " – " + profile.closing
          : profile.openingHours || "Operating hours not added yet";
    }

    const status = profile.approvalStatus || "pending";

    document.querySelectorAll(".status-badge, .profile-status")
      .forEach(function (element) {
        element.textContent =
          status.charAt(0).toUpperCase() + status.slice(1);
      });
  }

  // =====================================
  // 5. FILL PROFILE FORM
  // =====================================

  function getSelectedDays() {
    return Array.from(
      document.querySelectorAll(
        'input[name="profileDays"]:checked'
      )
    ).map(function (checkbox) {
      return checkbox.value;
    });
  }

  function setSelectedDays(days) {
    document.querySelectorAll(
      'input[name="profileDays"]'
    ).forEach(function (checkbox) {
      checkbox.checked = Array.isArray(days) &&
        days.includes(checkbox.value);
    });
  }

  function fillProfileForm(profile) {

    const changes = profile.pendingChanges || {};

    // Show pending changes in the editor when they exist.
    const data = {
      ...profile,
      ...changes
    };

    fields.name.value = data.institutionName || "";
    fields.type.value = data.institutionType || "";
    fields.registration.value = data.registrationNumber || "";
    fields.phone.value = data.phone || "";
    fields.email.value = data.email || "";
    fields.city.value = data.city || "";
    fields.pincode.value = data.pincode || "";
    fields.address.value = data.address || "";
    fields.description.value = data.description || "";
    fields.services.value = data.services || data.specialties || "";
    fields.opening.value = data.opening || "";
    fields.closing.value = data.closing || "";

    setSelectedDays(data.days || []);
  }

  // =====================================
  // 6. PROFILE EDITOR
  // =====================================

  function openProfileEditor() {

    if (!institutionData) return;

    fillProfileForm(institutionData);

    editSection.hidden = false;

    editSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function closeProfileEditor() {

    editSection.hidden = true;

    if (institutionData) {
      fillProfileForm(institutionData);
    }

    selectedLogoFile = null;

    if (logoInput) {
      logoInput.value = "";
    }

    if (previewURL) {
      URL.revokeObjectURL(previewURL);
      previewURL = null;
    }

    loadSavedLogo();

    document.getElementById("clinicProfile").scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  if (openEditButton) {
    openEditButton.addEventListener("click", openProfileEditor);
  }

  if (cancelButton) {
    cancelButton.addEventListener("click", closeProfileEditor);
  }

  // =====================================
  // 7. LOGO PREVIEW
  // TEMPORARY LOCAL PREVIEW ONLY
  // =====================================

  function showLogo(imageURL) {

    if (!logoDisplay || !defaultLogoIcon) return;

    logoDisplay.src = imageURL;
    logoDisplay.hidden = false;
    defaultLogoIcon.hidden = true;
  }

  function showDefaultLogo() {

    if (!logoDisplay || !defaultLogoIcon) return;

    logoDisplay.hidden = true;
    logoDisplay.removeAttribute("src");
    defaultLogoIcon.hidden = false;
  }

  function openLogoDatabase() {

    return new Promise(function (resolve, reject) {

      const request = indexedDB.open("CareBridgeAssets", 1);

      request.onupgradeneeded = function (event) {

        const database = event.target.result;

        if (!database.objectStoreNames.contains("images")) {
          database.createObjectStore("images");
        }
      };

      request.onsuccess = function () {
        resolve(request.result);
      };

      request.onerror = function () {
        reject(request.error);
      };
    });
  }

  async function saveLogoToDatabase(file) {

    const database = await openLogoDatabase();

    return new Promise(function (resolve, reject) {

      const transaction = database.transaction(
        "images",
        "readwrite"
      );

      transaction.objectStore("images").put(file, "clinicLogo");

      transaction.oncomplete = function () {
        database.close();
        resolve();
      };

      transaction.onerror = function () {
        database.close();
        reject(transaction.error);
      };
    });
  }

  async function getSavedLogo() {

    const database = await openLogoDatabase();

    return new Promise(function (resolve, reject) {

      const transaction = database.transaction(
        "images",
        "readonly"
      );

      const request = transaction.objectStore("images").get("clinicLogo");

      request.onsuccess = function () {
        const result = request.result || null;
        database.close();
        resolve(result);
      };

      request.onerror = function () {
        database.close();
        reject(request.error);
      };
    });
  }

  async function loadSavedLogo() {

    try {

      const logoBlob = await getSavedLogo();

      if (savedLogoURL) {
        URL.revokeObjectURL(savedLogoURL);
        savedLogoURL = null;
      }

      if (logoBlob) {

        savedLogoURL = URL.createObjectURL(logoBlob);

        showLogo(savedLogoURL);

        if (logoPreview) {
          logoPreview.src = savedLogoURL;
          logoPreview.hidden = false;
        }

      } else {

        showDefaultLogo();

        if (logoPreview) {
          logoPreview.hidden = true;
        }
      }

    } catch (error) {

      console.error("Logo loading error:", error);
      showDefaultLogo();
    }
  }

  if (logoInput) {

    logoInput.addEventListener("change", function () {

      const file = logoInput.files[0];

      if (!file) return;

      const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/webp"
      ];

      if (!allowedTypes.includes(file.type)) {
        alert("Please select a PNG, JPG or WebP image.");
        logoInput.value = "";
        selectedLogoFile = null;
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        alert("Logo size must not exceed 2 MB.");
        logoInput.value = "";
        selectedLogoFile = null;
        return;
      }

      selectedLogoFile = file;

      if (previewURL) {
        URL.revokeObjectURL(previewURL);
      }

      previewURL = URL.createObjectURL(file);

      if (logoPreview) {
        logoPreview.src = previewURL;
        logoPreview.hidden = false;
      }
    });
  }

  // =====================================
  // 8. SAVE PROFILE CHANGES TO FIREBASE
  // =====================================

  if (profileForm) {

    profileForm.addEventListener("submit", async function (event) {

      event.preventDefault();

      if (!currentUser || !institutionData) {
        alert("Your institution account is not loaded.");
        return;
      }

      const days = getSelectedDays();

      if (days.length === 0) {
        alert("Please select at least one operating day.");
        return;
      }

      if (fields.opening.value >= fields.closing.value) {
        alert("Closing time must be later than opening time.");
        return;
      }

      const pincode = fields.pincode.value.trim();

      if (!/^[0-9]{6}$/.test(pincode)) {
        alert("Please enter a valid 6-digit PIN code.");
        return;
      }

      const pendingChanges = {

        institutionName: fields.name.value.trim(),
        institutionType: fields.type.value,
        registrationNumber: fields.registration.value.trim(),
        phone: fields.phone.value.trim(),
        email: fields.email.value.trim(),
        city: fields.city.value.trim(),
        area: institutionData.area || "",
        pincode: pincode,
        address: fields.address.value.trim(),
        description: fields.description.value.trim(),
        services: fields.services.value.trim(),
        opening: fields.opening.value,
        closing: fields.closing.value,
        days: days,
        updatedAt: Date.now()

      };

      const saveButton = profileForm.querySelector(
        'button[type="submit"]'
      );

      if (saveButton) {
        saveButton.disabled = true;
        saveButton.textContent = "Submitting...";
      }

      try {

        if (selectedLogoFile) {
          await saveLogoToDatabase(selectedLogoFile);
        }

        await set(
          ref(db, "institutions/" + currentUser.uid + "/pendingChanges"),
          pendingChanges
        );

        institutionData.pendingChanges = pendingChanges;

        alert(
          "Profile changes submitted successfully. " +
          "They will be visible publicly after Super Admin approval."
        );

        editSection.hidden = true;

        fillProfileForm(institutionData);

        if (selectedLogoFile) {

          if (previewURL) {
            URL.revokeObjectURL(previewURL);
            previewURL = null;
          }

          selectedLogoFile = null;

          await loadSavedLogo();
        }

        document.getElementById("clinicProfile").scrollIntoView({
          behavior: "smooth",
          block: "center"
        });

      } catch (error) {

        console.error("Profile save error:", error);

        alert(
          "Could not submit your profile changes. " +
          "Please try again. Error: " + error.message
        );

      } finally {

        if (saveButton) {
          saveButton.disabled = false;
          saveButton.textContent = "Save Profile Changes";
        }
      }
    });
  }

  // =====================================
  // 9. LOAD INSTITUTION FROM FIREBASE
  // =====================================

  async function loadInstitution(user) {

    if (!user.emailVerified) {
      await signOut(auth);
      window.location.replace("login.html");
      return;
    }

    const snapshot = await get(
      ref(db, "institutions/" + user.uid)
    );

    if (!snapshot.exists()) {
      await signOut(auth);
      alert("No clinic registration was found for this account.");
      window.location.replace("login.html");
      return;
    }

    institutionData = snapshot.val();

    if (institutionData.uid !== user.uid) {
      await signOut(auth);
      window.location.replace("login.html");
      return;
    }

    if (
      institutionData.approvalStatus === "rejected" ||
      institutionData.approvalStatus === "suspended"
    ) {
      await signOut(auth);
      alert("Your institution account is " +
        institutionData.approvalStatus + ".");
      window.location.replace("login.html");
      return;
    }

    if (
      !["pending", "approved"].includes(
        institutionData.approvalStatus
      )
    ) {
      await signOut(auth);
      window.location.replace("login.html");
      return;
    }

    updateProfileDisplay(institutionData);
    fillProfileForm(institutionData);

    await loadSavedLogo();
  }

  // =====================================
  // 10. AUTHENTICATION CHECK
  // =====================================

  try {
    await authPersistence;
  } catch (error) {
    console.error("Firebase persistence error:", error);
  }

  onAuthStateChanged(auth, async function (user) {

    if (!user) {
      window.location.replace("login.html");
      return;
    }

    currentUser = user;

    try {

      await user.reload();

      await loadInstitution(user);

    } catch (error) {

      console.error("Dashboard loading error:", error);

      alert(
        "Unable to load your clinic dashboard. " +
        "Please try again. Error: " + error.message
      );
    }
  });

});
