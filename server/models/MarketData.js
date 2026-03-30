const mongoose = require('mongoose');

const MarketDataSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: [
      'Market Overview',
      'Sale Transactions',
      'Construction Costs',
      'Building Materials',
      'Fittings & Fixtures',
      'Cap Rates / Yields',
      'Land Values',
      'Rental Evidence'
    ]
  },

  // --- Common & Base Fields ---
  subCategory: { type: String }, // e.g., 'Kitchen', 'Bathroom', 'Residential'
  title: { type: String, required: false },
  region: { type: String },
  city: { type: String },
  area: { type: String },
  propertyType: { type: String },
  location: { type: String }, // Legacy location string
  notes: { type: String },
  source: { type: String }, // Provided by user during upload
  declared: { type: Boolean, default: false }, // Professional declaration

  // --- Category Specific Fields ---

  // 1. Sale Transactions & Land Values
  price: { type: String },
  saleDate: { type: String },
  landSize: { type: String },
  zoning: { type: String },
  tenure: { type: String },
  plotSize: { type: String }, // Legacy

  // 2. Rental Evidence
  buildingSize: { type: String },
  yearBuilt: { type: String },
  rent: { type: String },
  rentBasis: { type: String },
  occupancy: { type: String },

  // 3. Construction Costs
  cost: { type: String },
  gfa: { type: String },
  spec: { type: String },
  completionDate: { type: String },

  // 4. Building Materials & Fittings
  materialName: { type: String },
  materialPrice: { type: String },
  materialUnit: { type: String },
  supplier: { type: String },

  // 5. Cap Rates / Yields
  capRate: { type: String },
  annualRent: { type: String },
  propertyValue: { type: String },
  leaseType: { type: String },
  multiplier: { type: String }, // (YP)

  // Generic Legacy / Fallback
  minPrice: { type: Number },
  maxPrice: { type: Number },
  basis: { type: String },
  period: { type: String, default: 'Q1 2025' },

  // --- System Fields ---
  icon: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isVerified: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MarketData', MarketDataSchema);
