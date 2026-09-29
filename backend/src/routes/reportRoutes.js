const express = require('express');
const router = express.Router();

// GET route (existing)
router.get('/', (req, res) => {
  res.json({ message: 'Report route working' });
});

// POST route (added for report submission)
router.post('/', (req, res) => {
  console.log('Received Report Data:', req.body);
  res.status(201).json({
    success: true,
    message: 'Report submitted successfully!',
    data: req.body
  });
});

module.exports = router;  