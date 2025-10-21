// backend/routes/productRoutes.js

const express = require("express");
const router = express.Router();
const Product = require("../models/productModel");
const { protect } = require("../middleware/auth");

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
          message: `Color "${color.colorName || `#${i+1}`}" must have at least one image`
        });
      }
      
      // Convert single imageUrl to imageUrls array for consistency
      if (color.imageUrl && !color.imageUrls) {
        color.imageUrls = [color.imageUrl];
        delete color.imageUrl;
      }
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
            message: `Color "${color.colorName || `#${i+1}`}" must have at least one image`
          });
        }
        
        // Convert single imageUrl to imageUrls array
        if (color.imageUrl && !color.imageUrls) {
          color.imageUrls = [color.imageUrl];
          delete color.imageUrl;
        }
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

// @desc   Delete a product
// @route  DELETE /api/products/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      console.log("Product deleted successfully:", req.params.id);
      res.json({ message: "Product removed" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

module.exports = router;