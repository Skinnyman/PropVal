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
    transactionAdjustments: [{ reason: String, percentage: Number, amount: Number }],
    propertyAdjustments: [{ reason: String, percentage: Number, amount: Number }],
    netAdjustment: { type: Number },
    adjustedPrice: { type: Number }
  }],
  incomeData: {
    methodology: { type: String, enum: ['Direct Capitalization', 'DCF'], default: 'Direct Capitalization' },
    annualRentalIncome: { type: Number },
    vacancyRate: { type: Number },
    operatingExpenses: { type: Number },
    capRate: { type: Number },
    dcfProjections: [{
      year: Number,
      grossIncome: Number,
      expenses: Number,
      netOperatingIncome: Number,
      discountRate: Number,
      presentValue: Number
    }],
    terminalValue: { type: Number }
  },
  costData: {
    landValue: { type: Number },
    directCosts: { type: Number },
    indirectCosts: { type: Number },
    depreciation: {
      physical: { type: Number, default: 0 },
      functional: { type: Number, default: 0 },
      external: { type: Number, default: 0 },
      effectiveAge: { type: Number },
      economicLife: { type: Number }
    }
  },
  residualData: {
    gdv: { type: Number },
    constructionCosts: { type: Number },
    professionalFees: { type: Number },
    financeRate: { type: Number },
    financeDurationMonths: { type: Number },
    financeCosts: { type: Number },
    developerProfitMargin: { type: Number },
    developerProfit: { type: Number }
  },
  profitData: {
    grossAnnualRevenue: { type: Number },
    purchases: { type: Number, default: 0 },
    operatingExpenses: { type: Number },
    tenantCapital: { type: Number, default: 0 },
    tenantReturnRate: { type: Number, default: 0 },
    operatorRemuneration: { type: Number, default: 0 },
    capitalizationYield: { type: Number },
    yearsPurchase: { type: Number }
  },
  finalValue: { type: Number, required: true },
  valuer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reportUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Valuation', ValuationSchema);
