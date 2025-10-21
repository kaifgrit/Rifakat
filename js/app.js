// js/app.js

document.addEventListener("DOMContentLoaded", () => {
  if (typeof config === 'undefined') {
    console.error("ERROR: config.js not loaded!");
    alert("Configuration error. Please ensure config.js is loaded before app.js");
    return;
  }

  const API_URL = config.API_URL + "/products";
  const productContainer = document.getElementById("product-container");
  const pageTitleElement = document.getElementById("page-title");

  let glightboxInstance = null;
  const pageTitle = document.title.toLowerCase();
  let category = "";
  let pageHeader = "";

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

  if (!category || !productContainer) return;

  if (pageTitleElement) {
    pageTitleElement.textContent = pageHeader;
    const descElement = pageTitleElement.nextElementSibling;
    if (descElement) {
      descElement.textContent = "Find the perfect pair for your style.";
    }
  }

  const fetchProductsByCategory = async (categoryName) => {
    try {
      const response = await fetch(`${API_URL}?category=${categoryName}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const products = await response.json();
      displayProducts(products);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      productContainer.innerHTML =
        '<p class="text-center text-red-500">Could not load products. Please ensure the backend server is running and accessible.</p>';
    }
  };

  const displayProducts = (products) => {
    productContainer.innerHTML = "";

    if (!products || products.length === 0) {
      productContainer.innerHTML = '<p class="text-center text-gray-600">No products found in this category yet.</p>';
      return;
    }

    const productsByBrand = products.reduce((acc, product) => {
      const brand = product.brand || "Other";
      if (!acc[brand]) acc[brand] = [];
      acc[brand].push(product);
      return acc;
    }, {});

    const brandOrder = ["Nike", "Adidas", "Puma"];
    const sortedBrands = Object.keys(productsByBrand).sort((a, b) => {
      if (a === "Other") return 1;
      if (b === "Other") return -1;
      const indexA = brandOrder.indexOf(a);
      const indexB = brandOrder.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });

    sortedBrands.forEach((brand) => {
      const brandHeader = document.createElement("h2");
      brandHeader.className = "text-3xl font-bold mt-12 mb-6 text-center border-b pb-2";
      brandHeader.textContent = brand === "Other" ? "More Styles" : brand;
      productContainer.appendChild(brandHeader);

      const brandGrid = document.createElement("div");
      brandGrid.className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8";
      productContainer.appendChild(brandGrid);

      productsByBrand[brand].forEach((product) => {
        const card = createProductCard(product);
        brandGrid.appendChild(card);
      });
    });

    if (glightboxInstance) glightboxInstance.destroy();
    if (typeof GLightbox !== "undefined") {
      glightboxInstance = GLightbox({ selector: ".glightbox" });
    }
  };

  const createProductCard = (product) => {
    const card = document.createElement("div");
    card.className = "product-card bg-white rounded-lg shadow-lg overflow-hidden flex flex-col group";

    card.dataset.productId = product._id;
    card.dataset.productName = product.productName;
    card.dataset.productPrice = product.price;
    card.dataset.productColors = JSON.stringify(product.colors);

    // Handle BOTH imageUrls (array) AND imageUrl (single)
    const urls = product.colors[0].imageUrls || (product.colors[0].imageUrl ? [product.colors[0].imageUrl] : []);
    const firstImageUrl = urls[0] || '';

    // Build color swatches
    const colorSwatchesHTML = product.colors.map((color, index) => `
        <button class="color-swatch ${index === 0 ? "active" : ""}" 
                style="background-color: ${color.colorHexCode || "#ffffff"};" 
                data-color-index="${index}" 
                aria-label="${color.colorName}">
        </button>
    `).join("");

    card.innerHTML = `
      <div class="product-image-container relative overflow-hidden h-64 cursor-pointer">
        <img src="${firstImageUrl}" 
             alt="${product.productName}" 
             class="main-product-image w-full h-full object-cover transition-transform duration-300">
        <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <h3 class="text-white text-2xl font-bold text-center p-4">${product.productName}</h3>
        </div>
      </div>
      <div class="p-6 flex-grow flex flex-col text-center">
        <h3 class="text-xl font-bold product-name">${product.productName}</h3>
        <div class="color-swatches">${colorSwatchesHTML}</div>
        <p class="text-lg font-semibold mt-2 mb-4 product-price">₹${product.price}</p>
        <button class="buy-button mt-auto cta-button block text-white font-bold py-2 px-4 rounded-full uppercase tracking-wider">
          Buy on WhatsApp
        </button>
      </div>
    `;
    return card;
  };

  productContainer.addEventListener("click", function (e) {
    const card = e.target.closest(".product-card");
    if (!card) return;

    // Handle color swatch click
    if (e.target.matches(".color-swatch")) {
      e.preventDefault();
      e.stopPropagation();
      
      const colorIndex = parseInt(e.target.dataset.colorIndex);
      const productColors = JSON.parse(card.dataset.productColors);
      const selectedColor = productColors[colorIndex];
      
      // Update active swatch
      card.querySelectorAll(".color-swatch").forEach(swatch => swatch.classList.remove("active"));
      e.target.classList.add("active");

      // Update main image
      const mainImage = card.querySelector(".main-product-image");
      const urls = selectedColor.imageUrls || (selectedColor.imageUrl ? [selectedColor.imageUrl] : []);
      if (urls[0]) {
        mainImage.src = urls[0];
        mainImage.alt = `${card.dataset.productName} - ${selectedColor.colorName}`;
      }
    } 
    // Handle image click - open lightbox with all images of selected color
    else if (e.target.closest(".product-image-container")) {
      e.preventDefault();
      e.stopPropagation();
      
      const activeSwatchIndex = Array.from(card.querySelectorAll(".color-swatch")).findIndex(s => s.classList.contains("active"));
      const productColors = JSON.parse(card.dataset.productColors);
      const selectedColor = productColors[activeSwatchIndex];
      
      // Get all images for this color
      const urls = selectedColor.imageUrls || (selectedColor.imageUrl ? [selectedColor.imageUrl] : []);
      
      // Create lightbox elements
      const lightboxElements = urls.map(url => ({
        href: url,
        type: 'image',
        title: `${card.dataset.productName} - ${selectedColor.colorName}`
      }));
      
      // Destroy existing instance and create new one
      if (glightboxInstance) glightboxInstance.destroy();
      glightboxInstance = GLightbox({
        elements: lightboxElements,
        startAt: 0
      });
      glightboxInstance.open();
    } 
    // Handle buy button
    else if (e.target.matches(".buy-button")) {
      e.preventDefault();
      e.stopPropagation();

      const productName = card.dataset.productName;
      const productPrice = card.dataset.productPrice;
      const activeSwatchIndex = Array.from(card.querySelectorAll(".color-swatch")).findIndex(s => s.classList.contains("active"));
      const productColors = JSON.parse(card.dataset.productColors);
      const colorName = productColors[activeSwatchIndex]?.colorName || "Default";

      const message = `Hello, I'm interested in buying:\n\n*Product:* ${productName}\n*Color:* ${colorName}\n*Price:* ₹${productPrice}`;
      const whatsappURL = `https://wa.me/919050211616?text=${encodeURIComponent(message)}`;
      window.open(whatsappURL, "_blank");
    }
  });

  fetchProductsByCategory(category);
});