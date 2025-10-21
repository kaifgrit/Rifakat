// backend/routes/uploadRoutes.js

const express = require('express');
const router = express.Router();
const upload = require('../config/cloudinaryConfig'); // Import our uploader
const { protect } = require('../middleware/auth'); // --- Import middleware ---

// @desc   Upload an image file
// @route  POST /api/upload
// --- This route is PROTECTED ---
router.post('/', protect, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send({ message: 'No file uploaded.' });
  }
  
  res.status(201).send({
    message: 'Image uploaded successfully',
    imageUrl: req.file.path
  });
});

module.exports = router;