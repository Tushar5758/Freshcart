// Get form elements
const cardNumberInput = document.getElementById("cardNumber");
const expiryDateInput = document.getElementById("expiryDate");
const cvvInput = document.getElementById("cvv");
const emailInput = document.getElementById("email");

// Real-time validation on input
cardNumberInput.addEventListener("input", validateCardNumber);
expiryDateInput.addEventListener("input", validateExpiryDate);
cvvInput.addEventListener("input", validateCVV);
emailInput.addEventListener("input", validateEmail);

// Validate Card Number
function validateCardNumber() {
  const value = cardNumberInput.value.replace(/\s+/g, '');
  if (/^\d{16}$/.test(value)) {
    setValid(cardNumberInput);
    return true;
  } else {
    setInvalid(cardNumberInput);
    return false;
  }
}

// Validate Expiry Date (MM/YY)
function validateExpiryDate() {
  const value = expiryDateInput.value.trim();
  const regex = /^(0[1-9]|1[0-2])\/\d{2}$/;
  if (regex.test(value)) {
    setValid(expiryDateInput);
    return true;
  } else {
    setInvalid(expiryDateInput);
    return false;
  }
}

// Validate CVV (3 or 4 digits)
function validateCVV() {
  const value = cvvInput.value.trim();
  if (/^\d{3,4}$/.test(value)) {
    setValid(cvvInput);
    return true;
  } else {
    setInvalid(cvvInput);
    return false;
  }
}

// Validate Email
function validateEmail() {
  const value = emailInput.value.trim();
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (regex.test(value)) {
    setValid(emailInput);
    return true;
  } else {
    setInvalid(emailInput);
    return false;
  }
}

// Helper functions to set valid/invalid styles
function setValid(input) {
  input.style.borderColor = "green";
}

function setInvalid(input) {
  input.style.borderColor = "red";
}

// Payment button click validation
function payNow() {
  const isCardValid = validateCardNumber();
  const isDateValid = validateExpiryDate();
  const isCVVValid = validateCVV();
  const isEmailValid = validateEmail();

  if (isCardValid && isDateValid && isCVVValid && isEmailValid) {
    document.getElementById("successMessage").style.display = "block";
  } else {
    alert("Please correct the highlighted fields before proceeding.");
  }
}