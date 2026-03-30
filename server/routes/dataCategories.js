const express = require('express');
const router = express.Router();
const DataCategory = require('../models/DataCategory');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const categories = await DataCategory.find().sort({ order: 1 });
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const newCategory = new DataCategory(req.body);
    const category = await newCategory.save();
    res.json(category);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
