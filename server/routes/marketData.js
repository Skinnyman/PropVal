const express = require('express');
const router = express.Router();
const MarketData = require('../models/MarketData');
const auth = require('../middleware/auth');

// @route   GET api/market-data/summary
// @desc    Get aggregated market overview statistics
// @access  Private
router.get('/summary', auth, async (req, res) => {
  try {
    const isNotAdmin = req.user.role !== 'Admin';
    const matchVerified = isNotAdmin ? { isVerified: true } : {};

    const summary = await MarketData.aggregate([
      {
        $facet: {
          cityGrowth: [
            { $match: { category: 'Sale Transactions', city: { $exists: true, $ne: '' }, ...matchVerified } },
            { 
              $group: { 
                _id: '$city', 
                avgPrice: { $avg: { $convert: { input: '$price', to: 'double', onError: 0, onNull: 0 } } },
                count: { $sum: 1 }
              } 
            },
            { $project: { title: '$_id', value: { $round: ['$avgPrice', 1] }, count: '$count', _id: 0, trend: { $literal: 'up' }, change: { $literal: 'Steady' }, changeText: { $literal: '(Avg Price)' } } },
            { $sort: { value: -1 } },
            { $limit: 10 }
          ],
          averages: [
            {
              $group: {
                _id: '$category',
                avgValue: { 
                  $avg: { 
                    $convert: { 
                      input: { 
                        $switch: {
                          branches: [
                            { case: { $eq: ['$category', 'Sale Transactions'] }, then: '$price' },
                            { case: { $eq: ['$category', 'Rental Evidence'] }, then: '$rent' },
                            { case: { $eq: ['$category', 'Construction Costs'] }, then: '$cost' },
                            { case: { $eq: ['$category', 'Cap Rates / Yields'] }, then: '$capRate' },
                            { case: { $eq: ['$category', 'Land Values'] }, then: '$price' },
                            { case: { $eq: ['$category', 'Building Materials'] }, then: '$materialPrice' }
                          ],
                          default: '0'
                        }
                      },
                      to: 'double',
                      onError: 0,
                      onNull: 0
                    }
                  }
                },
                count: { $sum: 1 }
              }
            }
          ],
          macro: [
            { $match: { category: 'Market Overview', subCategory: 'indicator', ...matchVerified } }
          ]
        }
      }
    ]);

    // Format the averages into indicator objects for the 8-card grid
    const averages = summary[0].averages;
    const findAvg = (cat) => averages.find(a => a._id === cat)?.avgValue || 0;
    
    const indicatorCards = [
      { title: 'Avg Sale Price', value: findAvg('Sale Transactions').toLocaleString(), unit: 'GHS', trend: 'up', change: 'Live', changeText: 'Market Avg', icon: 'Home', subCategory: 'indicator' },
      { title: 'Avg Monthly Rent', value: findAvg('Rental Evidence').toLocaleString(), unit: 'GHS', trend: 'neutral', change: 'Live', changeText: 'Market Avg', icon: 'Building2', subCategory: 'indicator' },
      { title: 'Avg Prime Yield', value: findAvg('Cap Rates / Yields').toFixed(1), unit: '%', trend: 'up', change: 'Live', changeText: 'Market Avg', icon: 'Percent', subCategory: 'indicator' },
      { title: 'Avg Build Cost', value: findAvg('Construction Costs').toLocaleString(), unit: 'GHS/sqm', trend: 'up', change: 'Live', changeText: 'Market Avg', icon: 'Wrench', subCategory: 'indicator' },
      { title: 'Avg Land Value', value: findAvg('Land Values').toLocaleString(), unit: 'GHS', trend: 'up', change: 'Live', changeText: 'Market Avg', icon: 'Map', subCategory: 'indicator' },
      ...summary[0].macro.slice(0, 3) // Fill remaining slots with macro indicators
    ];

    res.json({
      indicators: indicatorCards,
      cityGrowth: summary[0].cityGrowth
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/market-data
// @desc    Get all market data or by category
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};
    if (category) query.category = category;
    
    // Only admins see unverified data
    if (req.user.role !== 'Admin') {
      query.isVerified = true;
    }

    const data = await MarketData.find(query).sort({ updatedAt: -1 }).populate('uploadedBy', 'name email');
    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/market-data
// @desc    Create market data entry
// @access  Private (Admin or Valuer)
router.post('/', auth, async (req, res) => {

  try {
    const newData = new MarketData({
      ...req.body,
      uploadedBy: req.user._id,
      isVerified: req.user.role === 'Admin' // Admins are auto-verified
    });

    const data = await newData.save();
    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/market-data/:id
// @desc    Delete entry
// @access  Private Admin
router.delete('/:id', auth, async (req, res) => {
  try {
    const data = await MarketData.findById(req.params.id);
    if (!data) return res.status(404).json({ msg: 'Record not found' });

    if (req.user.role !== 'Admin') {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await data.deleteOne();
    res.json({ msg: 'Record removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
