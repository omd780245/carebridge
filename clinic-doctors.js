// ==========================================
// ADD / EDIT DOCTOR
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

  const form = document.getElementById("addDoctorForm");

  if (!form) return;

  const STORAGE_KEY = "carebridgeDoctors";
  const params = new URLSearchParams(window.location.search);
  const editId = params.get("edit");

  let doctors = [];

  try {
    doctors = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (error) {
    alert("Could not read saved doctor records.");
    return;
  }

  let editingDoctor = null;

  // Load existing doctor details when editing
  if (editId) {

    editingDoctor = doctors.find(function (doctor) {
      return doctor.id === editId &&
        doctor.institutionStatus !== "removed";
    });

    if (!editingDoctor) {
      alert("Doctor record not found.");
      window.location.href = "manage-doctors.html";
      return;
    }

    const details = editingDoctor.pendingChanges || editingDoctor;

    document.getElementById("doctorName").value = details.name || "";
    document.getElementById("doctorPhone").value = details.phone || "";
    document.getElementById("doctorEmail").value = details.email || "";

    document.getElementById("registrationNumber").value =
      details.registrationNumber || "";

    document.getElementById("qualification").value =
      details.qualification || "";

    document.getElementById("specialty").value =
      details.specialty || "";

    document.getElementById("experience").value =
      details.experience || "";

    document.getElementById("consultationFee").value =
      details.consultationFee || "";

    document.getElementById("startTime").value =
      details.startTime || "";

    document.getElementById("endTime").value =
      details.endTime || "";

    document.querySelectorAll(
      'input[name="availableDays"]'
    ).forEach(function (checkbox) {

      checkbox.checked = (details.availableDays || []).includes(
        checkbox.value
      );

    });

    document.querySelector("h1").textContent = "Edit Doctor";

    const submitButton = form.querySelector(".submit-btn");

    if (submitButton) {
      submitButton.textContent = "Save Doctor Changes";
    }

  }

  // Submit doctor form
  form.addEventListener("submit", function (event) {

    event.preventDefault();

    const doctorDetails = {

      name: document.getElementById("doctorName").value.trim(),

      phone: document.getElementById("doctorPhone").value.trim(),

      email: document.getElementById("doctorEmail").value.trim(),

      registrationNumber: document.getElementById(
        "registrationNumber"
      ).value.trim(),

      qualification: document.getElementById(
        "qualification"
      ).value.trim(),

      specialty: document.getElementById("specialty").value.trim(),

      experience: document.getElementById("experience").value,

      consultationFee: document.getElementById(
        "consultationFee"
      ).value,

      availableDays: Array.from(
        document.querySelectorAll(
          'input[name="availableDays"]:checked'
        )
      ).map(function (checkbox) {
        return checkbox.value;
      }),

      startTime: document.getElementById("startTime").value,

      endTime: document.getElementById("endTime").value

    };

    // Validate available days
    if (doctorDetails.availableDays.length === 0) {
      alert("Please select at least one available day.");
      return;
    }

    // Validate working hours
    if (
      !doctorDetails.startTime ||
      !doctorDetails.endTime ||
      doctorDetails.startTime >= doctorDetails.endTime
    ) {
      alert("Ending time must be later than starting time.");
      return;
    }

    // Prevent duplicate medical registration numbers
    const registrationNumber = doctorDetails.registrationNumber.toLowerCase();

    const duplicate = doctors.some(function (doctor) {

      return doctor.institutionStatus !== "removed" &&
        doctor.id !== editId &&
        (doctor.registrationNumber || "").toLowerCase() ===
        registrationNumber;

    });

    if (duplicate) {
      alert(
        "A doctor with this medical registration number has already been added."
      );
      return;
    }

    // Update existing doctor
    if (editingDoctor) {

      const index = doctors.findIndex(function (doctor) {
        return doctor.id === editId;
      });

      if (editingDoctor.status === "approved") {

        // Keep approved public details unchanged.
        // Save new details for admin review.
        doctors[index].pendingChanges = doctorDetails;
        doctors[index].updateStatus = "pending";

      } else {

        doctors[index] = {
          ...editingDoctor,
          ...doctorDetails,
          status: "pending",
          pendingChanges: null,
          updateStatus: null
        };

      }

      alert(
        "Doctor information updated. Changes are awaiting approval."
      );

    } else {

      // Add a new doctor
      const doctor = {

        id: "TEMP-" + Date.now(),

        ...doctorDetails,

        status: "pending",

        doctorId: "",

        institution: "Your Institution Name",

        institutionStatus: "active",

        createdAt: new Date().toISOString(),

        pendingChanges: null,

        updateStatus: null

      };

      doctors.push(doctor);

      alert(
        "Doctor details saved successfully. Status: Pending Approval."
      );

    }

    // Save records
    try {

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(doctors)
      );

    } catch (error) {

      alert(
        "Could not save the doctor. Browser storage may be full."
      );

      return;

    }

    window.location.href = "manage-doctors.html";

  });

});


// ==========================================
// MANAGE DOCTORS
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

  const doctorList = document.getElementById("doctorList");

  if (!doctorList) return;

  const STORAGE_KEY = "carebridgeDoctors";

  const searchInput = document.getElementById("doctorSearch");

  const statusFilter = document.getElementById("statusFilter");

  const specialtyFilter = document.getElementById("specialtyFilter");

  const emptyState = document.getElementById("emptyState");

  const noResults = document.getElementById("noResults");


  // Get saved doctors without deleting removed records
  function getDoctors() {

    try {

      const doctors = JSON.parse(
        localStorage.getItem(STORAGE_KEY)
      ) || [];

      return doctors.filter(function (doctor) {

        return doctor.institutionStatus !== "removed";

      });

    } catch (error) {

      return [];

    }

  }


  // Create HTML elements safely
  function createElement(tag, className, text) {

    const element = document.createElement(tag);

    element.className = className;

    element.textContent = text;

    return element;

  }


  // Display doctors
  function renderDoctors() {

    const doctors = getDoctors();

    // Update counters
    document.getElementById("totalDoctors").textContent =
      doctors.length;

    document.getElementById("approvedDoctors").textContent =
      doctors.filter(function (doctor) {
        return doctor.status === "approved";
      }).length;

    document.getElementById("pendingDoctors").textContent =
      doctors.filter(function (doctor) {
        return doctor.status === "pending";
      }).length;

    document.getElementById("rejectedDoctors").textContent =
      doctors.filter(function (doctor) {
        return doctor.status === "rejected";
      }).length;


    // Update specialty filter
    const selectedSpecialty = specialtyFilter.value;

    const specialties = [
      ...new Set(
        doctors.map(function (doctor) {
          return doctor.specialty;
        }).filter(Boolean)
      )
    ];

    specialtyFilter.innerHTML =
      '<option value="all">All Specialties</option>';

    specialties.forEach(function (specialty) {

      const option = document.createElement("option");

      option.value = specialty;

      option.textContent = specialty;

      specialtyFilter.appendChild(option);

    });

    specialtyFilter.value = specialties.includes(selectedSpecialty)
      ? selectedSpecialty
      : "all";


    // Search and filters
    const search = searchInput.value.toLowerCase().trim();

    const status = statusFilter.value;

    const specialty = specialtyFilter.value;

    const filtered = doctors.filter(function (doctor) {

      const matchesSearch =
        (doctor.name || "").toLowerCase().includes(search) ||
        (doctor.specialty || "").toLowerCase().includes(search);

      const matchesStatus =
        status === "all" || doctor.status === status;

      const matchesSpecialty =
        specialty === "all" ||
        doctor.specialty === specialty;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSpecialty
      );

    });


    doctorList.innerHTML = "";


    // No doctors at all
    if (doctors.length === 0) {

      emptyState.hidden = false;

      noResults.hidden = true;

      doctorList.appendChild(emptyState);

      return;

    }


    emptyState.hidden = true;


    // No matching search results
    if (filtered.length === 0) {

      noResults.hidden = false;

      return;

    }

    noResults.hidden = true;


    // Create doctor cards
    filtered.forEach(function (doctor) {

      const card = createElement(
        "article",
        "doctor-card",
        ""
      );

      const info = createElement(
        "div",
        "doctor-info",
        ""
      );


      const name = createElement(
        "h3",
        "doctor-name",
        doctor.name || "Unnamed Doctor"
      );


      const specialtyText = createElement(
        "p",
        "doctor-specialty",
        doctor.specialty || "Specialty not specified"
      );


      const qualification = createElement(
        "p",
        "doctor-detail",
        (doctor.qualification || "Qualification not specified") +
        " • " +
        (doctor.experience || "0") +
        " years experience"
      );


      const fee = createElement(
        "p",
        "doctor-detail",
        "Consultation Fee: ₹" +
        (doctor.consultationFee || "0")
      );


      const registration = createElement(
        "p",
        "doctor-detail",
        "Registration No: " +
        (doctor.registrationNumber || "Not provided")
      );


      // Status badge
      const statusBadge = createElement(
        "span",
        "doctor-status " + (doctor.status || "pending"),

        doctor.status === "approved"
          ? "Approved"
          : doctor.status === "rejected"
          ? "Rejected"
          : "Pending Approval"
      );


      info.append(
        name,
        specialtyText,
        qualification,
        fee,
        registration,
        statusBadge
      );


      // Show update-pending message for approved doctors
      if (doctor.updateStatus === "pending") {

        const updateBadge = createElement(
          "span",
          "doctor-status pending",
          "Profile Update Pending Approval"
        );

        info.appendChild(updateBadge);

      }


      // Action buttons
      const actions = createElement(
        "div",
        "doctor-actions",
        ""
      );


      const editButton = createElement(
        "button",
        "edit-doctor-btn",
        "Edit Doctor"
      );

      editButton.type = "button";

      editButton.dataset.doctorId = doctor.id;


      const removeButton = createElement(
        "button",
        "remove-doctor-btn",
        "Remove Doctor"
      );

      removeButton.type = "button";

      removeButton.dataset.doctorId = doctor.id;


      actions.append(
        editButton,
        removeButton
      );


      card.append(
        info,
        actions
      );

      doctorList.appendChild(card);

    });

  }


  // Handle Edit and Remove buttons
  doctorList.addEventListener("click", function (event) {

    // Edit Doctor
    const editButton = event.target.closest(
      ".edit-doctor-btn"
    );

    if (editButton) {

      const doctorId = editButton.dataset.doctorId;

      window.location.href =
        "add-doctor.html?edit=" +
        encodeURIComponent(doctorId);

      return;

    }


    // Remove Doctor
    const removeButton = event.target.closest(
      ".remove-doctor-btn"
    );

    if (!removeButton) return;

    const doctorId = removeButton.dataset.doctorId;

    const confirmed = confirm(
      "Are you sure you want to remove this doctor from your institution?"
    );

    if (!confirmed) return;


    // Preserve all records and mark this affiliation as removed
    try {

      const allDoctors = JSON.parse(
        localStorage.getItem(STORAGE_KEY)
      ) || [];

      const updatedDoctors = allDoctors.map(function (doctor) {

        if (doctor.id === doctorId) {

          return {
            ...doctor,
            institutionStatus: "removed"
          };

        }

        return doctor;

      });

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedDoctors)
      );

      alert(
        "Doctor removed from your institution successfully."
      );

      renderDoctors();

    } catch (error) {

      alert(
        "Unable to remove this doctor. Please try again."
      );

    }

  });


  // Search and filter events
  searchInput.addEventListener(
    "input",
    renderDoctors
  );

  statusFilter.addEventListener(
    "change",
    renderDoctors
  );

  specialtyFilter.addEventListener(
    "change",
    renderDoctors
  );


  // Initial display
  renderDoctors();

});