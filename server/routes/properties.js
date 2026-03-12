const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Property = require('../models/Property');
const User = require('../models/User');

// @route   POST api/properties
// @desc    Add a new property record (Admin or Verified Valuer)
router.post('/', auth, async (req, res) => {
  const { location, propertyInfo, marketData, dataSourceReference } = req.body;

  try {
    // TEMPORARY: Allow all users to access for testing/demo
    // if (req.user.role !== 'Admin' && req.user.subscriptionStatus !== 'Professional') {
    //   return res.status(403).json({ msg: 'Access denied: Verified Professional status required' });
    // }

    const newProperty = new Property({
      location,
      propertyInfo,
      marketData,
      dataSourceReference,
      uploadedBy: req.user.id,
      verificationStatus: req.user.role === 'Admin' ? 'Approved' : 'Pending'
    });

    const property = await newProperty.save();
    res.json(property);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/properties
// @desc    Get all properties with filtering (Approved only for public)
router.get('/', async (req, res) => {
  try {
    const { 
      region, district, suburb, 
      propertyType, 
      minPrice, maxPrice, 
      minRental, maxRental,
      minSize, maxSize,
      minLand, maxLand,
      condition,
      startDate, endDate,
      status // for admin view
    } = req.query;
    
    let query = {};

    // Default to Approved
    query.verificationStatus = status || 'Approved';

    if (region) query['location.region'] = region;
    if (district) query['location.district'] = district;
    if (suburb) query['location.suburb'] = suburb;
    
    if (propertyType) query['propertyInfo.propertyType'] = propertyType;
    if (condition) query['propertyInfo.condition'] = condition;

    if (minPrice || maxPrice) {
      query['marketData.salePrice'] = {};
      if (minPrice) query['marketData.salePrice'].$gte = Number(minPrice);
      if (maxPrice) query['marketData.salePrice'].$lte = Number(maxPrice);
    }

    if (minRental || maxRental) {
      query['marketData.rentalValue'] = {};
      if (minRental) query['marketData.rentalValue'].$gte = Number(minRental);
      if (maxRental) query['marketData.rentalValue'].$lte = Number(maxRental);
    }
    
    if (minSize || maxSize) {
      query['propertyInfo.size'] = {};
      if (minSize) query['propertyInfo.size'].$gte = Number(minSize);
      if (maxSize) query['propertyInfo.size'].$lte = Number(maxSize);
    }
    
    if (minLand || maxLand) {
      query['propertyInfo.landSize'] = {};
      if (minLand) query['propertyInfo.landSize'].$gte = Number(minLand);
      if (maxLand) query['propertyInfo.landSize'].$lte = Number(maxLand);
    }

    if (startDate || endDate) {
      query['marketData.transactionDate'] = {};
      if (startDate) query['marketData.transactionDate'].$gte = new Date(startDate);
      if (endDate) query['marketData.transactionDate'].$lte = new Date(endDate);
    }

    const properties = await Property.find(query).sort({ createdAt: -1 });
    res.json(properties);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/properties/moderation
// @desc    Get all properties pending verification (Admin Only)
router.get('/moderation', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ msg: 'Access denied: Admin role required' });
    }
    const properties = await Property.find({ verificationStatus: 'Pending' }).sort({ createdAt: -1 });
    res.json(properties);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/properties/:id/status
// @desc    Moderate a property record (Admin Only)
router.put('/:id/status', auth, async (req, res) => {
  const { status } = req.body; // 'Approved', 'Rejected'
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ msg: 'Access denied: Admin role required' });
    }

    let property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ msg: 'Property not found' });

    property.verificationStatus = status;
    await property.save();

    res.json(property);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/properties/:id/flag
// @desc    Flag a property record (Verified Professionals Only)
router.post('/:id/flag', auth, async (req, res) => {
  const { reason } = req.body;
  try {
    // if (req.user.subscriptionStatus !== 'Professional' && req.user.role !== 'Admin') {
    //   return res.status(403).json({ msg: 'Access denied: Verified Professional status required' });
    // }

    let property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ msg: 'Property not found' });

    property.flags.push({
      reason,
      flaggedBy: req.user.id
    });

    await property.save();
    res.json({ msg: 'Property flagged for review' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/properties/:id
// @desc    Update a property record (Admin Only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ msg: 'Access denied: Admin role required' });
    }

    let property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ msg: 'Property not found' });

    property = await Property.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(property);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/properties/:id
// @desc    Delete a property record (Admin Only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ msg: 'Access denied: Admin role required' });
    }

    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ msg: 'Property not found' });

    await Property.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Property removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/properties/:id/save
// @desc    Toggle save property for user
router.post('/:id/save', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const propertyId = req.params.id;

    if (!user.savedProperties) user.savedProperties = [];

    const index = user.savedProperties.indexOf(propertyId);
    if (index > -1) {
      user.savedProperties.splice(index, 1);
    } else {
      user.savedProperties.push(propertyId);
    }

    await user.save();
    res.json(user.savedProperties);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
