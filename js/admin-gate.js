/* ==========================================================
   ADMIN PASSWORD GATE

   This is a client-side-only convenience gate, not real access
   control — the password lives in this file, which anyone can read
   via "view source". It just keeps casual visitors from landing on
   admin.html and immediately seeing/loading guest data. admin.js
   and email.js aren't even fetched until the password is correct,
   so nothing in the page attempts to load RSVP data beforehand.
========================================================== */
(function () {
  const PASSWORD = "simon";
  const SESSION_KEY = "adminAuthed";

  const gate = document.getElementById("admin-gate");
  const content = document.getElementById("admin-content");
  const form = document.getElementById("gate-form");
  const passwordInput = document.getElementById("gate-password");
  const errorEl = document.getElementById("gate-error");

  function loadAdminScripts() {
    const admin = document.createElement("script");
    admin.src = "js/admin.js";
    admin.onload = () => {
      const email = document.createElement("script");
      email.src = "js/email.js";
      document.body.appendChild(email);
    };
    document.body.appendChild(admin);
  }

  function unlock() {
    gate.hidden = true;
    content.hidden = false;
    loadAdminScripts();
  }

  if (sessionStorage.getItem(SESSION_KEY) === "true") {
    unlock();
    return;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (passwordInput.value === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      unlock();
    } else {
      errorEl.textContent = "Incorrect password.";
      passwordInput.value = "";
      passwordInput.focus();
    }
  });
})();
