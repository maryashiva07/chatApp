const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");


// Show / Hide Password

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

if (signupForm) {

    signupForm.addEventListener("submit", (event) => {

        event.preventDefault();

        clearErrors();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const password = document.getElementById("signupPassword").value;

        let isValid = true;

        if (name.length < 2) {
            showError("nameError", "Please enter your full name.");
            isValid = false;
        }

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            showError("emailError", "Please enter a valid email.");
            isValid = false;
        }

        const phonePattern = /^[6-9]\d{9}$/;

        if (!phonePattern.test(phone)) {
            showError(
                "phoneError",
                "Enter a valid 10-digit phone number."
            );
            isValid = false;
        }

        if (password.length < 8) {
            showError(
                "passwordError",
                "Password must contain at least 8 characters."
            );
            isValid = false;
        }

        if (!isValid) {
            return;
        }

        const signupBtn = document.getElementById("signupBtn");

        signupBtn.disabled = true;
        signupBtn.textContent = "Creating Account...";

        setTimeout(() => {

            signupBtn.disabled = false;
            signupBtn.textContent = "Create Account";

            const message =
                document.getElementById("signupMessage");

            message.textContent =
                "Account created successfully!";

            message.className = "form-message success";

            signupForm.reset();

        }, 1000);

    });

}


// Login

if (loginForm) {

    loginForm.addEventListener("submit", (event) => {

        event.preventDefault();

        clearErrors();

        const identifier =
            document
                .getElementById("loginIdentifier")
                .value
                .trim();

        const password =
            document
                .getElementById("loginPassword")
                .value;

        let isValid = true;

        if (identifier === "") {

            showError(
                "identifierError",
                "Email or phone number is required."
            );

            isValid = false;
        }

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const phonePattern =
            /^[6-9]\d{9}$/;

        const isEmail = emailPattern.test(identifier);
        const isPhone = phonePattern.test(identifier);

        if (identifier !== "" && !isEmail && !isPhone) {

            showError(
                "identifierError",
                "Enter a valid email or phone number."
            );

            isValid = false;
        }

        if (password.length < 8) {

            showError(
                "loginPasswordError",
                "Password must contain at least 8 characters."
            );

            isValid = false;
        }

        if (!isValid) {
            return;
        }

        const loginBtn =
            document.getElementById("loginBtn");

        loginBtn.disabled = true;
        loginBtn.textContent = "Logging in...";

        setTimeout(() => {

            loginBtn.disabled = false;
            loginBtn.textContent = "Login";

            const message =
                document.getElementById("loginMessage");

            message.textContent =
                "Login successful!";

            message.className = "form-message success";

            loginForm.reset();

        }, 1000);

    });

}


// Helper Functions

function showError(elementId, message) {

    document.getElementById(elementId).textContent = message;

}


function clearErrors() {

    document
        .querySelectorAll(".error")
        .forEach((element) => {
            element.textContent = "";
        });

    document
        .querySelectorAll(".form-message")
        .forEach((element) => {
            element.textContent = "";
            element.className = "form-message";
        });

}
