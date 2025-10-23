document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // --- FIX: Use config.js for API URLs ---
  if (typeof config === 'undefined') {
    alert("CRITICAL ERROR: config.js is not loaded. Admin panel will not work.");
    window.location.href = "login.html";
    return;
  }
  const API_URL = `${config.API_URL}/products`;
  const UPLOAD_URL = `${config.API_URL}/upload`;
  // --- END FIX ---

  const form = document.getElementById("product-form");
  const formTitle = document.getElementById("form-title");
  const productIdInput = document.getElementById("productId");
  const colorContainer = document.getElementById("color-variations-container");
  const addColorBtn = document.getElementById("add-color-btn");
  const submitButton = form.querySelector('button[type="submit"]');

  let editMode = false;
  let productId = null;
  let colorCounter = 0;

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const getAuthHeadersForUpload = () => ({
    Authorization: `Bearer ${token}`,
  });

  const handleAuthError = (error) => {
    console.error("Authorization error:", error);
    if (error.status === 401 || error.status === 403) {
      localStorage.removeItem("authToken");
      if (typeof showMessage === "function") {
        showMessage("Session expired. Please log in again.", "error");
      } else {
        alert("Session expired. Please log in again.");
      }
      window.location.href = "login.html";
    }
  };

  const params = new URLSearchParams(window.location.search);
  productId = params.get("id");
  editMode = productId != null;

  // Handle dynamic brand addition
  const brandSelect = document.getElementById("brand");
  const customBrandContainer = document.getElementById("custom-brand-container");
  const customBrandInput = document.getElementById("custom-brand-input");
  
  // Load saved custom brands from localStorage
  const loadCustomBrands = () => {
    const savedBrands = JSON.parse(localStorage.getItem("customBrands") || "[]");
    savedBrands.forEach(brand => {
      // Check if brand already exists in dropdown
      const exists = Array.from(brandSelect.options).some(opt => opt.value === brand);
      if (!exists) {
        const option = document.createElement("option");
        option.value = brand;
        option.textContent = brand;
        // Insert before "Add New Brand" option
        brandSelect.insertBefore(option, brandSelect.lastElementChild);
      }
    });
  };
  
  loadCustomBrands();
  
  // Show/hide custom brand input based on selection
  brandSelect.addEventListener("change", (e) => {
    if (e.target.value === "__OTHER__") {
      customBrandContainer.classList.add("show");
      customBrandInput.focus();
    } else {
      customBrandContainer.classList.remove("show");
      customBrandInput.value = "";
    }
  });
  
  // Add new brand to dropdown when user types
  customBrandInput.addEventListener("blur", () => {
    const newBrand = customBrandInput.value.trim();
    if (newBrand) {
      // Capitalize first letter of each word
      const formattedBrand = newBrand
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      // Check if brand already exists
      const exists = Array.from(brandSelect.options).some(
        opt => opt.value.toLowerCase() === formattedBrand.toLowerCase()
      );
      
      if (!exists) {
        // Add to dropdown
        const option = document.createElement("option");
        option.value = formattedBrand;
        option.textContent = formattedBrand;
        brandSelect.insertBefore(option, brandSelect.lastElementChild);
        
        // Save to localStorage
        const savedBrands = JSON.parse(localStorage.getItem("customBrands") || "[]");
        savedBrands.push(formattedBrand);
        localStorage.setItem("customBrands", JSON.stringify(savedBrands));
        
        if (typeof showMessage === "function") {
          showMessage(`Brand "${formattedBrand}" added successfully!`, "success");
        }
      }
      
      // Select the new brand
      brandSelect.value = formattedBrand;
      customBrandContainer.classList.remove("show");
      customBrandInput.value = "";
    }
  });

  const addColorVariationFields = (color = {}) => {
    colorCounter++;
    const colorItem = document.createElement("div");
    colorItem.classList.add("color-variation-item");
    
    const imageUrls = color.imageUrls || (color.imageUrl ? [color.imageUrl] : []);
    const existingSizes = color.sizes || [];
    
    const existingImagesHTML = imageUrls.map((url, idx) => `
      <div class="uploaded-image-item" data-image-url="${url}">
        <img src="${url}" alt="Image ${idx + 1}">
        <button type="button" class="btn-remove-image" data-url="${url}">×</button>
      </div>
    `).join('');
    
    // Generate size checkboxes
    const availableSizes = ["6", "7", "8", "9", "10", "11", "12"];
    const sizeCheckboxesHTML = availableSizes.map(size => {
      const isChecked = existingSizes.includes(size) ? 'checked' : '';
      return `
        <label class="size-checkbox-label">
          <input type="checkbox" class="size-checkbox" value="${size}" ${isChecked}>
          <span>Size ${size}</span>
        </label>
      `;
    }).join('');
    
    colorItem.innerHTML = `
      <h4>Color Variation #${colorCounter}</h4>
      <div class="form-group">
        <label>Color Name</label>
        <input type="text" class="colorName" value="${color.colorName || ""}" required>
      </div>
      <div class="form-group">
        <label>Color Swatch</label>
        <input type="color" class="colorHexCode" value="${color.colorHexCode || "#ffffff"}">
      </div>
      <div class="form-group">
        <label>Product Images (Multiple angles)</label>
        <p class="text-sm text-gray-600 mb-2">Upload multiple images of this shoe from different angles</p>
        <div class="uploaded-images-container">
          ${existingImagesHTML}
        </div>
        <input type="file" class="imageUpload" accept="image/png, image/jpeg, image/jpg" multiple>
        <div class="upload-status"></div>
        <input type="hidden" class="imageUrls" value='${JSON.stringify(imageUrls)}'>
      </div>
      <div class="form-group">
        <label>Available Sizes</label>
        <p class="text-sm text-gray-600 mb-2">Select all available sizes for this color</p>
        <div class="size-checkboxes-container">
          ${sizeCheckboxesHTML}
        </div>
      </div>
      <button type="button" class="btn-delete-color">Remove Color</button>
    `;
    colorContainer.appendChild(colorItem);
  };

  addColorBtn.addEventListener("click", () => addColorVariationFields());

  colorContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-delete-color")) {
      e.target.closest(".color-variation-item").remove();
    }
    
    if (e.target.classList.contains("btn-remove-image")) {
      e.preventDefault();
      const imageItem = e.target.closest(".uploaded-image-item");
      const urlToRemove = e.target.dataset.url;
      const parentItem = e.target.closest('.color-variation-item');
      const imageUrlsInput = parentItem.querySelector('.imageUrls');
      
      let urls = JSON.parse(imageUrlsInput.value || '[]');
      urls = urls.filter(url => url !== urlToRemove);
      imageUrlsInput.value = JSON.stringify(urls);
      
      imageItem.remove();
      
      if (typeof showMessage === "function") {
        showMessage("Image removed", "success");
      }
    }
  });

  colorContainer.addEventListener("change", async (e) => {
    if (e.target.classList.contains("imageUpload")) {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      const uploadInput = e.target;
      const parentItem = e.target.closest('.color-variation-item');
      const statusDiv = parentItem.querySelector('.upload-status');
      const imageUrlsInput = parentItem.querySelector('.imageUrls');
      const uploadedContainer = parentItem.querySelector('.uploaded-images-container');

      const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
      const maxSizeInMB = 5;
      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

      for (const file of files) {
        if (!allowedTypes.includes(file.type)) {
          if (typeof showMessage === "function") {
            showMessage(`Invalid file type for ${file.name}. Please select JPG or PNG images.`, "error");
          } else {
            alert(`Invalid file type for ${file.name}`);
          }
          uploadInput.value = null;
          return;
        }

        if (file.size > maxSizeInBytes) {
          if (typeof showMessage === "function") {
            showMessage(`File ${file.name} is too large. Maximum size is ${maxSizeInMB}MB.`, "error");
          } else {
            alert(`File ${file.name} is too large`);
          }
          uploadInput.value = null;
          return;
        }
      }

      statusDiv.textContent = `Uploading ${files.length} image(s)...`;
      uploadInput.disabled = true;
      submitButton.disabled = true;

      let currentUrls = JSON.parse(imageUrlsInput.value || '[]');
      let successCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        statusDiv.textContent = `Uploading image ${i + 1} of ${files.length}...`;

        const formData = new FormData();
        formData.append("image", file);

        try {
          const response = await fetch(UPLOAD_URL, {
            method: "POST",
            headers: getAuthHeadersForUpload(),
            body: formData,
          });

          if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
              handleAuthError(response);
              return;
            }
            throw new Error("Upload failed");
          }

          const data = await response.json();
          currentUrls.push(data.imageUrl);
          
          const imageItem = document.createElement('div');
          imageItem.className = 'uploaded-image-item';
          imageItem.dataset.imageUrl = data.imageUrl;
          imageItem.innerHTML = `
            <img src="${data.imageUrl}" alt="Uploaded image">
            <button type="button" class="btn-remove-image" data-url="${data.imageUrl}">×</button>
          `;
          uploadedContainer.appendChild(imageItem);
          
          successCount++;
        } catch (error) {
          console.error("Error uploading image:", error);
          if (typeof showMessage === "function") {
            showMessage(`Failed to upload ${file.name}`, "error");
          }
        }
      }

      imageUrlsInput.value = JSON.stringify(currentUrls);
      statusDiv.textContent = `Successfully uploaded ${successCount} of ${files.length} image(s)`;
      
      if (typeof showMessage === "function") {
        showMessage(`${successCount} image(s) uploaded successfully!`, "success");
      }

      uploadInput.disabled = false;
      uploadInput.value = null;
      submitButton.disabled = false;
      
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 3000);
    }
  });

  const populateFormForEdit = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`);
      if (!response.ok) throw new Error("Could not fetch product");
      const product = await response.json();

      document.getElementById("productName").value = product.productName;
      document.getElementById("brand").value = product.brand || "";
      document.getElementById("category").value = product.category;
      document.getElementById("price").value = product.price;
      productIdInput.value = product._id;

      colorContainer.innerHTML = "";
      colorCounter = 0;
      product.colors.forEach((color) => addColorVariationFields(color));
    } catch (error) {
      console.error("Error fetching product for edit:", error);
      if (typeof showMessage === "function") {
        showMessage("Could not load product data.", "error");
      } else {
        alert("Could not load product data.");
      }
      window.location.href = "dashboard.html";
    }
  };

  if (editMode) {
    formTitle.textContent = "Edit Product";
    populateFormForEdit(productId);
  } else {
    addColorVariationFields();
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitButton.disabled = true;
    submitButton.textContent = "Saving...";

    // Check if custom brand input is being used
    if (brandSelect.value === "__OTHER__" && customBrandInput.value.trim()) {
      customBrandInput.blur(); // Trigger the blur event to add brand
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for brand to be added
    }

    const colors = [];
    let hasError = false;
    
    document.querySelectorAll(".color-variation-item").forEach((item) => {
      const imageUrlsStr = item.querySelector(".imageUrls").value;
      const imageUrls = JSON.parse(imageUrlsStr || '[]');
      
      if (imageUrls.length === 0) {
        const colorName = item.querySelector(".colorName").value || "Color variation";
        const msg = `Please upload at least one image for ${colorName}`;
        if (typeof showMessage === "function") showMessage(msg, "error"); else alert(msg);
        hasError = true;
      }
      
      // Collect selected sizes
      const selectedSizes = Array.from(item.querySelectorAll(".size-checkbox:checked"))
        .map(checkbox => checkbox.value);
      
      colors.push({
        colorName: item.querySelector(".colorName").value,
        colorHexCode: item.querySelector(".colorHexCode").value,
        imageUrls: imageUrls,
        sizes: selectedSizes // NEW: Include sizes
      });
    });

    if (hasError) {
      submitButton.disabled = false;
      submitButton.textContent = "Save Product";
      return;
    }

    const productData = {
      productName: document.getElementById("productName").value,
      brand: document.getElementById("brand").value,
      category: document.getElementById("category").value,
      price: document.getElementById("price").value,
      colors: colors,
    };

    try {
      const url = editMode ? `${API_URL}/${productId}` : API_URL;
      const method = editMode ? "PUT" : "POST";
      
      console.log("Submitting product data:", productData);
      
      const response = await fetch(url, {
        method: method,
        headers: getAuthHeaders(),
        body: JSON.stringify(productData),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        console.error("Server error response:", errorData);
        
        if (response.status === 401 || response.status === 403) {
          handleAuthError(response);
          return;
        }
        
        const errorMsg = errorData.message || `Server error: ${response.status}`;
        throw new Error(errorMsg);
      }
      
      const result = await response.json();
      console.log("Product saved successfully:", result);
      
      if (typeof showMessage === "function") {
        showMessage("Product saved successfully!", "success");
      }
      
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1000);
      
    } catch (error) {
      console.error("Error saving product:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      const errorMessage = error.message || "Error saving product. Please try again.";
      if (typeof showMessage === "function") {
        showMessage(errorMessage, "error");
      } else {
        alert(errorMessage);
      }
      
      submitButton.disabled = false;
      submitButton.textContent = "Save Product";
    }
  });
});