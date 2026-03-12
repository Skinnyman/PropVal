const express = require('express');
const router = express.Router();
const { checkSubscription } = require('../middleware/auth');
const auth = require('../middleware/auth');
const Valuation = require('../models/Valuation');
const Property = require('../models/Property');

// @route   POST api/valuations/comparable
// @desc    Perform Comparable Sales Valuation
router.post('/comparable', [auth, checkSubscription('Professional')], async (req, res) => {
  const { subjectProperty, selectedComparables, adjustments } = req.body;

  try {
    // Basic calculation: Average of adjusted comparable prices
    // In a real app, adjustments would be applied to each comparable
    const properties = await Property.find({ _id: { $in: selectedComparables } });
    
    let totalAdjustedPrice = 0;
    properties.forEach(prop => {
      const adjustment = adjustments.find(a => a.propertyId === prop._id.toString());
      const adjValue = adjustment ? adjustment.adjustmentValue : 0;
      totalAdjustedPrice += (prop.marketData.salePrice + adjValue);
    });

    const finalValue = totalAdjustedPrice / properties.length;

    const newValuation = new Valuation({
      subjectProperty,
      method: 'Comparable Sales',
      comparables: selectedComparables,
      adjustments,
      finalValue,
      valuer: req.user.id
    });

    const valuation = await newValuation.save();
    res.json(valuation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/valuations/income
// @desc    Perform Income Capitalization Valuation
router.post('/income', [auth, checkSubscription('Professional')], async (req, res) => {
  const { subjectProperty, incomeData } = req.body;
  const { annualRentalIncome, vacancyRate, operatingExpenses, capRate } = incomeData;

  try {
    const effectiveIncome = annualRentalIncome * (1 - vacancyRate / 100);
    const noi = effectiveIncome - operatingExpenses;
    const finalValue = noi / (capRate / 100);

    const newValuation = new Valuation({
      subjectProperty,
      method: 'Income Capitalization',
      incomeData,
      finalValue,
      valuer: req.user.id
    });

    const valuation = await newValuation.save();
    res.json(valuation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/valuations/cost
// @desc    Perform Cost Method Valuation
router.post('/cost', [auth, checkSubscription('Professional')], async (req, res) => {
  const { subjectProperty, costData } = req.body;
  const { landValue, constructionCostPerSqm, depreciation } = costData;

  try {
    // Value = Land Value + (Construction Cost × GFA) − Depreciation
    const constructionValue = (constructionCostPerSqm * subjectProperty.size);
    const finalValue = Number(landValue) + constructionValue - Number(depreciation);

    const newValuation = new Valuation({
      subjectProperty,
      method: 'Cost Method',
      costData,
      finalValue,
      valuer: req.user.id
    });

    const valuation = await newValuation.save();
    res.json(valuation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/valuations/residual
// @desc    Perform Residual Method Valuation
router.post('/residual', [auth, checkSubscription('Professional')], async (req, res) => {
  const { subjectProperty, residualData } = req.body;
  const { gdv, constructionCosts, professionalFees, financeCosts, developerProfit } = residualData;

  try {
    // Residual Land Value = GDV − (Construction + Fees + Finance + Profit)
    const finalValue = gdv - (Number(constructionCosts) + Number(professionalFees) + Number(financeCosts) + Number(developerProfit));

    const newValuation = new Valuation({
      subjectProperty,
      method: 'Residual Method',
      residualData,
      finalValue,
      valuer: req.user.id
    });

    const valuation = await newValuation.save();
    res.json(valuation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/valuations/profit
// @desc    Perform Profit Method Valuation
router.post('/profit', [auth, checkSubscription('Professional')], async (req, res) => {
  const { subjectProperty, profitData } = req.body;
  const { grossAnnualRevenue, operatingExpenses, capitalizationYield } = profitData;

  try {
    // Value = Net Profit / Yield
    const netProfit = grossAnnualRevenue - operatingExpenses;
    const finalValue = netProfit / (capitalizationYield / 100);

    const newValuation = new Valuation({
      subjectProperty,
      method: 'Profit Method',
      profitData,
      finalValue,
      valuer: req.user.id
    });

    const valuation = await newValuation.save();
    res.json(valuation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/valuations
// @desc    Get user's valuations
router.get('/', auth, async (req, res) => {
  try {
    const valuations = await Valuation.find({ valuer: req.user.id }).sort({ createdAt: -1 });
    res.json(valuations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

const { generateValuationReport } = require('../utils/pdfGenerator');

// @route   GET api/valuations/:id/report
// @desc    Generate and download PDF report
router.get('/:id/report', auth, async (req, res) => {
  try {
    const valuation = await Valuation.findById(req.params.id).populate('comparables');
    if (!valuation) return res.status(404).json({ msg: 'Valuation not found' });
    
    // Ensure the user owns the valuation
    if (valuation.valuer.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    const pdfBuffer = await generateValuationReport(valuation);
    
    res.contentType("application/pdf");
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;

