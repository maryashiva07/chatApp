const API_URL = "/api";

// Password Show / Hide

const toggleButtons = document.querySelectorAll(".toggle-password");

toggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.dataset.target;
    const passwordInput = document.getElementById(targetId);

    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      button.textContent = "Hide";
    } else {
      passwordInput.type = "password";
      button.textContent = "Show";
    }
  });
});

// Signup

const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    clearErrors();

    const name = document.getElementById("name").value.trim();

    const email = document.getElementById("email").value.trim();

    // const phone =
    //     document.getElementById("phone").value.trim();

    const password = document.getElementById("signupPassword").value;

    let isValid = true;

    if (name.length < 2) {
      showError("nameError", "Please enter a valid name.");
      isValid = false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      showError("emailError", "Please enter a valid email.");
      isValid = false;
    }

    // const phonePattern =
    //     /^[6-9]\d{9}$/;

    // if (!phonePattern.test(phone)) {
    //     showError(
    //         "phoneError",
    //         "Enter a valid 10-digit phone number."
    //     );
    //     isValid = false;
    // }

    if (password.length < 8) {
      showError(
        "passwordError",
        "Password must contain at least 8 characters.",
      );
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    const signupBtn = document.getElementById("signupBtn");

    const message = document.getElementById("signupMessage");

    signupBtn.disabled = true;
    signupBtn.textContent = "Creating Account...";

    try {
      const response = await fetch(`${API_URL}/signup`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed.");
      }

      message.textContent = data.message || "Account created successfully.";

      message.className = "form-message success";

      signupForm.reset();

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    } catch (error) {
      message.textContent = error.message || "Something went wrong.";

      message.className = "form-message form-error";
    } finally {
      signupBtn.disabled = false;
      signupBtn.textContent = "Create Account";
    }
  });
}

// Login

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    clearErrors();

    const email = document.getElementById("loginIdentifier").value.trim();

    const password = document.getElementById("loginPassword").value;

    let isValid = true;

    // Email validation

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      showError("identifierError", "Please enter a valid email.");

      isValid = false;
    }

    // Password validation

    if (password.length < 8) {
      showError(
        "loginPasswordError",
        "Password must contain at least 8 characters.",
      );

      isValid = false;
    }

    if (!isValid) {
      return;
    }

    const loginBtn = document.getElementById("loginBtn");

    const message = document.getElementById("loginMessage");

    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid email or password.");
      }

      message.textContent = data.message || "Login successful.";

      message.className = "form-message success";

      // Save JWT

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // Backend returns isUser

      if (data.isUser) {
        localStorage.setItem("user", JSON.stringify(data.isUser));
      }

      setTimeout(() => {
        window.location.href = "chat.html";
      }, 1000);
    } catch (error) {
      message.textContent = error.message || "Something went wrong.";

      message.className = "form-message form-error";
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
    }
  });
}

// Helper Functions

function showError(elementId, message) {
  const element = document.getElementById(elementId);

  if (element) {
    element.textContent = message;
  }
}

function clearErrors() {
  document.querySelectorAll(".error").forEach((element) => {
    element.textContent = "";
  });

  document.querySelectorAll(".form-message").forEach((element) => {
    element.textContent = "";
    element.className = "form-message";
  });
}
