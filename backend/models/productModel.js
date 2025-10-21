const mongoose = require("mongoose");

const colorSchema = new mongoose.Schema({
  colorName: { type: String, required: true },
  colorHexCode: { type: String },
  // Support both old and new format
  imageUrls: { 
    type: [String],
    default: undefined, // Allow it to be optional for backward compatibility
    validate: {
      validator: function(v) {
        // If imageUrls exists, it must have at least one URL
        return !v || v.length > 0;
      },
      message: 'If imageUrls is provided, at least one image URL is required'
    }
  },
  // Keep old format for backward compatibility
  imageUrl: { 
    type: String,
    required: function() {
      // imageUrl is required only if imageUrls is not provided
      return !this.imageUrls || this.imageUrls.length === 0;
    }
  }
});

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true, trim: true },
  brand: { type: String, trim: true },
  category: {
    type: String,
    required: true,
    enum: ["Sneakers", "Boots", "Sandals", "Slippers", "Formal Shoes"],
  },
  price: { type: Number, required: true },
  colors: {
    type: [colorSchema],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one color variation is required'
    }
  },
});

// Database Indexes
productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ productName: "text" });

module.exports = mongoose.model("Product", productSchema);