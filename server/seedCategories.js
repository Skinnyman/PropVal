const mongoose = require('mongoose');
const dotenv = require('dotenv');
const DataCategory = require('./models/DataCategory');

dotenv.config();

const categories = [
  { id: 'Market Overview', label: 'Market Overview', title: 'Market Intelligence Overview', subtitle: 'National Snapshot • March 2025', info: 'This overview provides a high-level summary of professional property market trends across Ghana. Data is aggregated from quarterly valuation reports, official land registry transfers, and verified agency transactions.', icon: 'BarChart3', order: 1 },
  { id: 'Sale Transactions', label: 'Sale Transactions', title: 'Sale Evidence Database', subtitle: 'Confirmed Transfers • Greater Accra & Ashanti', info: 'Granular evidence of confirmed property sales. Use this data for direct comparison in market-based valuations. All entries include verified sale dates and verified indices.', icon: 'FileText', order: 2 },
  { id: 'Rental Evidence', label: 'Rental Evidence', title: 'Rental Intelligence', subtitle: 'Lease Transcripts • Yield Analysis', info: 'Current rental rates across residential, office, and commercial sectors. Vital for income-capitalization and DCF valuation methods.', icon: 'Home', order: 3 },
  { id: 'Construction Costs', label: 'Construction Costs', title: 'Replacement Cost Database', subtitle: 'GHS per Square Metre • Building Types', info: 'Standardized construction rates by building specification. Essential for the Cost Approach (Depreciated Replacement Cost). Rates include labor, materials, and professional fees.', icon: 'HardHat', order: 4 },
  { id: 'Building Materials', label: 'Building Materials', title: 'Material Price Tracker', subtitle: 'Supplier Quotes • Weekly Updates', info: 'Real-time pricing for core construction inputs (Cement, Rebar, Sand). Helps in adjusting construction cost models for inflation.', icon: 'Box', order: 5 },
  { id: 'Cap Rates / Yields', label: 'Cap Rates / Yields', title: 'Investment Parameters', subtitle: 'Risk Premium • Capitalization Rates', info: 'Benchmark capitalization rates derived from market analysis. Used to convert annual income into capital value for stable investment properties.', icon: 'Percent', order: 6 },
  { id: 'Land Values', label: 'Land Values', title: 'Land Value Mapping', subtitle: 'Zoning • Tenure • Plot Prices', info: 'Unimproved land values per plot or acre. Differentiated by zoning (Residential vs Commercial) and tenure (Freehold vs Leasehold duration).', icon: 'Map', order: 7 }
];

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await DataCategory.deleteMany({});
    await DataCategory.insertMany(categories);
    console.log('Categories seeded successfully');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedCategories();
