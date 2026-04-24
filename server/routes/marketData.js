const express = require('express');
const router = express.Router();
const MarketData = require('../models/MarketData');
const auth = require('../middleware/auth');
const googleSheetsService = require('../utils/googleSheetsService');
const dataNormalizer = require('../utils/dataNormalizer');
const sendEmail = require('../utils/sendEmail');
const axios = require('axios');

// @route   GET api/market-data/summary
// @desc    Get aggregated market overview statistics
// @access  Private
router.get('/summary', auth, async (req, res) => {
  try {
    const isNotAdmin = req.user.role !== 'Admin';
    const matchVerified = isNotAdmin ? { status: 'approved' } : {};

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

    // Non-admins should only see approved data system-wide
    // Admins can see everything when fetching generic lists, or filter by status
    if (req.user.role !== 'Admin') {
      query.status = 'approved';
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
    const isAdmin = req.user.role === 'Admin';
    const newData = new MarketData({
      ...req.body,
      uploadedBy: req.user.id,
      isVerified: isAdmin, // Legacy flag, kept for safety
      status: isAdmin ? 'approved' : 'pending'
    });

    const data = await newData.save();
    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/market-data/bulk
// @desc    Bulk create market data entries (e.g. from Google Sheets)
// @access  Private (Admin or Valuer)
router.post('/bulk', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(401).json({ msg: 'Not authorized. Bulk import is restricted to Admins.' });
    }

    const { category, entries, sourceSpreadsheetId, sourceSheetName } = req.body;
    if (!category || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ msg: 'Invalid payload. Expected category and an array of entries.' });
    }

    const isAdmin = req.user.role === 'Admin';
    
    const operations = entries.map(entry => {
      // Define a composite filter to identify "duplicates" based on category
      const filter = {
        category,
        region: entry.region || '',
        city: entry.city || '',
        area: entry.area || '',
        propertyType: entry.propertyType || ''
      };

      // Add category-specific identifying fields to the filter
      if (category === 'Sale Transactions' || category === 'Land Values') {
        filter.price = entry.price || '';
        if (entry.saleDate) filter.saleDate = entry.saleDate;
        if (entry.landSize) filter.landSize = entry.landSize;
      } else if (category === 'Rental Evidence') {
        filter.rent = entry.rent || '';
        filter.buildingSize = entry.buildingSize || '';
      } else if (category === 'Construction Costs') {
        filter.cost = entry.cost || '';
        filter.gfa = entry.gfa || '';
      } else if (category === 'Building Materials' || category === 'Fittings & Fixtures') {
        filter.materialName = entry.materialName || '';
        filter.supplier = entry.supplier || '';
      } else if (category === 'Cap Rates / Yields') {
        filter.capRate = entry.capRate || '';
        filter.propertyValue = entry.propertyValue || '';
      }

      return {
        updateOne: {
          filter,
          update: {
            $set: {
              ...entry,
              category,
              uploadedBy: req.user.id,
              isVerified: isAdmin,
              status: isAdmin ? 'approved' : 'pending',
              source: 'Google Sheets / CSV Import',
              sourceSpreadsheetId,
              sourceSheetName,
              updatedAt: Date.now()
            }
          },
          upsert: true
        }
      };
    });

    const result = await MarketData.bulkWrite(operations);
    
    const summary = {
      total: entries.length,
      upserted: result.upsertedCount,
      modified: result.modifiedCount,
      matched: result.matchedCount
    };

    res.json({ 
      msg: `Bulk operation complete. ${summary.upserted} new records added, ${summary.modified} existing records updated.`, 
      summary 
    });
  } catch (err) {
    console.error('Bulk Import Error:', err.message);
    res.status(500).send('Server Error during bulk import.');
  }
});

// @route   GET api/market-data/mine
// @desc    Get user's personal pending/rejected submissions
// @access  Private
router.get('/mine', auth, async (req, res) => {
  try {
    // Return records submitted by the current user
    const data = await MarketData.find({ uploadedBy: req.user.id })
      .sort({ updatedAt: -1 });
    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/market-data/pending
// @desc    Get all pending data submissions (Admin Only)
// @access  Private
router.get('/pending', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(401).json({ msg: 'Not authorized' });
    const data = await MarketData.find({ status: 'pending' }).populate('uploadedBy', 'name email').sort({ updatedAt: -1 });
    res.json(data);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/market-data/:id/approve
// @desc    Approve a pending entry
// @access  Private (Admin Only)
router.put('/:id/approve', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(401).json({ msg: 'Not authorized' });

    const data = await MarketData.findById(req.params.id).populate('uploadedBy', 'name email');
    if (!data) return res.status(404).json({ msg: 'Record not found' });

    data.status = 'approved';
    data.isVerified = true;
    data.rejectionReason = '';
    await data.save();

    // Send email notification to valuer if email exists
    if (data.uploadedBy && data.uploadedBy.email) {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #0f172a; border-bottom: 2px solid #facc15; padding-bottom: 10px;">Data Submission Approved</h2>
          <p style="color: #475569; font-size: 16px;">Hello ${data.uploadedBy.name},</p>
          <p style="color: #475569; font-size: 16px;">Your recent data submission for <strong>${data.category}</strong> has been reviewed and <strong style="color: #10b981;">Approved</strong> by our moderation team.</p>
          <p style="color: #475569; font-size: 16px;">It is now live in the professional Data Bank.</p>
          <p style="color: #475569; font-size: 16px; margin-top: 30px;">Thank you for contributing to PropVal GH.</p>
        </div>
      `;
      try {
        await sendEmail({
          to: data.uploadedBy.email,
          subject: 'PropVal Data Submission Approved',
          html: emailHtml
        });
      } catch (e) {
        console.error('Approval notification email failed to send:', e.message);
      }
    }

    res.json({ msg: 'Record approved successfully', data });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/market-data/:id/reject
// @desc    Reject a pending entry and provide a reason
// @access  Private (Admin Only)
router.put('/:id/reject', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(401).json({ msg: 'Not authorized' });

    const { reason } = req.body;
    if (!reason) return res.status(400).json({ msg: 'Please provide a rejection reason' });

    const data = await MarketData.findById(req.params.id);
    if (!data) return res.status(404).json({ msg: 'Record not found' });

    data.status = 'rejected';
    data.rejectionReason = reason;
    await data.save();

    res.json({ msg: 'Record rejected successfully', data });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/market-data/:id/resubmit
// @desc    Edit and resubmit a rejected entry
// @access  Private
router.put('/:id/resubmit', auth, async (req, res) => {
  try {
    let data = await MarketData.findById(req.params.id);
    if (!data) return res.status(404).json({ msg: 'Record not found' });

    // Validate ownership
    if (data.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    // Update fields and restore to pending
    const updateData = {
      ...req.body,
      status: 'pending',
      rejectionReason: '',
      isVerified: false
    };

    data = await MarketData.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

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

// @route   GET api/market-data/recommendations
// @desc    Get valuation recommendations based on property type and location
// @access  Private
router.get('/recommendations', auth, async (req, res) => {
  try {
    const { region, suburb, propertyType } = req.query;

    // 1. Fetch from MarketData (Data Bank)
    const marketMatch = { status: 'approved' };
    const propTypeMatch = {
      $or: [
        { propertyType: propertyType },
        { propertyType: { $exists: false } },
        { propertyType: '' }
      ]
    };

    let marketDataPoints = await MarketData.find({ ...marketMatch, ...propTypeMatch, region, suburb });

    // 2. Fetch from Property (Master DB)
    const Property = require('../models/Property');
    let propertyPoints = await Property.find({
      verificationStatus: 'Approved',
      'location.region': region,
      'location.suburb': suburb,
      'propertyInfo.propertyType': propertyType
    });

    let confidence = 'High';
    let totalPoints = marketDataPoints.length + propertyPoints.length;

    // Fallback to region level if not enough data
    if (totalPoints < 2) {
      marketDataPoints = await MarketData.find({ ...marketMatch, ...propTypeMatch, region });
      propertyPoints = await Property.find({
        verificationStatus: 'Approved',
        'location.region': region,
        'propertyInfo.propertyType': propertyType
      });
      totalPoints = marketDataPoints.length + propertyPoints.length;
      confidence = totalPoints >= 5 ? 'Moderate' : 'Low';
    } else if (totalPoints < 5) {
      confidence = 'Moderate';
    }

    // Averages logic combining both databases
    const extractRents = () => {
      let rents = [];
      marketDataPoints.filter(d => d.category === 'Rental Evidence' && Number(d.rent) > 0).forEach(d => rents.push(Number(d.rent)));
      propertyPoints.filter(p => Number(p.marketData?.rentalValue) > 0).forEach(p => rents.push(Number(p.marketData.rentalValue)));
      return rents;
    };

    const extractCapRates = () => {
      let caps = [];
      marketDataPoints.filter(d => d.category === 'Cap Rates / Yields' && Number(d.capRate) > 0).forEach(d => caps.push(Number(d.capRate)));
      propertyPoints.filter(p => Number(p.marketData?.capRate) > 0).forEach(p => caps.push(Number(p.marketData.capRate)));
      return caps;
    };

    const extractCosts = () => {
      let costs = [];
      marketDataPoints.filter(d => d.category === 'Construction Costs' && Number(d.cost) > 0).forEach(d => costs.push(Number(d.cost)));
      propertyPoints.filter(p => Number(p.marketData?.constructionCostPerSqm) > 0).forEach(p => costs.push(Number(p.marketData.constructionCostPerSqm)));
      return costs;
    };

    const extractLandValues = () => {
      let lands = [];
      marketDataPoints.filter(d => d.category === 'Land Values' && Number(d.price) > 0).forEach(d => lands.push(Number(d.price)));
      return lands; // Land values mainly sit in the Data Bank, but properties might have derived land values later
    };

    const averageArray = (arr) => {
      if (!arr || arr.length === 0) return 0;
      const sum = arr.reduce((acc, curr) => acc + curr, 0);
      return sum / arr.length;
    };

    const avgRent = Math.round(averageArray(extractRents()));
    const avgCapRate = Number(averageArray(extractCapRates()).toFixed(1));
    const avgCostPerSqm = Math.round(averageArray(extractCosts()));
    const avgLandValue = Math.round(averageArray(extractLandValues()));

    const recommendations = {
      avgRent: avgRent,
      avgCapRate: avgCapRate || 8.5, // Smart fallback for Ghana
      avgCostPerSqm: avgCostPerSqm || 3000,
      avgLandValue: avgLandValue || 0,
      confidenceScore: confidence,
      dataPointsCount: totalPoints
    };

    res.json(recommendations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/market-data/google-sheets/metadata
// @desc    Extract spreadsheet ID and fetch available sheets (tabs)
// @access  Private
router.get('/google-sheets/metadata', auth, async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ msg: 'Spreadsheet URL is required' });

    // 1. Extract spreadsheetId from URL using service
    const spreadsheetId = googleSheetsService.extractSpreadsheetId(url);
    if (!spreadsheetId) {
      return res.status(400).json({ msg: 'Invalid Google Sheets URL format. Could not extract Spreadsheet ID.' });
    }

    console.log(`[Google Sheets API] Scanning Spreadsheet ID: ${spreadsheetId}`);

    // 2. Fetch all available sheet titles (tabs)
    const availableSheets = await googleSheetsService.getSpreadsheetMetadata(spreadsheetId);

    res.json({ 
      spreadsheetId, 
      availableSheets: availableSheets.map(title => ({ title })) 
    });
  } catch (err) {
    console.error('Google Sheets Metadata Error:', err.message);
    res.status(500).json({ msg: 'Failed to fetch spreadsheet metadata. Check if the sheet is shared with the Service Account.' });
  }
});

// @route   POST api/market-data/google-sheets/fetch
// @desc    Fetch values from a specific sheet/tab using Service Account
// @access  Private
router.post('/google-sheets/fetch', auth, async (req, res) => {
  try {
    const { spreadsheetId, sheetName } = req.body;
    if (!spreadsheetId || !sheetName) {
      return res.status(400).json({ msg: 'spreadsheetId and sheetName are required' });
    }

    console.log(`[Google Sheets API] Fetching Spreadsheet ID: ${spreadsheetId}, Sheet: ${sheetName}`);

    // 1. Fetch rows using service account
    const rows = await googleSheetsService.getSheetValues(spreadsheetId, sheetName);

    // 4. Debugging Requirements
    console.log(`[Google Sheets API] Raw API Response Rows Length: ${rows ? rows.length : 0}`);
    console.log(`[Google Sheets API] Full API Response Values Array:`, JSON.stringify(rows));

    if (!rows || rows.length === 0) {
      return res.status(400).json({ msg: 'The selected sheet is completely empty. No headers or data found.' });
    }

    // Find the first row that has actual data (likely headers)
    let headerRowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i] && rows[i].length > 0 && rows[i].some(cell => cell && String(cell).trim() !== '')) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      return res.status(400).json({ msg: 'The selected sheet has no valid headers or data.' });
    }

    // 2. CONVERT JSON TO CSV (BACKEND)
    // Extract only valid rows starting from the detected headers
    const validRows = rows.slice(headerRowIndex);

    const csvEscape = (value) => {
      if (value == null) return '';
      const str = String(value).trim();
      // Ensure proper escaping for commas, quotes, and newlines
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Output a valid CSV string
    // Find the maximum number of columns across all rows to pad shorter rows
    const maxCols = Math.max(...validRows.map(r => (r ? r.length : 0)));
    
    const csvData = validRows.map(row => {
      if (!row) row = [];
      const paddedRow = [...row];
      while (paddedRow.length < maxCols) {
        paddedRow.push('');
      }
      return paddedRow.map(csvEscape).join(',');
    }).join('\n');

    if (!csvData || csvData.trim() === '') {
      return res.status(400).json({ msg: 'The selected sheet could not be converted to CSV.' });
    }

    console.log(`[Google Sheets API] Successfully built CSV Data. Length: ${csvData.length} chars.`);
    console.log(`[Google Sheets API] CSV Preview (first 100 chars): ${csvData.substring(0, 100).replace(/\n/g, '\\n')}`);

    // 3. SEND CSV TO FRONTEND
    res.json({
      success: true,
      sheetName,
      csvData,
      rawRowsLength: rows.length
    });
  } catch (err) {
    console.error('[Google Sheets Fetch Error]:', err.response?.data?.error?.message || err.message);
    res.status(500).json({ msg: err.response?.data?.error?.message || 'Failed to fetch sheet data' });
  }
});

// @route   POST api/market-data/google-sheets/sync
// @desc    Sync data from a previously imported spreadsheet
// @access  Private (Admin)
router.post('/google-sheets/sync', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') return res.status(401).json({ msg: 'Not authorized' });

    const { spreadsheetId, sheetName, category } = req.body;
    if (!spreadsheetId || !sheetName || !category) {
      return res.status(400).json({ msg: 'spreadsheetId, sheetName and category are required' });
    }

    console.log(`[Sync] Triggering sync for: ${spreadsheetId} / ${sheetName}`);

    // 1. Fetch latest data from Google Sheets
    const rows = await googleSheetsService.getSheetValues(spreadsheetId, sheetName);
    if (!rows || rows.length < 2) {
      return res.status(400).json({ msg: 'The spreadsheet has no data to sync.' });
    }

    // 2. Convert raw rows to objects
    const headers = rows[0].map(h => h.toLowerCase().trim());
    const dataObjects = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });

    // 3. Normalize data
    const normalizedEntries = dataNormalizer.normalizeMarketData(dataObjects, category);

    // 4. Perform Bulk Upsert
    const isAdmin = true; // Sync is admin only
    const operations = normalizedEntries.map(entry => {
      const filter = {
        category,
        region: entry.region || '',
        city: entry.city || '',
        area: entry.area || '',
        propertyType: entry.propertyType || ''
      };

      // Category specific filters
      if (category === 'Sale Transactions' || category === 'Land Values') {
        filter.price = entry.price || '';
        if (entry.saleDate) filter.saleDate = entry.saleDate;
      } else if (category === 'Rental Evidence') {
        filter.rent = entry.rent || '';
        filter.buildingSize = entry.buildingSize || '';
      } else if (category === 'Construction Costs') {
        filter.cost = entry.cost || '';
        filter.gfa = entry.gfa || '';
      } else if (category === 'Building Materials' || category === 'Fittings & Fixtures') {
        filter.materialName = entry.materialName || '';
        filter.supplier = entry.supplier || '';
      } else if (category === 'Cap Rates / Yields') {
        filter.capRate = entry.capRate || '';
        filter.propertyValue = entry.propertyValue || '';
      }

      return {
        updateOne: {
          filter,
          update: {
            $set: {
              ...entry,
              category,
              isVerified: isAdmin,
              status: 'approved',
              source: 'Google Sheets Sync',
              sourceSpreadsheetId: spreadsheetId,
              sourceSheetName: sheetName,
              updatedAt: Date.now()
            }
          },
          upsert: true
        }
      };
    });

    const result = await MarketData.bulkWrite(operations);

    res.json({
      msg: `Sync complete. ${result.upsertedCount} new records, ${result.modifiedCount} updated.`,
      summary: {
        total: normalizedEntries.length,
        upserted: result.upsertedCount,
        modified: result.modifiedCount
      }
    });
  } catch (err) {
    console.error('Sync Error:', err.message);
    res.status(500).json({ msg: 'Failed to sync data. Check Service Account permissions.' });
  }
});

module.exports = router;
