const mongoose = require('mongoose');

const ValuationSchema = new mongoose.Schema({
  subjectProperty: { type: Object, required: true },
  method: { 
    type: String, 
    enum: [
      'Comparable Sales', 
      'Income Capitalization', 
      'Cost Method', 
      'Residual Method', 
      'Profit Method'
    ], 
    required: true 
  },
  comparables: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
  adjustments: [{
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
    adjustmentValue: { type: Number },
    reason: { type: String }
  }],
  incomeData: {
    annualRentalIncome: { type: Number },
    vacancyRate: { type: Number },
    operatingExpenses: { type: Number },
    capRate: { type: Number }
  },
  costData: {
    landValue: { type: Number },
    constructionCostPerSqm: { type: Number },
    depreciation: { type: Number }
  },
  residualData: {
    gdv: { type: Number },
    constructionCosts: { type: Number },
    professionalFees: { type: Number },
    financeCosts: { type: Number },
    developerProfit: { type: Number }
  },
  profitData: {
    grossAnnualRevenue: { type: Number },
    operatingExpenses: { type: Number },
    capitalizationYield: { type: Number }
  },
  finalValue: { type: Number, required: true },
  valuer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reportUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Valuation', ValuationSchema);
