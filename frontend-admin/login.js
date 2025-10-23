// frontend-admin/login.js

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");

  // --- FIX: Use config.js for API URL ---
  if (typeof config === 'undefined') {
    alert("CRITICAL ERROR: config.js is not loaded. Admin panel will not work.");
    return;
  }
  const API_URL = `${config.API_URL}/auth/login`;
  // --- END FIX ---
 
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault(); // Prevent the page from reloading

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const submitButton = loginForm.querySelector('button[type="submit"]');

    // Disable button and show loading text
    submitButton.disabled = true;
    submitButton.textContent = "Logging In...";

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // --- FIX: Store the token in localStorage ---
        localStorage.setItem("authToken", data.token);

        // If login is successful, redirect to the dashboard
        window.location.href = "dashboard.html";
      } else {
        // If login fails, show an error message
        console.error("Login failed:", data.message);
        alert(`Login Failed: ${data.message || "Invalid username or password."}`);
      }
    } catch (error) {
      // Handle network errors
      console.error("Login error:", error);
      alert("An error occurred during login. Please check your connection or try again later.");
    } finally {
      // Re-enable the button regardless of outcome
      submitButton.disabled = false;
      submitButton.textContent = "Login";
    }
  });
});