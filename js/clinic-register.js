
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  deleteUser
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
  ref,
  set
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-database.js";

import {
  auth,
  db,
  authPersistence
} from "./firebase.js";

const form = document.getElementById("clinicRegistrationForm");

if (!form) {
  throw new Error("Clinic registration form not found.");
}

const submitButton = form.querySelector('button[type="submit"]');

submitButton.disabled = false;
submitButton.textContent = "Submit Registration";

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  if (!form.reportValidity()) return;

  const formData = new FormData(form);

  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();

  const institutionData = {
    uid: "",
    institutionName: String(formData.get("institutionName") || "").trim(),
    institutionType: String(formData.get("institutionType") || ""),
    registrationNumber: String(formData.get("registrationNumber") || "").trim(),
    representativeName: String(formData.get("representativeName") || "").trim(),
    designation: String(formData.get("designation") || "").trim(),
    email: email,
    phone: String(formData.get("phone") || "").trim(),
    city: String(formData.get("city") || ""),
    area: String(formData.get("area") || "").trim(),
    address: String(formData.get("address") || "").trim(),
    pincode: String(formData.get("pincode") || "").trim(),
    specialties: String(formData.get("specialties") || "").trim(),
    approvalStatus: "pending",
    createdAt: Date.now()
  };

  const optionalFields = [
    "establishmentYear",
    "doctorsCount",
    "beds",
    "openingHours"
  ];

  optionalFields.forEach(function (field) {
    const value = String(formData.get(field) || "").trim();

    if (value !== "") {
      institutionData[field] = value;
    }
  });

  submitButton.disabled = true;
  submitButton.textContent = "Submitting...";

  let newUser = null;

  try {
    await authPersistence;

    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    newUser = credential.user;

    institutionData.uid = newUser.uid;

    await sendEmailVerification(newUser);

    await set(
      ref(db, "institutions/" + newUser.uid),
      institutionData
    );

    form.reset();

    alert(
      "Registration submitted successfully!\n\n" +
      "A verification email has been sent to " + email + ".\n\n" +
      "Your institution's application is pending Super Admin approval."
    );

  } catch (error) {
    console.error("Clinic registration error:", error);

    if (newUser) {
      try {
        await deleteUser(newUser);
      } catch (deleteError) {
        console.error("Account cleanup error:", deleteError);
      }
    }

    let message = "Registration failed. Please try again.";

    if (error.code === "auth/email-already-in-use") {
      message = "This email already has an account. Please use the login page.";
    } else if (error.code === "auth/weak-password") {
      message = "Please choose a stronger password.";
    } else if (error.code === "auth/invalid-email") {
      message = "Please enter a valid email address.";
    } else if (error.code === "PERMISSION_DENIED" ||
               error.code === "database/permission-denied") {
      message = "Firebase rejected the registration data. Please contact support.";
    }

    alert(message);

  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Registration";
  }
});
