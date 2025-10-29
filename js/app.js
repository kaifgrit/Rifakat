// js/app.js - CORRECTED ORDER & ENHANCED VERSION

document.addEventListener("DOMContentLoaded", () => {
  if (typeof config === "undefined") {
    console.error("ERROR: config.js not loaded!");
    alert(
      "Configuration error. Please ensure config.js is loaded before app.js"
    );
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
  const mobileFilterBackdrop = document.getElementById(
    "mobile-filter-backdrop"
  );
  const sortBy = document.getElementById("sort-by");
  const brandFilterList = document.getElementById("brand-filter-list");
  const applyFiltersBtn = document.getElementById("apply-filters");
  const clearFiltersBtn = document.getElementById("clear-filters");
  const productCountSpan = document.getElementById("product-count");
  const productCountDesktopSpan = document.getElementById(
    "product-count-desktop"
  );

  let glightboxInstance = null;
  let category = "";
  let pageHeader = "";
  let allCategoryProducts = []; // Master product list

  // ==========================================================
  // START: MOVED FUNCTION DEFINITIONS EARLIER
  // ==========================================================

  const fetchProductsByCategory = async (categoryName) => {
    try {
      productContainer.innerHTML =
        '<p class="text-center text-gray-600">Loading products...</p>'; // Show loading message
      const response = await fetch(`${API_URL}?category=${categoryName}`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const products = await response.json();

      allCategoryProducts = products;
      populateFilters();
      applyFiltersAndSort(); // This will call displayProducts
    } catch (error) {
      console.error("Failed to fetch products:", error);
      productContainer.innerHTML =
        '<p class="text-center text-red-500">Could not load products. Please ensure the backend server is running and accessible.</p>';
    }
  };

  const populateFilters = () => {
    if (!brandFilterList) return;

    const brands = [
      ...new Set(allCategoryProducts.map((p) => p.brand || "Other")),
    ].sort();

    if (brands.length === 0) {
      brandFilterList.innerHTML =
        '<p class="text-gray-500 text-sm">No brands available.</p>';
      return;
    }

    brandFilterList.innerHTML = brands
      .map(
        (brand) => `
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" class="brand-checkbox accent-red-500" value="${brand}">
        <span class="text-sm">${brand}</span>
      </label>
    `
      )
      .join("");
  };

  const applyFiltersAndSort = () => {
    if (!productContainer) return; // Don't run on index.html

    let processedProducts = [...allCategoryProducts];

    // 1. Filter by Brand
    const selectedBrands = Array.from(
      brandFilterList.querySelectorAll('input[type="checkbox"]:checked')
    ).map((cb) => cb.value);

    if (selectedBrands.length > 0) {
      processedProducts = processedProducts.filter((p) =>
        selectedBrands.includes(p.brand || "Other")
      );
    }

    // 2. Sort
    const sortValue = sortBy.value;
    switch (sortValue) {
      case "price-asc":
        processedProducts.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        processedProducts.sort((a, b) => b.price - a.price);
        break;
      case "brand-asc":
        processedProducts.sort((a, b) =>
          (a.brand || "Other").localeCompare(b.brand || "Other")
        );
        break;
      case "brand-desc":
        processedProducts.sort((a, b) =>
          (b.brand || "Other").localeCompare(a.brand || "Other")
        );
        break;
      // 'default' case does nothing, keeps original (fetched) order
    }

    // 3. Display
    displayProducts(processedProducts);
  };

  const displayProducts = (products) => {
    productContainer.innerHTML = ""; // Clear previous content or loading message

    // Update product count
    const count = products.length;
    const countText = `${count} ${count === 1 ? "Product" : "Products"}`;
    if (productCountSpan) productCountSpan.textContent = countText;
    if (productCountDesktopSpan)
      productCountDesktopSpan.textContent = countText;

    if (products.length === 0) {
      productContainer.innerHTML =
        '<p class="text-center text-gray-600">No products found matching your filters.</p>';
      return;
    }

    const sortValue = sortBy ? sortBy.value : "default";

    // Always display in a single grid, respecting the sort order
    const productGrid = document.createElement("div");
    productGrid.className =
      "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4";
    productContainer.appendChild(productGrid);

    products.forEach((product) => {
      const card = createProductCard(product);
      productGrid.appendChild(card);
    });

    // Re-initialize GLightbox after products are displayed
    if (glightboxInstance) glightboxInstance.destroy();
    if (typeof GLightbox !== "undefined") {
      setTimeout(() => {
        // Add a small delay for images to potentially load
        glightboxInstance = GLightbox({ selector: ".glightbox" });
      }, 100);
    } else {
      console.warn("GLightbox library not found or loaded.");
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
    const firstImageUrl = urls[0] || 'https://via.placeholder.com/400x400.png?text=No+Image';

    const colorSwatchesHTML = product.colors.map((color, index) => `
        <button class="color-swatch ${index === 0 ? "active" : ""}"
                style="background-color: ${color.colorHexCode || "#ffffff"}; border: 1px solid #ccc;"
                data-color-index="${index}"
                aria-label="${color.colorName || 'Color ' + (index + 1)}">
        </button>
    `).join("");

    // --- CLEANED HTML STRING (Removed comments) ---
    card.innerHTML = `
      <a href="${firstImageUrl}" class="glightbox product-image-container relative overflow-hidden aspect-square block" data-gallery="product-${product._id}">
        <img src="${firstImageUrl}"
             alt="${product.productName}"
             class="main-product-image w-full h-full object-cover transition-transform duration-300 group-hover:scale-105">
        <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center transition-opacity duration-300 pointer-events-none">
           <svg class="w-8 h-8 text-white opacity-0 group-hover:opacity-80 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
         </div>
      </a>
      <div class="product-content p-3 flex-grow flex flex-col text-center">
        ${product.brand ? `<p class="product-brand text-xs text-gray-500 mb-1">${product.brand}</p>` : ''}
        <h3 class="product-name text-sm font-semibold mb-2 leading-tight">${product.productName}</h3>
        <div class="color-swatches mb-3">${colorSwatchesHTML}</div>
        <p class="product-price text-base font-bold mt-auto mb-3">₹${product.price}</p>
        <button class="buy-button cta-button block w-full text-white font-bold py-2 px-3 rounded-md text-xs uppercase tracking-wider">
          Buy on WhatsApp
        </button>
      </div>
    `;
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
  }

  // --- Initialize Page ---
  if (category && productContainer) {
    if (pageTitleElement) {
      pageTitleElement.textContent = pageHeader;
      const descElement = pageTitleElement.nextElementSibling;
      if (descElement) {
        descElement.textContent =
          "Filter and sort to find the perfect pair for your style.";
      }
    }

    // Initial fetch - NOW HAPPENS AFTER FUNCTION IS DEFINED
    fetchProductsByCategory(category);

    // --- Add event listeners for filter UI ---
    if (mobileFilterToggle) {
      mobileFilterToggle.addEventListener("click", () => {
        filterSidebar.classList.add("open");
        mobileFilterBackdrop.classList.add("open");
      });
    }
    // ... (rest of the filter event listeners remain the same) ...
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
        // Close sidebar on mobile after applying
        if (window.innerWidth < 768) {
          filterSidebar.classList.remove("open");
          mobileFilterBackdrop.classList.remove("open");
        }
      });
    }

    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener("click", () => {
        if (sortBy) sortBy.value = "default"; // Check if sortBy exists
        if (brandFilterList) {
          // Check if brandFilterList exists
          brandFilterList
            .querySelectorAll('input[type="checkbox"]')
            .forEach((checkbox) => {
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
  } // --- End of category page logic ---

  // --- Event Listener for Product Card Interactions (Color change, Size select, Buy, Image click) ---
  if (productContainer) {
    productContainer.addEventListener("click", function (e) {
      const card = e.target.closest(".product-card");
      if (!card) return;

      const productColors = JSON.parse(card.dataset.productColors || "[]"); // Add default empty array

      // --- Color Swatch Click ---
      if (e.target.matches(".color-swatch")) {
        e.preventDefault();
        e.stopPropagation();

        const colorIndex = parseInt(e.target.dataset.colorIndex);
        if (
          isNaN(colorIndex) ||
          colorIndex < 0 ||
          colorIndex >= productColors.length
        )
          return; // Basic validation

        const selectedColor = productColors[colorIndex];

        // Update active swatch
        card
          .querySelectorAll(".color-swatch")
          .forEach((swatch) => swatch.classList.remove("active"));
        e.target.classList.add("active");

        // Update main image and lightbox link
        const mainImage = card.querySelector(".main-product-image");
        const imageLink = card.querySelector(
          ".product-image-container.glightbox"
        ); // Target the link now
        const urls =
          selectedColor.imageUrls ||
          (selectedColor.imageUrl ? [selectedColor.imageUrl] : []);
        const newImageUrl =
          urls[0] || "https://via.placeholder.com/800x800.png?text=No+Image";

        if (mainImage) {
          mainImage.src = newImageUrl;
          mainImage.alt = `${card.dataset.productName} - ${
            selectedColor.colorName || ""
          }`;
        }
        if (imageLink) {
          imageLink.href = newImageUrl; // Update the href for GLightbox
          imageLink.dataset.gallery = `product-${card.dataset.productId}-${colorIndex}`; // Unique gallery per color
        }

        // Update sizes
        const sizeButtonsGrid = card.querySelector(".size-buttons-grid");
        const sizeContainer = card.querySelector(".size-buttons-container");

        if (sizeButtonsGrid) {
          if (selectedColor.sizes && selectedColor.sizes.length > 0) {
            const sizeButtons = selectedColor.sizes
              .map(
                (size) =>
                  `<button class="size-button" data-size="${size}" type="button">${size}</button>`
              )
              .join("");
            sizeButtonsGrid.innerHTML = sizeButtons;
            if (sizeContainer) sizeContainer.style.display = "block"; // Make sure container is visible
          } else {
            sizeButtonsGrid.innerHTML =
              '<span class="text-gray-500 text-sm">Sizes not available for this color</span>';
            if (sizeContainer) sizeContainer.style.display = "block"; // Keep container visible to show message
          }
        } else if (sizeContainer) {
          // If the grid doesn't exist but container does, hide container if no sizes
          sizeContainer.style.display =
            selectedColor.sizes && selectedColor.sizes.length > 0
              ? "block"
              : "none";
        }
      }
      // --- Size Button Click ---
      else if (e.target.matches(".size-button")) {
        e.preventDefault();
        e.stopPropagation();

        card
          .querySelectorAll(".size-button")
          .forEach((btn) => btn.classList.remove("active"));
        e.target.classList.add("active");
      }
      // --- Buy Button Click ---
      else if (e.target.matches(".buy-button")) {
        e.preventDefault();
        e.stopPropagation();

        const productName = card.dataset.productName;
        const productBrand = card.dataset.productBrand;
        const productCategory = card.dataset.productCategory;
        const productPrice = card.dataset.productPrice;

        const activeSwatch = card.querySelector(".color-swatch.active");
        const activeSwatchIndex = activeSwatch
          ? parseInt(activeSwatch.dataset.colorIndex)
          : 0;
        const selectedColor =
          productColors[activeSwatchIndex >= 0 ? activeSwatchIndex : 0] || {};

        const colorName = selectedColor.colorName || "Default";

        const activeSizeButton = card.querySelector(".size-button.active");
        let selectedSize = "";

        const hasAvailableSizes =
          selectedColor.sizes && selectedColor.sizes.length > 0;

        if (activeSizeButton) {
          selectedSize = activeSizeButton.dataset.size;
        } else if (hasAvailableSizes) {
          // Only require size selection if sizes ARE available for the selected color
          alert("Please select a size before purchasing.");
          const sizeContainer = card.querySelector(".size-buttons-container");
          if (sizeContainer) {
            sizeContainer.classList.add("shake-animation");
            setTimeout(() => {
              sizeContainer.classList.remove("shake-animation");
            }, 600);
          }
          return; // Stop processing
        }
        // If no sizes are available for this color, proceed without size

        // Get the current image URL from the main image tag
        const mainImage = card.querySelector(".main-product-image");
        const imageUrl = mainImage
          ? mainImage.src
          : productColors[0]?.imageUrls?.[0] || ""; // Fallback image

        // Create rich formatted message
        let message = `🛒 *NEW ORDER REQUEST*\n`;
        message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

        message += `📦 *PRODUCT DETAILS*\n`;
        message += `• Product: *${productName}*\n`;
        if (productBrand !== "Generic") message += `• Brand: ${productBrand}\n`;
        message += `• Category: ${productCategory}\n`;
        message += `• Color: ${colorName}\n`;
        if (selectedSize) {
          message += `• Size: *${selectedSize}*\n`;
        } else if (!hasAvailableSizes) {
          message += `• Size: Not Applicable\n`; // Indicate size wasn't needed
        }
        message += `• Price: *₹${productPrice}*\n\n`;

        message += `📸 *Selected Image:*\n`;
        message += `${imageUrl}\n\n`; // Use the currently displayed image

        message += `━━━━━━━━━━━━━━━━━━━━\n`;
        message += `💬 Please confirm availability and proceed with the order.`;

        const whatsappURL = `https://wa.me/919050211616?text=${encodeURIComponent(
          message
        )}`;
        window.open(whatsappURL, "_blank");
      }
      // NOTE: Image click for lightbox is handled automatically by GLightbox via the <a> tag now.
    });
  } // --- End of productContainer logic ---
}); // --- End of DOMContentLoaded ---
