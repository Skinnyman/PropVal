const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Property = require('../models/Property');
const User = require('../models/User');
const Notification = require('../models/Notification');

const upload = require('../middleware/upload');

// @route   POST api/properties
// @desc    Add a new property record (Admin or Verified Valuer)
router.post('/', auth, (req, res) => {
  upload.array('images', 5)(req, res, async (err) => {
    if (err) {
      console.error('Cloudinary Upload Error:', err);
      return res.status(400).json({ 
        msg: 'Image upload failed. Please ensure your Cloudinary API credentials in the .env file are correct and try again.', 
        error: err.message || err 
      });
    }

    let { location, propertyInfo, marketData, dataSourceReference } = req.body;

    // Handle FormData parsing if necessary (when sending files, objects are often stringified)
    try {
      if (typeof location === 'string') location = JSON.parse(location);
      if (typeof propertyInfo === 'string') propertyInfo = JSON.parse(propertyInfo);
      if (typeof marketData === 'string') marketData = JSON.parse(marketData);
    } catch (e) {
      return res.status(400).json({ msg: 'Invalid JSON data in form' });
    }

    try {
      // Both Admin and Valuer can contribute, but Valuer records are 'Pending'
    const verificationStatus = req.user.role === 'Admin' ? 'Approved' : 'Pending';

    // Standardize coordinates to [lng, lat]
    let coords = [0, 0];
    if (location.coordinates) {
      if (Array.isArray(location.coordinates)) {
        coords = [Number(location.coordinates[0]), Number(location.coordinates[1])];
      } else if (location.coordinates.lng !== undefined && location.coordinates.lat !== undefined) {
        coords = [Number(location.coordinates.lng), Number(location.coordinates.lat)];
      } else if (location.coordinates.coordinates) {
        // Handle double nesting if accidentally sent
        coords = [Number(location.coordinates.coordinates[0]), Number(location.coordinates.coordinates[1])];
      }
    }

    const formattedLocation = {
      ...location,
      coordinates: {
        type: 'Point',
        coordinates: coords
      }
    };

    // Process images (save direct Cloudinary URL from file.path)
    const imageUrls = req.files ? req.files.map(file => file.path) : [];
    
    const formattedPropertyInfo = {
      ...propertyInfo,
      images: imageUrls.length > 0 ? imageUrls : (propertyInfo.images || [])
    };

    const newProperty = new Property({
      location: formattedLocation,
      propertyInfo: formattedPropertyInfo,
      marketData,
      dataSourceReference,
      uploadedBy: req.user.id,
      verificationStatus
    });

    const property = await newProperty.save();

    // Send notification to the uploader
    await Notification.create({
      user: req.user.id,
      title: verificationStatus === 'Approved' ? '✅ Property Approved' : '⏳ Property Pending Approval',
      message: verificationStatus === 'Approved'
        ? `Your property in ${formattedLocation.suburb} has been automatically approved.`
        : `Your property submission in ${formattedLocation.suburb} is awaiting admin review.`,
      type: verificationStatus === 'Approved' ? 'approved' : 'pending',
      propertyId: property._id
    });

    res.json(property);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
  }); // Closes upload.array()()
}); // Closes router.post()


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
      status, // for admin view
      bbox, // [minLng, minLat, maxLng, maxLat]
      nearLat, nearLng, radius // proximity search (radius in metres)
    } = req.query;

    let query = {};

    // Default to Approved
    query.verificationStatus = status || 'Approved';

    // Geospatial Filters
    if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
      query['location.coordinates'] = {
        $geoWithin: {
          $box: [
            [minLng, minLat],
            [maxLng, maxLat]
          ]
        }
      };
    } else if (nearLat && nearLng) {
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(nearLng), Number(nearLat)]
          },
          $maxDistance: Number(radius) || 5000 // default 5km
        }
      };
    }

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

    // Notify the property owner about the status change
    if (property.uploadedBy) {
      await Notification.create({
        user: property.uploadedBy,
        title: status === 'Approved' ? '✅ Property Approved' : '❌ Property Rejected',
        message: status === 'Approved'
          ? `Great news! Your property submission in ${property.location?.suburb} has been approved and is now live on the platform.`
          : `Your property submission in ${property.location?.suburb} was not approved. Please review and resubmit.`,
        type: status === 'Approved' ? 'approved' : 'rejected',
        propertyId: property._id
      });
    }

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

// @route   GET api/properties/:id
// @desc    Get property by ID
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ msg: 'Property not found' });
    res.json(property);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Property not found' });
    res.status(500).send('Server error');
  }
});

module.exports = router;
