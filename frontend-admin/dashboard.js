// frontend-admin/dashboard.js

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const API_URL = "http://localhost:5000/api/products";
  const productList = document.getElementById("product-list");
  const categoryFilter = document.getElementById("category-filter");
  const searchInput = document.getElementById("search-input"); // --- Get search input ---
  const logoutButton = document.getElementById("logout-btn");

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
    productList.innerHTML = `<tr><td colspan="5" style="text-align: center;">Loading products...</td></tr>`;
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
      applyFilters(); // Apply initial filters (which will just display all)
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        handleAuthError(error);
      } else {
        console.error("Error fetching products:", error);
        productList.innerHTML = `<tr><td colspan="5">Error loading products. Is the backend server running?</td></tr>`;
      }
    }
  }

  function displayProducts(products) {
    productList.innerHTML = "";
    if (products.length === 0) {
      productList.innerHTML = `<tr><td colspan="5">No products found for this filter.</td></tr>`;
      return;
    }
    products.forEach((product) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${product.productName}</td>
                <td>${product.brand || "N/A"}</td>
                <td>${product.category}</td>
                <td>₹${product.price}</td>
                <td class="actions">
                    <button class="btn-edit" data-id="${product._id}">Edit</button>
                    <button class="btn-delete" data-id="${product._id}">Delete</button>
                </td>
            `;
      productList.appendChild(row);
    });
  }

  // --- FIX: Combined Filter Function ---
  function applyFilters() {
    const categoryValue = categoryFilter.value;
    const searchValue = searchInput.value.toLowerCase().trim();

    let filteredProducts = allProducts;

    // 1. Apply category filter
    if (categoryValue !== "all") {
      filteredProducts = filteredProducts.filter(
        (product) => product.category === categoryValue
      );
    }

    // 2. Apply search filter
    if (searchValue) {
      filteredProducts = filteredProducts.filter(
        (product) =>
          product.productName.toLowerCase().includes(searchValue) ||
          (product.brand && product.brand.toLowerCase().includes(searchValue))
      );
    }

    displayProducts(filteredProducts);
  }

  // --- Attach event listeners to both filters ---
  categoryFilter.addEventListener("change", applyFilters);
  searchInput.addEventListener("input", applyFilters); // 'input' for real-time filtering

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

  productList.addEventListener("click", (event) => {
    const target = event.target;
    const id = target.dataset.id;
    if (target.classList.contains("btn-delete")) {
      deleteProduct(id, target);
    }
    if (target.classList.contains("btn-edit")) {
      window.location.href = `product-form.html?id=${id}`;
    }
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