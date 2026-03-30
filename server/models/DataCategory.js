const mongoose = require('mongoose');

const DataCategorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  title: { type: String },
  subtitle: { type: String },
  info: { type: String },
  icon: { type: String },
  order: { type: Number, default: 0 }
});

module.exports = mongoose.model('DataCategory', DataCategorySchema);
