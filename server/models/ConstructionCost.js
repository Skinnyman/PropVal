const mongoose = require('mongoose');

const ConstructionCostSchema = new mongoose.Schema({
  category: { type: String, required: true },
  buildingType: { type: String, required: true },
  spec: { type: String },
  region: { type: String },
  minCost: { type: Number },
  maxCost: { type: Number },
  period: { type: String },
  notes: { type: String }
});

module.exports = mongoose.model('ConstructionCost', ConstructionCostSchema);
