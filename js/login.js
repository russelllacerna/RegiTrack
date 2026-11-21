const loginForm = document.getElementById("loginForm");
const username = document.getElementById("username");
const password = document.getElementById("password");
const passwordToggle = document.getElementById("passwordToggle");
const loginButton = document.getElementById("loginButton");
const formMessage = document.getElementById("formMessage");
const usernameError = document.getElementById("usernameError");
const passwordError = document.getElementById("passwordError");
const forgotPassword = document.getElementById("forgotPassword");
const registerLink = document.getElementById("registerLink");

function setFieldError(input, errorElement, message) {
  input.closest(".input-wrap").classList.toggle("has-error", Boolean(message));
  errorElement.textContent = message || "";
}
function clearErrors() {
  setFieldError(username, usernameError, "");
  setFieldError(password, passwordError, "");
  formMessage.textContent = "";
  formMessage.className = "form-message";
}
passwordToggle.addEventListener("click", () => {
  const showing = password.type === "text";
  password.type = showing ? "password" : "text";
  passwordToggle.setAttribute("aria-label", showing ? "Show password" : "Hide password");
  passwordToggle.setAttribute("title", showing ? "Show password" : "Hide password");
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearErrors();
  const userValue = username.value.trim().toLowerCase();
  const passwordValue = password.value;
  let valid = true;
  if (!userValue) { setFieldError(username, usernameError, "Enter your username."); valid = false; }
  if (!passwordValue) { setFieldError(password, passwordError, "Enter your password."); valid = false; }
  if (!valid) return;

  loginButton.disabled = true;
  loginButton.classList.add("loading");
  fetch("api/login.php", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username: userValue, password: passwordValue })
  })
    .then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Sign-in failed. Please try again.");
      return data.user;
    })
    .then((user) => {
      // Display info only; the server session decides what the user can access.
      sessionStorage.setItem("regitrackDemoUser", JSON.stringify(user));
      formMessage.textContent = "Login successful. Opening your dashboard...";
      formMessage.className = "form-message success";
      const destination = { admin: "admin-dashboard.html", registrar: "registrar-dashboard.html", student: "student-dashboard.html" }[user.role];
      setTimeout(() => { window.location.href = destination; }, 350);
    })
    .catch((err) => {
      formMessage.textContent = err.message === "Failed to fetch"
        ? "Cannot reach the server. Open RegiTrack through XAMPP (http://localhost/regitrack/)."
        : err.message;
      formMessage.className = "form-message";
    })
    .finally(() => {
      loginButton.disabled = false;
      loginButton.classList.remove("loading");
    });
});
forgotPassword.addEventListener("click", (event) => {
  event.preventDefault();
  formMessage.textContent = "Password recovery will be connected to the backend later.";
  formMessage.className = "form-message";
});
registerLink.addEventListener("click", (event) => {
  event.preventDefault();
  formMessage.textContent = "For this prototype, student and staff accounts are provisioned by authorized personnel.";
  formMessage.className = "form-message";
});
username.addEventListener("input", () => { setFieldError(username, usernameError, ""); formMessage.textContent = ""; });
password.addEventListener("input", () => { setFieldError(password, passwordError, ""); formMessage.textContent = ""; });
