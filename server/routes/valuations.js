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
    const properties = await Property.find({ _id: { $in: selectedComparables } });
    
    let processedAdjustments = [];
    let weightSum = 0;
    let weightedValueSum = 0;

    properties.forEach(prop => {
      const adjPayload = adjustments.find(a => a.propertyId === prop._id.toString()) || {
        transactionAdjustments: [],
        propertyAdjustments: []
      };

      let basePrice = prop.marketData.salePrice || 0;
      let currentPrice = basePrice;
      let transactionNet = 0;
      let grossAdjustment = 0;

      // 1. Transactional Adjustments (Sequential)
      (adjPayload.transactionAdjustments || []).forEach(adj => {
        let amt = adj.percentage ? currentPrice * (adj.percentage / 100) : (adj.amount || 0);
        currentPrice += amt;
        transactionNet += amt;
        grossAdjustment += Math.abs(amt);
      });

      let timeAdjustedPrice = currentPrice;
      let propertyNet = 0;

      // 2. Property Adjustments (Additive against Time Adjusted Price)
      (adjPayload.propertyAdjustments || []).forEach(adj => {
        let amt = adj.percentage ? timeAdjustedPrice * (adj.percentage / 100) : (adj.amount || 0);
        propertyNet += amt;
        grossAdjustment += Math.abs(amt);
      });

      currentPrice += propertyNet;
      
      const netAdjustment = transactionNet + propertyNet;
      const adjustedPrice = currentPrice;

      // Principle of Substitution / Reconciliation Weighting
      // Lower gross adjustment = higher similarity = higher weight
      let weight = grossAdjustment === 0 ? 100 : (1000000 / grossAdjustment);
      weightSum += weight;
      weightedValueSum += (adjustedPrice * weight);

      processedAdjustments.push({
        propertyId: prop._id,
        transactionAdjustments: adjPayload.transactionAdjustments,
        propertyAdjustments: adjPayload.propertyAdjustments,
        netAdjustment,
        adjustedPrice
      });
    });

    const finalValue = weightSum > 0 ? (weightedValueSum / weightSum) : 0;

    const newValuation = new Valuation({
      subjectProperty,
      method: 'Comparable Sales',
      comparables: selectedComparables,
      adjustments: processedAdjustments,
      finalValue: Math.round(finalValue),
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

  try {
    let finalValue = 0;
    
    // Fallback defaults
    incomeData.methodology = incomeData.methodology || 'Direct Capitalization';

    if (incomeData.methodology === 'DCF') {
      let npv = 0;
      let calculatedProjections = [];
      
      // Calculate present value of each projected year
      (incomeData.dcfProjections || []).forEach(proj => {
         // EGI - Expenses = NOI
         const currentNoi = Number(proj.netOperatingIncome || 0);
         const rate = Number(proj.discountRate || 10) / 100;
         const pv = currentNoi / Math.pow(1 + rate, Number(proj.year));
         npv += pv;
         
         calculatedProjections.push({
            year: Number(proj.year),
            grossIncome: Number(proj.grossIncome || 0),
            expenses: Number(proj.expenses || 0),
            netOperatingIncome: currentNoi,
            discountRate: Number(proj.discountRate || 10),
            presentValue: pv
         });
      });
      
      // Reversion (Terminal Value) NPV
      const terminalValue = Number(incomeData.terminalValue || 0);
      const totalYears = calculatedProjections.length;
      const lastDiscountRate = totalYears > 0 ? (calculatedProjections[totalYears - 1].discountRate / 100) : 0.1;
      const terminalPresentValue = terminalValue / Math.pow(1 + lastDiscountRate, totalYears);
      
      finalValue = npv + terminalPresentValue;
      incomeData.dcfProjections = calculatedProjections;
    } else {
      // Direct Capitalization
      const rIncome = Number(incomeData.annualRentalIncome || 0);
      const vacRate = Number(incomeData.vacancyRate || 0);
      const opex = Number(incomeData.operatingExpenses || 0);
      const cRate = Number(incomeData.capRate || 10);
      
      const effectiveIncome = rIncome * (1 - (vacRate / 100));
      const noi = effectiveIncome - opex;
      finalValue = noi / (cRate / 100);
    }

    const newValuation = new Valuation({
      subjectProperty,
      method: 'Income Capitalization',
      incomeData,
      finalValue: Math.round(finalValue),
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
  const { landValue, directCosts, indirectCosts, depreciation } = costData;

  try {
    const defaultDepreciation = { physical: 0, functional: 0, external: 0, effectiveAge: 0, economicLife: 50 };
    const dep = Object.assign(defaultDepreciation, depreciation || {});

    // Sum costs
    const totalConstruction = Number(directCosts || 0) + Number(indirectCosts || 0);
    
    // Calculate physical age-life depreciation
    let physicalDepreciation = Number(dep.physical || 0);
    if (dep.effectiveAge > 0 && dep.economicLife > 0) {
       physicalDepreciation = totalConstruction * (dep.effectiveAge / dep.economicLife);
    }
    
    // Total Depreciation
    const totalDepreciation = physicalDepreciation + Number(dep.functional || 0) + Number(dep.external || 0);

    const finalValue = Number(landValue || 0) + totalConstruction - totalDepreciation;

    const newValuation = new Valuation({
      subjectProperty,
      method: 'Cost Method',
      costData: {
        landValue: Number(landValue || 0),
        directCosts: Number(directCosts || 0),
        indirectCosts: Number(indirectCosts || 0),
        depreciation: {
          physical: physicalDepreciation,
          functional: Number(dep.functional || 0),
          external: Number(dep.external || 0),
          effectiveAge: Number(dep.effectiveAge || 0),
          economicLife: Number(dep.economicLife || 50)
        }
      },
      finalValue: Math.round(finalValue),
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

  try {
    const gdv = Number(residualData.gdv || 0);
    const constructionCosts = Number(residualData.constructionCosts || 0);
    const professionalFees = Number(residualData.professionalFees || 0);
    
    const financeRate = Number(residualData.financeRate || 0) / 100;
    const financeDurationMonths = Number(residualData.financeDurationMonths || 0);
    
    const baseCostForFinance = constructionCosts + professionalFees;
    let financeCosts = Number(residualData.financeCosts || 0);
    
    // Automatically calculate S-curve interest on development loan if rates are provided
    if (financeRate > 0 && financeDurationMonths > 0) {
      financeCosts = baseCostForFinance * financeRate * (financeDurationMonths / 12) * 0.5;
    }

    let developerProfit = Number(residualData.developerProfit || 0);
    const profitMargin = Number(residualData.developerProfitMargin || 0);
    
    // Calculate Developer Profit as % of GDV if margin is provided
    if (profitMargin > 0) {
      developerProfit = gdv * (profitMargin / 100);
    }
    
    const totalDeductions = constructionCosts + professionalFees + financeCosts + developerProfit;
    const finalValue = Math.max(0, gdv - totalDeductions); // Land Value cannot be negative practically

    const newValuation = new Valuation({
      subjectProperty,
      method: 'Residual Method',
      residualData: {
        gdv,
        constructionCosts,
        professionalFees,
        financeRate: Number(residualData.financeRate || 0),
        financeDurationMonths,
        financeCosts,
        developerProfitMargin: profitMargin,
        developerProfit
      },
      finalValue: Math.round(finalValue),
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

  try {
    const revenue = Number(profitData.grossAnnualRevenue || 0);
    const purchases = Number(profitData.purchases || 0);
    const opex = Number(profitData.operatingExpenses || 0);
    
    const grossProfit = revenue - purchases;
    const netProfit = grossProfit - opex;

    // Deduct Tenant/Operator Shares to find Divisible Balance (True Rent)
    const tenantReturn = Number(profitData.tenantCapital || 0) * (Number(profitData.tenantReturnRate || 0) / 100);
    const operatorAmount = Number(profitData.operatorRemuneration || 0);

    const divisibleBalance = netProfit - (tenantReturn + operatorAmount);

    const capYield = Number(profitData.capitalizationYield || 10);
    const yearsPurchase = 100 / capYield;
    
    // Value = Net Rent (Divisible Balance) * YP
    const finalValue = Math.max(0, divisibleBalance) * yearsPurchase;

    const newValuation = new Valuation({
      subjectProperty,
      method: 'Profit Method',
      profitData: {
        grossAnnualRevenue: revenue,
        purchases,
        operatingExpenses: opex,
        tenantCapital: Number(profitData.tenantCapital || 0),
        tenantReturnRate: Number(profitData.tenantReturnRate || 0),
        operatorRemuneration: operatorAmount,
        capitalizationYield: capYield,
        yearsPurchase
      },
      finalValue: Math.round(finalValue),
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

// Delete a valuation
router.delete('/:id', auth, async (req, res) => {
  try {
    const valuation = await Valuation.findById(req.params.id);
    if (!valuation) {
      return res.status(404).json({ msg: 'Valuation not found' });
    }

    // Ensure the user owns the valuation or is admin
    const isOwner = valuation.valuer && valuation.valuer.toString() === req.user.id;
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isAdmin) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await valuation.deleteOne();
    res.json({ msg: 'Valuation removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Valuation not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;

