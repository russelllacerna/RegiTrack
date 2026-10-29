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

const DEMO_ACCOUNTS = [
  { username: "admin", password: "admin123", name: "System Administrator", role: "admin" },
  { username: "registrar", password: "registrar123", name: "Registrar Staff", role: "registrar" },
  { username: "approver", password: "approver123", name: "Authorized Registrar", role: "registrar", canApprove: true },
  { username: "student", password: "student123", name: "Demo Student", role: "student" }
];

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
  setTimeout(() => {
    const account = DEMO_ACCOUNTS.find(a => a.username === userValue && a.password === passwordValue);
    loginButton.disabled = false;
    loginButton.classList.remove("loading");
    if (!account) {
      formMessage.textContent = "Invalid username or password.";
      formMessage.className = "form-message";
      return;
    }
    const user = {
      username: account.username, name: account.name, role: account.role,
      canApprove: Boolean(account.canApprove)
    };
    sessionStorage.setItem("regitrackDemoUser", JSON.stringify(user));
    formMessage.textContent = "Login successful. Opening your dashboard...";
    formMessage.className = "form-message success";
    const destination = { admin: "admin-dashboard.html", registrar: "registrar-dashboard.html", student: "student-dashboard.html" }[account.role];
    setTimeout(() => { window.location.href = destination; }, 350);
  }, 250);
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
