// frontend-admin/utils.js

/**
 * Displays a toast notification message at the top-right of the screen.
 * @param {string} message The message to display.
 * @param {string} [type='success'] The type of message ('success' or 'error').
 */
function showMessage(message, type = "success") {
  // Check if a toast container exists, if not, create it
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    document.body.appendChild(toastContainer);
  }

  // Create the toast message element
  const toast = document.createElement("div");
  toast.className = `toast-message toast-${type}`;
  toast.textContent = message;

  // Add the toast to the container
  toastContainer.appendChild(toast);

  // Animate the toast in
  setTimeout(() => {
    toast.classList.add("visible");
  }, 10); // Small delay to allow CSS transition to trigger

  // Set a timeout to automatically remove the toast
  setTimeout(() => {
    // Animate the toast out
    toast.classList.remove("visible");

    // Remove the element from the DOM after the fade-out animation completes
    toast.addEventListener("transitionend", () => {
      toast.remove();
      // If the container is empty, remove it as well
      if (toastContainer.children.length === 0) {
        toastContainer.remove();
      }
    });
  }, 3000); // The toast will be visible for 3 seconds
}