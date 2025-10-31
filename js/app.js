document.addEventListener("DOMContentLoaded", () => {
  if (typeof config === "undefined") {
    console.error("ERROR: config.js not loaded!");
    alert("Configuration error. Please ensure config.js is loaded before app.js");
    return;
  }

  const API_URL = config.API_URL + "/products";

  // --- Page elements ---
  const productContainer = document.getElementById("product-container");
  const pageTitleElement = document.getElementById("page-title");

  // --- Filter elements ---
  const filterSidebar = document.getElementById("filter-sidebar");
  const mobileFilterToggle = document.getElementById("mobile-filter-toggle");
  const closeFilterSidebar = document.getElementById("close-filter-sidebar");
  const mobileFilterBackdrop = document.getElementById("mobile-filter-backdrop");
  const sortBy = document.getElementById("sort-by");
  const brandFilterList = document.getElementById("brand-filter-list");
  const applyFiltersBtn = document.getElementById("apply-filters");
  const clearFiltersBtn = document.getElementById("clear-filters");
  const productCountSpan = document.getElementById("product-count");
  const productCountDesktopSpan = document.getElementById("product-count-desktop");

  let glightboxInstance = null;
  let category = "";
  let pageHeader = "";
  let allCategoryProducts = [];
  
  // --- Quick View State ---
  let currentQuickViewProduct = null;
  let currentQuickViewImageIndex = 0;
  let currentQuickViewImageUrls = [];

  // ========================================
  // QUICK VIEW MODAL HELPER FUNCTIONS
  // ========================================

  /**
   * Updates the main image and active thumbnail in the Quick View modal.
   * @param {number} index - The index of the image to display.
   */
  const updateQuickViewImage = (index) => {
    const mainImg = document.getElementById("quick-view-main-img");
    const thumbnails = document.querySelectorAll(".quick-view-thumbnail");
    
    if (currentQuickViewImageUrls[index]) {
      mainImg.src = currentQuickViewImageUrls[index];
      currentQuickViewImageIndex = index;
      
      // Update active thumbnail
      thumbnails.forEach((thumb, i) => {
        if (i === index) {
          thumb.classList.add("active");
          // Scroll thumbnail into view if needed
          thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
          thumb.classList.remove("active");
        }
      });
    }
  };

  /** Displays the next image in the Quick View gallery. */
  const showNextQuickViewImage = () => {
    let nextIndex = currentQuickViewImageIndex + 1;
    if (nextIndex >= currentQuickViewImageUrls.length) {
      nextIndex = 0; // Loop to start
    }
    updateQuickViewImage(nextIndex);
  };

  /** Displays the previous image in the Quick View gallery. */
  const showPrevQuickViewImage = () => {
    let prevIndex = currentQuickViewImageIndex - 1;
    if (prevIndex < 0) {
      prevIndex = currentQuickViewImageUrls.length - 1; // Loop to end
    }
    updateQuickViewImage(prevIndex);
  };


  // ========================================
  // QUICK VIEW MODAL FUNCTIONS
  // ========================================

  const createQuickViewModal = () => {
    const modal = document.createElement("div");
    modal.id = "quick-view-modal";
    modal.className = "quick-view-modal";
    modal.innerHTML = `
      <div class="quick-view-content">
        <button class="quick-view-close" aria-label="Close">&times;</button>
        <div class="quick-view-body">
          <div class="quick-view-gallery">
            <div class="quick-view-main-image" id="quick-view-main-image-container">
              <img src="" alt="" id="quick-view-main-img">
              <button class="quick-view-nav prev" id="quick-view-prev" aria-label="Previous image">&#10094;</button>
              <button class="quick-view-nav next" id="quick-view-next" aria-label="Next image">&#10095;</button>
            </div>
            <div class="quick-view-thumbnails" id="quick-view-thumbnails"></div>
          </div>
          <div class="quick-view-details">
            <div class="quick-view-brand" id="quick-view-brand"></div>
            <h2 class="quick-view-title" id="quick-view-title"></h2>
            <div class="quick-view-price" id="quick-view-price"></div>
            <div class="quick-view-category" id="quick-view-category"></div>
            
            <div class="quick-view-color-section">
              <div>
                <span class="quick-view-color-label">Color:</span>
                <span class="quick-view-color-name" id="quick-view-selected-color"></span>
              </div>
              <div class="quick-view-color-swatches" id="quick-view-colors"></div>
            </div>
            
            <div class="quick-view-size-section">
              <div class="quick-view-size-label">Select Size:</div>
              <div class="quick-view-size-buttons" id="quick-view-sizes"></div>
            </div>
            
            <button class="quick-view-buy-button" id="quick-view-buy">
              Buy on WhatsApp
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector(".quick-view-close").addEventListener("click", closeQuickView);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeQuickView();
    });

    // --- NEW: Navigation Event Listeners ---
    
    // Arrow button clicks
    modal.querySelector("#quick-view-prev").addEventListener("click", showPrevQuickViewImage);
    modal.querySelector("#quick-view-next").addEventListener("click", showNextQuickViewImage);

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (!modal.classList.contains("active")) return;
      if (e.key === "Escape") {
        closeQuickView();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault(); // Prevent page scroll
        showNextQuickViewImage();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault(); // Prevent page scroll
        showPrevQuickViewImage();
      }
    });

    // Swipe navigation
    const mainImageContainer = modal.querySelector("#quick-view-main-image-container");
    let touchStartX = 0;
    let touchEndX = 0;

    mainImageContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    mainImageContainer.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipeGesture();
    }, { passive: true });
    
    function handleSwipeGesture() {
      const swipeThreshold = 50; // Minimum pixels for a swipe
      if (touchEndX < touchStartX - swipeThreshold) { // Swiped left (show next)
        showNextQuickViewImage();
      }
      if (touchEndX > touchStartX + swipeThreshold) { // Swiped right (show prev)
        showPrevQuickViewImage();
      }
    }
    // --- END: New Listeners ---

    return modal;
  };

  const openQuickView = (product) => {
    currentQuickViewProduct = product;
    let modal = document.getElementById("quick-view-modal");
    
    if (!modal) {
      modal = createQuickViewModal();
    }

    // Populate modal
    const firstColor = product.colors[0] || {};
    
    // --- UPDATE: Use state variables ---
    currentQuickViewImageUrls = firstColor.imageUrls || (firstColor.imageUrl ? [firstColor.imageUrl] : []);
    currentQuickViewImageIndex = 0;
    const firstImage = currentQuickViewImageUrls[0] || "https://via.placeholder.com/400x400.png?text=No+Image";
    // --- END UPDATE ---

    document.getElementById("quick-view-brand").textContent = product.brand || "Generic";
    document.getElementById("quick-view-title").textContent = product.productName;
    document.getElementById("quick-view-price").textContent = `₹${product.price}`;
    document.getElementById("quick-view-category").textContent = product.category;
    document.getElementById("quick-view-selected-color").textContent = firstColor.colorName || "Default";

    // Main image
    const mainImg = document.getElementById("quick-view-main-img");
    mainImg.src = firstImage;
    mainImg.alt = product.productName;

    // Color swatches
    const colorsContainer = document.getElementById("quick-view-colors");
    colorsContainer.innerHTML = product.colors.map((color, index) => `
      <button class="quick-view-color-swatch ${index === 0 ? "active" : ""}"
              style="background-color: ${color.colorHexCode || "#ffffff"}"
              data-color-index="${index}"
              title="${color.colorName || 'Color ' + (index + 1)}">
      </button>
    `).join("");

    // Thumbnails
    updateQuickViewThumbnails(currentQuickViewImageUrls, 0); // Use state variable

    // Sizes
    updateQuickViewSizes(firstColor.sizes || []);

    // Show modal
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  };

  const updateQuickViewThumbnails = (imageUrls, activeIndex = 0) => {
    const thumbnailsContainer = document.getElementById("quick-view-thumbnails");
    thumbnailsContainer.innerHTML = imageUrls.map((url, index) => `
      <div class="quick-view-thumbnail ${index === activeIndex ? "active" : ""}" data-image-index="${index}">
        <img src="${url}" alt="Thumbnail ${index + 1}">
      </div>
    `).join("");
  };

  const updateQuickViewSizes = (sizes) => {
    const sizesContainer = document.getElementById("quick-view-sizes");
    if (sizes && sizes.length > 0) {
      sizesContainer.innerHTML = sizes.map(size => `
        <button class="quick-view-size-button" data-size="${size}">${size}</button>
      `).join("");
    } else {
      sizesContainer.innerHTML = '<p class="quick-view-no-sizes">One size fits all</p>';
    }
  };

  const closeQuickView = () => {
    const modal = document.getElementById("quick-view-modal");
    if (modal) {
      modal.classList.remove("active");
      document.body.style.overflow = "";
      currentQuickViewProduct = null;
      currentQuickViewImageUrls = [];
      currentQuickViewImageIndex = 0;
    }
  };

  // Quick view modal event delegation
  document.addEventListener("click", (e) => {
    const modal = document.getElementById("quick-view-modal");
    if (!modal || !currentQuickViewProduct) return;

    // Color swatch click
    if (e.target.matches(".quick-view-color-swatch")) {
      const colorIndex = parseInt(e.target.dataset.colorIndex);
      const selectedColor = currentQuickViewProduct.colors[colorIndex];
      
      if (!selectedColor) return;

      // Update active swatch
      modal.querySelectorAll(".quick-view-color-swatch").forEach(s => s.classList.remove("active"));
      e.target.classList.add("active");

      // Update color name
      document.getElementById("quick-view-selected-color").textContent = selectedColor.colorName || "Default";

      // --- UPDATE: Update state variables and call helpers ---
      currentQuickViewImageUrls = selectedColor.imageUrls || (selectedColor.imageUrl ? [selectedColor.imageUrl] : []);
      const firstImage = currentQuickViewImageUrls[0] || "https://via.placeholder.com/400x400.png?text=No+Image";
      
      // Update main image
      const mainImg = document.getElementById("quick-view-main-img");
      mainImg.src = firstImage;
      currentQuickViewImageIndex = 0; // Reset index

      // Update thumbnails
      updateQuickViewThumbnails(currentQuickViewImageUrls, 0);

      // Update sizes
      updateQuickViewSizes(selectedColor.sizes || []);
      // --- END UPDATE ---
    }

    // Thumbnail click
    if (e.target.closest(".quick-view-thumbnail")) {
      const thumbnail = e.target.closest(".quick-view-thumbnail");
      const imageIndex = parseInt(thumbnail.dataset.imageIndex);
      
      // --- UPDATE: Use helper function ---
      updateQuickViewImage(imageIndex);
      // --- END UPDATE ---
    }

    // Size button click
    if (e.target.matches(".quick-view-size-button")) {
      modal.querySelectorAll(".quick-view-size-button").forEach(btn => btn.classList.remove("active"));
      e.target.classList.add("active");
    }

    // Buy button click
    if (e.target.matches("#quick-view-buy")) {
      const activeColorSwatch = modal.querySelector(".quick-view-color-swatch.active");
      const colorIndex = activeColorSwatch ? parseInt(activeColorSwatch.dataset.colorIndex) : 0;
      const selectedColor = currentQuickViewProduct.colors[colorIndex] || {};

      const activeSizeButton = modal.querySelector(".quick-view-size-button.active");
      const selectedSize = activeSizeButton ? activeSizeButton.dataset.size : "";

      const hasAvailableSizes = selectedColor.sizes && selectedColor.sizes.length > 0;

      if (hasAvailableSizes && !selectedSize) {
        alert("Please select a size before purchasing.");
        const sizeSection = modal.querySelector(".quick-view-size-section");
        sizeSection.classList.add("shake-animation");
        setTimeout(() => sizeSection.classList.remove("shake-animation"), 600);
        return;
      }

      const mainImg = document.getElementById("quick-view-main-img");
      const imageUrl = mainImg.src;

      let message = `🛒 *NEW ORDER REQUEST*\n`;
      message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
      message += `📦 *PRODUCT DETAILS*\n`;
      message += `• Product: *${currentQuickViewProduct.productName}*\n`;
      if (currentQuickViewProduct.brand && currentQuickViewProduct.brand !== "Generic") message += `• Brand: ${currentQuickViewProduct.brand}\n`;
      message += `• Category: ${currentQuickViewProduct.category}\n`;
      message += `• Color: ${selectedColor.colorName || "Default"}\n`;
      if (selectedSize) {
        message += `• Size: *${selectedSize}*\n`;
      } else if (!hasAvailableSizes) {
        message += `• Size: Not Applicable\n`;
      }
      message += `• Price: *₹${currentQuickViewProduct.price}*\n\n`;
      message += `📸 *Selected Image:*\n${imageUrl}\n\n`;
      message += `━━━━━━━━━━━━━━━━━━━━\n`;
      message += `💬 Please confirm availability and proceed with the order.`;

      const whatsappURL = `https://wa.me/919050211616?text=${encodeURIComponent(message)}`;
      window.open(whatsappURL, "_blank");
    }
  });

  // ========================================
  // ORIGINAL FUNCTIONS
  // ========================================

  const fetchProductsByCategory = async (categoryName) => {
    try {
      productContainer.innerHTML = '<p class="text-center text-gray-600">Loading products...</p>';
      const response = await fetch(`${API_URL}?category=${categoryName}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const products = await response.json();

      allCategoryProducts = products;
      populateFilters();
      applyFiltersAndSort();
    } catch (error) {
      console.error("Failed to fetch products:", error);
      productContainer.innerHTML = '<p class="text-center text-red-500">Could not load products. Please ensure the backend server is running and accessible.</p>';
    }
  };

  const populateFilters = () => {
    if (!brandFilterList) return;

    const brands = [...new Set(allCategoryProducts.map((p) => p.brand || "Other"))].sort();

    if (brands.length === 0) {
      brandFilterList.innerHTML = '<p class="text-gray-500 text-sm">No brands available.</p>';
      return;
    }

    brandFilterList.innerHTML = brands.map(brand => `
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" class="brand-checkbox accent-red-500" value="${brand}">
        <span class="text-sm">${brand}</span>
      </label>
    `).join("");
  };

  const applyFiltersAndSort = () => {
    if (!productContainer) return;

    let processedProducts = [...allCategoryProducts];

    // 1. Filter by Brand
    const selectedBrands = Array.from(brandFilterList.querySelectorAll('input[type="checkbox"]:checked')).map((cb) => cb.value);

    if (selectedBrands.length > 0) {
      processedProducts = processedProducts.filter((p) => selectedBrands.includes(p.brand || "Other"));
    }

    // 2. Sort
    const sortValue = sortBy.value;
    switch (sortValue) {
      case "price-asc":
        processedProducts.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        processedProducts.sort((a, b) => b.price - b.price);
        break;
      case "brand-asc":
        processedProducts.sort((a, b) => (a.brand || "Other").localeCompare(b.brand || "Other"));
        break;
      case "brand-desc":
        processedProducts.sort((a, b) => (b.brand || "Other").localeCompare(a.brand || "Other"));
        break;
    }

    // 3. Display
    displayProducts(processedProducts);
  };

  const displayProducts = (products) => {
    productContainer.innerHTML = "";

    const count = products.length;
    const countText = `${count} ${count === 1 ? "Product" : "Products"}`;
    if (productCountSpan) productCountSpan.textContent = countText;
    if (productCountDesktopSpan) productCountDesktopSpan.textContent = countText;

    if (products.length === 0) {
      productContainer.innerHTML = '<p class="text-center text-gray-600">No products found matching your filters.</p>';
      return;
    }

    const productGrid = document.createElement("div");
    productGrid.className = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4";
    productContainer.appendChild(productGrid);

    products.forEach((product) => {
      const card = createProductCard(product);
      productGrid.appendChild(card);
    });

    if (glightboxInstance) glightboxInstance.destroy();
    if (typeof GLightbox !== "undefined") {
      setTimeout(() => {
        glightboxInstance = GLightbox({ selector: ".glightbox" });
      }, 100);
    }
  };

  const createProductCard = (product) => {
    const card = document.createElement("div");
    card.className = "product-card bg-white rounded-lg shadow-lg overflow-hidden flex flex-col group";

    card.dataset.productId = product._id;
    card.dataset.productName = product.productName;
    card.dataset.productBrand = product.brand || "Generic";
    card.dataset.productCategory = product.category;
    card.dataset.productPrice = product.price;
    card.dataset.productColors = JSON.stringify(product.colors);

    const firstColor = product.colors[0] || {};
    const urls = firstColor.imageUrls || (firstColor.imageUrl ? [firstColor.imageUrl] : []);
    const firstImageUrl = urls[0] || "https://via.placeholder.com/400x400.png?text=No+Image";

    const colorSwatchesHTML = product.colors.map((color, index) => `
      <button class="color-swatch ${index === 0 ? "active" : ""}"
              style="background-color: ${color.colorHexCode || "#ffffff"}; border: 1px solid #ccc;"
              data-color-index="${index}"
              aria-label="${color.colorName || 'Color ' + (index + 1)}">
      </button>
    `).join("");

    card.innerHTML = `
      <div class="product-image-container relative overflow-hidden aspect-square cursor-pointer">
        <img src="${firstImageUrl}"
             alt="${product.productName}"
             class="main-product-image w-full h-full object-cover transition-transform duration-300 group-hover:scale-105">
        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center transition-opacity duration-300">
          <button class="quick-view-btn opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-800 px-4 py-2 rounded-lg font-semibold text-sm shadow-lg hover:bg-gray-100">
            View Details
          </button>
        </div>
      </div>
      <div class="product-content p-3 flex-grow flex flex-col text-center">
        ${product.brand ? `<p class="product-brand text-xs text-gray-500 mb-1">${product.brand}</p>` : ''}
        <h3 class="product-name text-sm font-semibold mb-2 leading-tight">${product.productName}</h3>
        <div class="color-swatches mb-3">${colorSwatchesHTML}</div>
        <p class="product-price text-base font-bold mt-auto mb-0">₹${product.price}</p>
      </div>
    `;

    // Quick view button click
    card.querySelector(".quick-view-btn")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openQuickView(product);
    });

    return card;
  };

  // --- Determine Category ---
  const pageTitle = document.title.toLowerCase();
  if (pageTitle.includes("sneaker")) {
    category = "Sneakers";
    pageHeader = "Our Sneaker Collection";
  } else if (pageTitle.includes("boot")) {
    category = "Boots";
    pageHeader = "Our Boot Collection";
  } else if (pageTitle.includes("sandal")) {
    category = "Sandals";
    pageHeader = "Our Sandal Collection";
  } else if (pageTitle.includes("slipper")) {
    category = "Slippers";
    pageHeader = "Our Slipper Collection";
  } else if (pageTitle.includes("formal")) {
    category = "Formal Shoes";
    pageHeader = "Our Formal Shoe Collection";
  
  // ====================================================================
  // ===== THIS IS THE CORRECTED LINE ===================================
  // ====================================================================
  } else if (pageTitle.includes("sport")) { // <-- IT NOW CHECKS FOR "sport" (singular)
    category = "Sport Shoes"; 
    pageHeader = "Our Sport Shoe Collection"; 
  }
  // ====================================================================
  // ====================================================================
  // ====================================================================


  // --- Initialize Page ---
  if (category && productContainer) {
    if (pageTitleElement) {
      pageTitleElement.textContent = pageHeader;
      const descElement = pageTitleElement.nextElementSibling;
      if (descElement) {
        descElement.textContent = "Filter and sort to find the perfect pair for your style.";
      }
    }

    fetchProductsByCategory(category);

    // Filter event listeners
    if (mobileFilterToggle) {
      mobileFilterToggle.addEventListener("click", () => {
        filterSidebar.classList.add("open");
        mobileFilterBackdrop.classList.add("open");
      });
    }

    if (closeFilterSidebar) {
      closeFilterSidebar.addEventListener("click", () => {
        filterSidebar.classList.remove("open");
        mobileFilterBackdrop.classList.remove("open");
      });
    }

    if (mobileFilterBackdrop) {
      mobileFilterBackdrop.addEventListener("click", () => {
        filterSidebar.classList.remove("open");
        mobileFilterBackdrop.classList.remove("open");
      });
    }

    if (applyFiltersBtn) {
      applyFiltersBtn.addEventListener("click", () => {
        applyFiltersAndSort();
        if (window.innerWidth < 768) {
          filterSidebar.classList.remove("open");
          mobileFilterBackdrop.classList.remove("open");
        }
      });
    }

    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener("click", () => {
        if (sortBy) sortBy.value = "default";
        if (brandFilterList) {
          brandFilterList.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
            checkbox.checked = false;
          });
        }
        applyFiltersAndSort();
        if (window.innerWidth < 768) {
          filterSidebar.classList.remove("open");
          mobileFilterBackdrop.classList.remove("open");
        }
      });
    }
  }

  // Color swatch interaction on card
  if (productContainer) {
    productContainer.addEventListener("click", function (e) {
      const card = e.target.closest(".product-card");
      if (!card) return;

      const productColors = JSON.parse(card.dataset.productColors || "[]");

      if (e.target.matches(".color-swatch")) {
        e.preventDefault();
        e.stopPropagation();

        const colorIndex = parseInt(e.target.dataset.colorIndex);
        if (isNaN(colorIndex) || colorIndex < 0 || colorIndex >= productColors.length) return;

        const selectedColor = productColors[colorIndex];

        card.querySelectorAll(".color-swatch").forEach((swatch) => swatch.classList.remove("active"));
        e.target.classList.add("active");

        const mainImage = card.querySelector(".main-product-image");
        const urls = selectedColor.imageUrls || (selectedColor.imageUrl ? [selectedColor.imageUrl] : []);
        const newImageUrl = urls[0] || "https://via.placeholder.com/800x800.png?text=No+Image";

        if (mainImage) {
          mainImage.src = newImageUrl;
          mainImage.alt = `${card.dataset.productName} - ${selectedColor.colorName || ""}`;
        }
      }
    });
  }
});