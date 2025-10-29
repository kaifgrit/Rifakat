// frontend-admin/dashboard.js

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  if (typeof config === 'undefined') {
    alert("CRITICAL ERROR: config.js is not loaded. Admin panel will not work.");
    window.location.href = "login.html";
    return;
  }
  const API_URL = `${config.API_URL}/products`;

  const productList = document.getElementById("product-list");
  const categoryFilter = document.getElementById("category-filter");
  const searchInput = document.getElementById("search-input");
  const logoutButton = document.getElementById("logout-btn");
  
  // --- START: NEW ELEMENTS FOR MULTI-DELETE ---
  const selectAllCheckbox = document.getElementById("select-all-checkbox");
  const deleteSelectedButton = document.getElementById("delete-selected-btn");
  // --- END: NEW ELEMENTS ---

  let allProducts = [];

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const handleAuthError = (error) => {
    console.error("Authorization error:", error);
    if (error.status === 401 || error.status === 403) {
      localStorage.removeItem("authToken");
      alert("Your session has expired. Please log in again.");
      window.location.href = "login.html";
    } else {
      alert("An error occurred. Please check the console.");
    }
  };

  async function fetchAllProducts() {
    productList.innerHTML = `<tr><td colspan="6" style="text-align: center;">Loading products...</td></tr>`; // Updated colspan
    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) throw response;
        throw new Error("Network response was not ok");
      }
      allProducts = await response.json();
      applyFilters();
      // --- NEW: Reset checkbox states after fetching ---
      selectAllCheckbox.checked = false;
      updateDeleteButtonVisibility();
      // --- END NEW ---
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        handleAuthError(error);
      } else {
        console.error("Error fetching products:", error);
        productList.innerHTML = `<tr><td colspan="6">Error loading products. Is the backend server running?</td></tr>`; // Updated colspan
      }
    }
  }

  function displayProducts(products) {
    productList.innerHTML = "";
    if (products.length === 0) {
      productList.innerHTML = `<tr><td colspan="6">No products found for this filter.</td></tr>`; // Updated colspan
      return;
    }
    products.forEach((product) => {
      const row = document.createElement("tr");
      // --- CORRECTED HTML: Removed comments ---
      row.innerHTML = `
                <td class="select-col" data-label="Select"> 
                    <input type="checkbox" class="product-select-checkbox" value="${product._id}">
                </td>
                <td data-label="Product Name">${product.productName}</td> 
                <td data-label="Brand">${product.brand || "N/A"}</td> 
                <td data-label="Category">${product.category}</td> 
                <td data-label="Price">₹${product.price}</td> 
                <td data-label="Actions" class="actions"> 
                    <button class="btn-edit" data-id="${product._id}">Edit</button>
                    <button class="btn-delete" data-id="${product._id}">Delete</button>
                </td>
            `;
      // --- END CORRECTION ---
      productList.appendChild(row);
    });
  }

  function applyFilters() {
    const categoryValue = categoryFilter.value;
    const searchValue = searchInput.value.toLowerCase().trim();

    let filteredProducts = allProducts;

    if (categoryValue !== "all") {
      filteredProducts = filteredProducts.filter(
        (product) => product.category === categoryValue
      );
    }

    if (searchValue) {
      filteredProducts = filteredProducts.filter(
        (product) =>
          product.productName.toLowerCase().includes(searchValue) ||
          (product.brand && product.brand.toLowerCase().includes(searchValue))
      );
    }

    displayProducts(filteredProducts);
    // --- NEW: Reset checkbox states after filtering ---
    selectAllCheckbox.checked = false;
    updateDeleteButtonVisibility();
    // --- END NEW ---
  }

  categoryFilter.addEventListener("change", applyFilters);
  searchInput.addEventListener("input", applyFilters);

  async function deleteProduct(id, buttonElement) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    buttonElement.disabled = true;
    buttonElement.textContent = "Deleting...";
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) throw response;
        throw new Error("Failed to delete product.");
      }
      fetchAllProducts(); // Refetch all products to update the list
      if (typeof showMessage === 'function') showMessage('Product deleted successfully!', 'success');
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        handleAuthError(error);
      } else {
        console.error("Error deleting product:", error);
        alert("Could not delete product. See console for details.");
      }
      buttonElement.disabled = false;
      buttonElement.textContent = "Delete";
    }
  }

  // --- START: NEW MULTI-DELETE FUNCTIONS & LISTENERS ---

  // Function to show/hide the "Delete Selected" button
  function updateDeleteButtonVisibility() {
    const checkedCheckboxes = productList.querySelectorAll(".product-select-checkbox:checked");
    deleteSelectedButton.style.display = checkedCheckboxes.length > 0 ? "inline-flex" : "none";
  }

  // Function to handle the batch delete API call
  async function deleteSelectedProducts() {
    const checkedCheckboxes = productList.querySelectorAll(".product-select-checkbox:checked");
    const productIdsToDelete = Array.from(checkedCheckboxes).map(cb => cb.value);

    if (productIdsToDelete.length === 0) {
      alert("Please select products to delete.");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${productIdsToDelete.length} selected product(s)?`)) {
      return;
    }

    deleteSelectedButton.disabled = true;
    deleteSelectedButton.textContent = "Deleting...";

    try {
      // NOTE: The '/batch' endpoint needs to be created in the backend (productRoutes.js)
      const response = await fetch(`${API_URL}/batch`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids: productIdsToDelete }), // Send IDs in the body
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) throw response;
        const errorData = await response.json().catch(() => ({ message: "Failed to delete selected products." }));
        throw new Error(errorData.message || "Failed to delete selected products.");
      }
      
      const result = await response.json();
      if (typeof showMessage === 'function') showMessage(result.message || 'Selected products deleted successfully!', 'success');
      fetchAllProducts(); // Refresh the list
      
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        handleAuthError(error);
      } else {
        console.error("Error deleting selected products:", error);
        if (typeof showMessage === 'function') showMessage(`Error: ${error.message}`, 'error'); else alert(`Error: ${error.message}`);
      }
    } finally {
      deleteSelectedButton.disabled = false;
      deleteSelectedButton.textContent = "Delete Selected";
      // Ensure button is hidden if no items remain selected (e.g., after successful delete)
      updateDeleteButtonVisibility();
    }
  }

  // Listener for the "Select All" checkbox
  selectAllCheckbox.addEventListener("change", (event) => {
    const isChecked = event.target.checked;
    productList.querySelectorAll(".product-select-checkbox").forEach(checkbox => {
      checkbox.checked = isChecked;
    });
    updateDeleteButtonVisibility();
  });

  // Listener for individual product checkboxes (using event delegation on the table body)
  productList.addEventListener("change", (event) => {
    if (event.target.classList.contains("product-select-checkbox")) {
      const allCheckboxes = productList.querySelectorAll(".product-select-checkbox");
      const checkedCount = productList.querySelectorAll(".product-select-checkbox:checked").length;
      
      // Update "Select All" checkbox state
      selectAllCheckbox.checked = checkedCount > 0 && checkedCount === allCheckboxes.length;
      selectAllCheckbox.indeterminate = checkedCount > 0 && checkedCount < allCheckboxes.length;
      
      updateDeleteButtonVisibility();
    }
  });

  // Listener for the "Delete Selected" button
  deleteSelectedButton.addEventListener("click", deleteSelectedProducts);

  // --- END: NEW MULTI-DELETE ---

  // Keep existing single delete/edit listener
  productList.addEventListener("click", (event) => {
    const target = event.target;
    const id = target.dataset.id;
    if (target.classList.contains("btn-delete")) {
      deleteProduct(id, target);
    }
    if (target.classList.contains("btn-edit")) {
      window.location.href = `product-form.html?id=${id}`;
    }
    // Checkbox clicks are handled by the 'change' event listener above
  });

  const addProductBtn = document.querySelector(".add-product-btn");
  addProductBtn.addEventListener("click", () => {
    window.location.href = "product-form.html";
  });

  logoutButton.addEventListener("click", () => {
    if (confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("authToken");
      window.location.href = "login.html";
    }
  });

  fetchAllProducts();
});