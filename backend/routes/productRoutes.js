// backend/routes/productRoutes.js

const express = require("express");
const router = express.Router();
const Product = require("../models/productModel");
const { protect } = require("../middleware/auth");
const cloudinary = require('cloudinary').v2; // <-- ADDED THIS

/**
 * Helper function to extract the Cloudinary public_id from a full URL.
 * e.g., "http://res.cloudinary.com/dxouvnf7y/image/upload/v168000/rifakat-shoe-garden/abc.jpg"
 * becomes "rifakat-shoe-garden/abc"
 */
const getPublicIdFromUrl = (url) => {
  try {
    const parts = url.split('/');
    // Find the index of 'upload'
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1 || uploadIndex + 2 >= parts.length) {
      // Check if 'upload' exists and there are parts after the version number
      console.warn('Could not find standard Cloudinary path structure in url:', url);
      return null;
    }

    // Get the parts after the version number (e.g., ['rifakat-shoe-garden', 'abc.jpg'])
    const pathParts = parts.slice(uploadIndex + 2);
    if (pathParts.length === 0) return null;

    // Join the path parts: 'rifakat-shoe-garden/abc.jpg'
    const publicIdWithExt = pathParts.join('/');

    // Remove the extension: 'rifakat-shoe-garden/abc'
    const lastDotIndex = publicIdWithExt.lastIndexOf('.');
    const publicId = lastDotIndex === -1 ? publicIdWithExt : publicIdWithExt.substring(0, lastDotIndex);

    return publicId;
  } catch (e) {
    console.error('Could not parse public_id from url:', url, e);
    return null;
  }
}


// @desc   Fetch all products or filter by category
// @route  GET /api/products
router.get("/", async (req, res) => {
  try {
    const filter = req.query.category ? { category: req.query.category } : {};
    const products = await Product.find(filter);
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// @desc   Fetch a single product by ID
// @route  GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// @desc   Create a new product
// @route  POST /api/products
router.post("/", protect, async (req, res) => {
  try {
    const { productName, brand, price, category, colors } = req.body;

    // Validation
    if (!productName || !price || !category || !colors || colors.length === 0) {
      return res.status(400).json({
        message: "Missing required fields",
        required: ["productName", "price", "category", "colors (at least one)"]
      });
    }

    // Validate each color has images
    for (let i = 0; i < colors.length; i++) {
      const color = colors[i];
      const hasImages = (color.imageUrls && color.imageUrls.length > 0) || color.imageUrl;

      if (!hasImages) {
        return res.status(400).json({
          message: `Color "${color.colorName || `#${i + 1}`}" must have at least one image`
        });
      }

      // Convert single imageUrl to imageUrls array for consistency
      if (color.imageUrl && (!color.imageUrls || color.imageUrls.length === 0)) {
        color.imageUrls = [color.imageUrl];
      }
      // Remove the old single imageUrl if it exists after conversion
      if (color.imageUrl) delete color.imageUrl;
    }

    const product = new Product({
      productName,
      brand: brand || undefined, // Use undefined instead of empty string
      price,
      category,
      colors,
    });

    const createdProduct = await product.save();
    console.log("Product created successfully:", createdProduct._id);
    res.status(201).json(createdProduct);

  } catch (error) {
    console.error("Error creating product:", error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: errors
      });
    }

    res.status(500).json({
      message: "Server Error while creating product",
      error: error.message
    });
  }
});

// @desc   Update a product
// @route  PUT /api/products/:id
router.put("/:id", protect, async (req, res) => {
  try {
    const { productName, brand, price, category, colors } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Validate colors have images
    if (colors) {
      for (let i = 0; i < colors.length; i++) {
        const color = colors[i];
        const hasImages = (color.imageUrls && color.imageUrls.length > 0) || color.imageUrl;

        if (!hasImages) {
          return res.status(400).json({
            message: `Color "${color.colorName || `#${i + 1}`}" must have at least one image`
          });
        }

        // Convert single imageUrl to imageUrls array
        if (color.imageUrl && (!color.imageUrls || color.imageUrls.length === 0)) {
          color.imageUrls = [color.imageUrl];
        }
        // Remove the old single imageUrl if it exists after conversion
        if (color.imageUrl) delete color.imageUrl;
      }
    }

    product.productName = productName || product.productName;
    product.brand = brand !== undefined ? brand : product.brand;
    product.price = price || product.price;
    product.category = category || product.category;
    product.colors = colors || product.colors;

    const updatedProduct = await product.save();
    console.log("Product updated successfully:", updatedProduct._id);
    res.json(updatedProduct);

  } catch (error) {
    console.error("Error updating product:", error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: errors
      });
    }

    res.status(500).json({
      message: "Server Error while updating product",
      error: error.message
    });
  }
});

// @desc   Delete a single product
// @route  DELETE /api/products/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (product) {
      // 1. Collect all public_ids from all color variations
      const publicIds = [];
      product.colors.forEach(color => {
        if (color.imageUrls && color.imageUrls.length > 0) {
          color.imageUrls.forEach(url => {
            const publicId = getPublicIdFromUrl(url);
            if (publicId) {
              publicIds.push(publicId);
            } else {
              console.warn(`Could not extract public_id for deletion from URL: ${url}`);
            }
          });
        }
      });

      // 2. Tell Cloudinary to delete all these images
      if (publicIds.length > 0) {
        console.log(`Attempting to delete ${publicIds.length} assets from Cloudinary for product ${req.params.id}:`, publicIds);
        try {
          const result = await cloudinary.api.delete_resources(publicIds);
          console.log("Cloudinary deletion result:", result);
        } catch (cldError) {
          console.error("Cloudinary delete error (non-fatal):", cldError.message || cldError);
          // Log but continue, as we still want to remove from DB
        }
      } else {
         console.log(`No Cloudinary images found to delete for product ${req.params.id}`);
      }
      
      // 3. Delete the product from MongoDB
      await Product.deleteOne({ _id: req.params.id }); // Use deleteOne with filter
      
      console.log("Product deleted successfully from DB:", req.params.id);
      res.json({ message: "Product and associated images removed" });
      
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});


// --- START: NEW BATCH DELETE ROUTE ---
// @desc   Delete multiple products by their IDs
// @route  DELETE /api/products/batch
router.delete("/batch", protect, async (req, res) => {
  try {
    const { ids } = req.body; // Expect an array of IDs in the request body

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Invalid input: 'ids' must be a non-empty array." });
    }

    // 1. Find all products matching the provided IDs
    const productsToDelete = await Product.find({ _id: { $in: ids } });

    if (!productsToDelete || productsToDelete.length === 0) {
      return res.status(404).json({ message: "No products found matching the provided IDs." });
    }

    // 2. Collect all Cloudinary public_ids from all products and their color variations
    const allPublicIds = [];
    productsToDelete.forEach(product => {
      product.colors.forEach(color => {
        if (color.imageUrls && color.imageUrls.length > 0) {
          color.imageUrls.forEach(url => {
            const publicId = getPublicIdFromUrl(url);
            if (publicId) {
              allPublicIds.push(publicId);
            } else {
              console.warn(`Batch delete: Could not extract public_id from URL: ${url}`);
            }
          });
        }
      });
    });
    
    const uniquePublicIds = [...new Set(allPublicIds)]; // Ensure uniqueness

    // 3. Tell Cloudinary to delete all collected images
    if (uniquePublicIds.length > 0) {
      console.log(`Attempting to batch delete ${uniquePublicIds.length} assets from Cloudinary for products:`, ids);
      try {
        const result = await cloudinary.api.delete_resources(uniquePublicIds);
        console.log("Cloudinary batch deletion result:", result);
      } catch (cldError) {
        console.error("Cloudinary batch delete error (non-fatal):", cldError.message || cldError);
        // Log but continue
      }
    } else {
      console.log(`No Cloudinary images found to batch delete for products:`, ids);
    }

    // 4. Delete all products from MongoDB
    const deleteResult = await Product.deleteMany({ _id: { $in: ids } });

    console.log(`Batch delete successful from DB: ${deleteResult.deletedCount} products removed.`);
    res.json({ 
      message: `Successfully deleted ${deleteResult.deletedCount} product(s) and associated images.`,
      deletedCount: deleteResult.deletedCount 
    });

  } catch (error) {
    console.error("Error during batch delete:", error);
    res.status(500).json({ message: "Server Error during batch deletion", error: error.message });
  }
});
// --- END: NEW BATCH DELETE ROUTE ---


module.exports = router;