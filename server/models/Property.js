const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
  location: {
    region: { type: String, required: true },
    district: { type: String },
    suburb: { type: String, required: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  propertyInfo: {
    propertyType: { type: String, required: true },
    landSize: { type: Number }, // in sqm or acres
    size: { type: Number }, // in sqm (was buildingSize)
    rooms: { type: Number }, // was numberOfRooms
    yearBuilt: { type: Number },
    condition: { type: String }
  },
  marketData: {
    salePrice: { type: Number },
    rentalValue: { type: Number },
    capRate: { type: Number },
    occupancyRate: { type: Number }, // added
    constructionCostPerSqm: { type: Number }, // added
    marketDemandIndicator: { type: String, enum: ['Low', 'Moderate', 'High'] }, // added
    transactionDate: { type: Date, default: Date.now }
  },
  verificationStatus: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Pending' 
  },
  dataSourceReference: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  flags: [
    {
      reason: { type: String },
      flaggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Property', PropertySchema);
