
document.addEventListener("DOMContentLoaded", function () {

  // =====================================
  // 1. DOCTOR DASHBOARD COUNTERS
  // =====================================

  const DOCTOR_STORAGE_KEY = "carebridgeDoctors";

  let doctors = [];

  try {
    doctors = JSON.parse(
      localStorage.getItem(DOCTOR_STORAGE_KEY)
    ) || [];
  } catch (error) {
    doctors = [];
  }

  const activeDoctors = doctors.filter(function (doctor) {
    return doctor.institutionStatus !== "removed";
  });

  const total = activeDoctors.length;

  const approved = activeDoctors.filter(function (doctor) {
    return doctor.status === "approved";
  }).length;

  const pending = activeDoctors.filter(function (doctor) {
    return doctor.status === "pending";
  }).length;

  const totalElement = document.getElementById("totalDoctors");
  const approvedElement = document.getElementById("approvedDoctors");
  const pendingElement = document.getElementById("pendingDoctors");

  if (totalElement) totalElement.textContent = total;
  if (approvedElement) approvedElement.textContent = approved;
  if (pendingElement) pendingElement.textContent = pending;


  // =====================================
  // 2. CLINIC / HOSPITAL PROFILE
  // =====================================

  const PROFILE_STORAGE_KEY = "carebridgeClinicProfile";

  const profileForm = document.getElementById("clinicProfileForm");
  const editSection = document.getElementById("editProfileSection");
  const openEditButton = document.getElementById("openProfileEdit");
  const cancelButton = document.getElementById("cancelProfileEdit");

  if (!profileForm || !editSection || !openEditButton || !cancelButton) {
    return;
  }

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

  const nameDisplay = document.getElementById("institutionName");
  const typeDisplay = document.getElementById("institutionType");
  const addressDisplay = document.getElementById("institutionAddress");
  const phoneDisplay = document.getElementById("institutionPhone");
  const emailDisplay = document.getElementById("institutionEmail");
  const hoursDisplay = document.getElementById("institutionHours");

  // =====================================
  // 3. LOGO STORAGE (INDEXEDDB)
  // =====================================

  const logoInput = document.getElementById("profileLogo");
  const logoPreview = document.getElementById("logoPreview");
  const logoDisplay = document.getElementById("institutionLogoDisplay");
  const defaultLogoIcon = document.getElementById("defaultLogoIcon");

  let selectedLogoFile = null;
  let previewURL = null;
  let savedLogoURL = null;

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

  async function loadSavedLogo() {

    try {

      const logoBlob = await getSavedLogo();

      if (logoBlob) {

        savedLogoURL = URL.createObjectURL(logoBlob);

        showLogo(savedLogoURL);

        if (logoPreview) {
          logoPreview.src = savedLogoURL;
          logoPreview.hidden = false;
        }

      } else {

        showDefaultLogo();

      }

    } catch (error) {

      console.error("Could not load clinic logo:", error);

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
  // 4. PROFILE STORAGE AND DISPLAY
  // =====================================

  function getProfile() {

    try {

      return JSON.parse(
        localStorage.getItem(PROFILE_STORAGE_KEY)
      ) || {};

    } catch (error) {

      return {};

    }
  }

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

      checkbox.checked = (days || []).includes(checkbox.value);

    });

  }

  function updateProfileDisplay(profile) {

    if (nameDisplay) {
      nameDisplay.textContent =
        profile.name || "Your Clinic / Hospital Name";
    }

    if (typeDisplay) {
      typeDisplay.textContent =
        profile.type || "Clinic / Hospital";
    }

    if (addressDisplay) {
      addressDisplay.textContent =
        profile.address
          ? profile.address + ", " + (profile.city || "") +
            " - " + (profile.pincode || "")
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
          : "Operating hours not added yet";
    }

  }

  function fillProfileForm(profile) {

    fields.name.value = profile.name || "";
    fields.type.value = profile.type || "";
    fields.registration.value = profile.registration || "";
    fields.phone.value = profile.phone || "";
    fields.email.value = profile.email || "";
    fields.city.value = profile.city || "";
    fields.pincode.value = profile.pincode || "";
    fields.address.value = profile.address || "";
    fields.description.value = profile.description || "";
    fields.services.value = profile.services || "";
    fields.opening.value = profile.opening || "";
    fields.closing.value = profile.closing || "";

    setSelectedDays(profile.days || []);

  }

  function openProfileEditor() {

    const profile = getProfile();

    fillProfileForm(profile);

    editSection.hidden = false;

    editSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }

  function closeProfileEditor() {

    editSection.hidden = true;

    fillProfileForm(getProfile());

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

  openEditButton.addEventListener("click", openProfileEditor);

  cancelButton.addEventListener("click", closeProfileEditor);


  // =====================================
  // 5. SAVE PROFILE INFORMATION
  // =====================================

  profileForm.addEventListener("submit", async function (event) {

    event.preventDefault();

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

    const profile = {

      name: fields.name.value.trim(),
      type: fields.type.value,
      registration: fields.registration.value.trim(),
      phone: fields.phone.value.trim(),
      email: fields.email.value.trim(),
      city: fields.city.value.trim(),
      pincode: pincode,
      address: fields.address.value.trim(),
      description: fields.description.value.trim(),
      services: fields.services.value.trim(),
      opening: fields.opening.value,
      closing: fields.closing.value,
      days: days

    };

    try {

      if (selectedLogoFile) {
        await saveLogoToDatabase(selectedLogoFile);
      }

      localStorage.setItem(
        PROFILE_STORAGE_KEY,
        JSON.stringify(profile)
      );

    } catch (error) {

      console.error("Profile save error:", error);

      alert("Could not save the profile or logo. Please try again.");
      return;

    }

    updateProfileDisplay(profile);

    if (selectedLogoFile) {

      if (previewURL) {
        URL.revokeObjectURL(previewURL);
        previewURL = null;
      }

      selectedLogoFile = null;

      await loadSavedLogo();

    }

    editSection.hidden = true;

    alert("Clinic / Hospital profile saved successfully.");

    document.getElementById("clinicProfile").scrollIntoView({
      behavior: "smooth",
      block: "center"
    });

  });


  // =====================================
  // 6. LOAD SAVED PROFILE AND LOGO
  // =====================================

  const savedProfile = getProfile();

  updateProfileDisplay(savedProfile);

  fillProfileForm(savedProfile);

  loadSavedLogo();

});
