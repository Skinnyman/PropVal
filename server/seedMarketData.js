const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MarketData = require('./models/MarketData');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/propvalgh';

const seedData = [
  // Market Overview (Indicators)
  {
    category: 'Market Overview',
    title: 'Average Property Yield',
    value: '8.4',
    unit: '%',
    change: '+0.5%',
    changeText: 'vs Q4 2024',
    trend: 'up',
    chartData: [7.2, 7.5, 7.8, 8.0, 8.2, 8.4],
    icon: 'TrendingUp'
  },
  {
    category: 'Market Overview',
    title: 'Mortgage Interest Rate',
    value: '22.5',
    unit: '%',
    change: '-1.2%',
    changeText: 'vs Q4 2024',
    trend: 'down',
    chartData: [25.0, 24.5, 24.0, 23.5, 23.0, 22.5],
    icon: 'Percent'
  },
  {
    category: 'Market Overview',
    title: 'Prime Office Rents',
    value: '25.00',
    unit: 'USD/sqm',
    change: 'Stable',
    changeText: 'vs Q4 2024',
    trend: 'neutral',
    chartData: [24.0, 24.5, 25.0, 25.0, 25.0, 25.0],
    icon: 'BarChart3'
  },

  // Fittings & Fixtures
  {
    category: 'Fittings & Fixtures',
    subCategory: 'Kitchen',
    title: 'Basic Kitchen Cabinet Set',
    spec: 'Basic',
    minPrice: 4000,
    maxPrice: 8000,
    unit: 'Per set',
    notes: 'MDF, standard finish, local manufacture.'
  },
  {
    category: 'Fittings & Fixtures',
    subCategory: 'Kitchen',
    title: 'Mid-range Kitchen Cabinet Set',
    spec: 'Mid-range',
    minPrice: 8000,
    maxPrice: 20000,
    unit: 'Per set',
    notes: 'Plywood carcass, soft-close hinges.'
  },
  {
    category: 'Fittings & Fixtures',
    subCategory: 'Kitchen',
    title: 'Premium Kitchen (Imported)',
    spec: 'Premium',
    minPrice: 20000,
    maxPrice: 80000,
    unit: 'Per set',
    notes: 'Imported European/Asian quartz worktop.'
  },
  {
    category: 'Fittings & Fixtures',
    subCategory: 'Kitchen',
    title: 'Kitchen Sink (Stainless steel)',
    spec: 'Standard',
    minPrice: 400,
    maxPrice: 1500,
    unit: 'Per unit',
    notes: 'Single/double bowl, locally available.'
  },
  {
    category: 'Fittings & Fixtures',
    subCategory: 'Bathroom',
    title: 'W.C. / Toilet Suite (Standard)',
    spec: 'Standard',
    minPrice: 800,
    maxPrice: 2500,
    unit: 'Per unit',
    notes: 'Close-coupled, local brand or imported.'
  },
  {
    category: 'Fittings & Fixtures',
    subCategory: 'Doors & Windows',
    title: 'Security Door (Steel)',
    spec: 'Standard',
    minPrice: 2000,
    maxPrice: 5000,
    unit: 'Per door',
    notes: 'Common main entrance, locks, reinforced.'
  },

  // Cap Rates / Yields
  {
    category: 'Cap Rates / Yields',
    title: 'Grade A Office',
    location: 'Airport City, Accra',
    minPrice: 8.5, // Used for Cap Rate min
    maxPrice: 9.5, // Used for Cap Rate max
    multiplier: '11.4 YP',
    period: 'Q1 2025',
    notes: 'Multinational tenants, long leases. Stable, low risk.'
  },
  {
    category: 'Cap Rates / Yields',
    title: 'Retail (Prime high street)',
    location: 'Oxford St / Osu, Accra',
    minPrice: 7.5,
    maxPrice: 9.0,
    multiplier: '12.1 YP',
    period: 'Q1 2025',
    notes: 'Oxford Street; GHS 2,000-14,200/month rent.'
  },
  {
    category: 'Cap Rates / Yields',
    title: 'Industrial / Warehouse',
    location: 'Tema / Spintex',
    minPrice: 10.0,
    maxPrice: 14.0,
    multiplier: '8.3 YP',
    period: 'Q1 2025',
    notes: 'Longer leases; triple net common near port.'
  },
  {
    category: 'Cap Rates / Yields',
    title: 'Residential (prime)',
    location: 'East Legon / Cantonments / Ridge',
    minPrice: 8.0,
    maxPrice: 10.0,
    multiplier: '11.1 YP',
    period: 'Q1 2025',
    notes: 'East Legon; avg GHS 0.75M property, 9-10% yield.'
  },

  // Land Values
  {
    category: 'Land Values',
    title: 'East Legon',
    region: 'Greater Accra',
    zoning: 'Residential',
    plotSize: 'approx (600-1000m²)',
    minPrice: 400000,
    maxPrice: 1200000,
    unit: 'Per plot',
    notes: 'Premium residential; High demand, very limited supply.'
  },
  {
    category: 'Land Values',
    title: 'Cantonments',
    region: 'Greater Accra',
    zoning: 'Residential',
    plotSize: 'approx (400-800m²)',
    minPrice: 800000,
    maxPrice: 2500000,
    unit: 'Per plot',
    notes: 'Diplomatic area, highest residential land values in Ghana.'
  },
  {
    category: 'Land Values',
    title: 'Spintex Road',
    region: 'Greater Accra',
    zoning: 'Mixed / Commercial',
    plotSize: 'Per acre',
    minPrice: 800000,
    maxPrice: 2000000,
    unit: 'Per acre',
    notes: 'Fast-growing corridor; 9-10% yields reported.'
  },
  {
    category: 'Land Values',
    title: 'Nhyiaeso / Ahodwo',
    region: 'Ashanti',
    zoning: 'Residential',
    plotSize: 'approx (400-800m²)',
    minPrice: 80000,
    maxPrice: 300000,
    unit: 'Per plot',
    notes: 'Prime Kumasi residential; 50-70% below Accra prices.'
  },

  // Rental Evidence
  {
    category: 'Rental Evidence',
    title: '2-bed Apartment',
    location: 'East Legon',
    region: 'Greater Accra',
    minPrice: 8000,
    maxPrice: 18000,
    basis: 'monthly',
    notes: 'Expat & professional market; 2 years advance common.'
  },
  {
    category: 'Rental Evidence',
    title: 'Grade A Office Space',
    location: 'Airport City',
    region: 'Greater Accra',
    minPrice: 25,
    maxPrice: 35,
    basis: 'per m² per month',
    notes: 'USD equivalent: $25-35/m²/month (approx).'
  },
  {
    category: 'Rental Evidence',
    title: 'High Street Retail',
    location: 'Oxford Street, Osu',
    region: 'Greater Accra',
    minPrice: 2000,
    maxPrice: 14200,
    basis: 'monthly',
    notes: 'Wide range - frontage, footfall dependent.'
  },

  // Construction Costs (Migrated)
  {
    category: 'Construction Costs',
    title: 'Basic / Self-build (1-2 storey)',
    spec: 'Basic',
    region: 'All Regions',
    minPrice: 1200,
    maxPrice: 1800,
    period: 'Q1 2025',
    notes: 'Block & mortar, simple finishes, local materials.'
  },
  {
    category: 'Construction Costs',
    title: 'Standard House (3-4 bed)',
    spec: 'Standard',
    region: 'All Regions',
    minPrice: 1800,
    maxPrice: 2800,
    period: 'Q1 2025',
    notes: 'Good quality finishes, tiled floors, plastered walls.'
  },
  {
    category: 'Construction Costs',
    title: 'Quality / Luxury House',
    spec: 'Quality',
    region: 'Greater Accra',
    minPrice: 3500,
    maxPrice: 6000,
    period: 'Q1 2025',
    notes: 'Imported fittings, luxury finishes, smart systems.'
  },
  {
    category: 'Construction Costs',
    title: 'Luxury Villa / Prestige',
    spec: 'Prestige',
    region: 'Greater Accra',
    minPrice: 6000,
    maxPrice: 12000,
    period: 'Q1 2025',
    notes: 'Airport Res. Cantonments, East Legon - top spec.'
  },

  // Building Materials
  {
    category: 'Building Materials',
    title: 'Cement (50Kg Bag)',
    subCategory: 'Structural',
    spec: 'Standard (P42.5)',
    minPrice: 95,
    maxPrice: 115,
    unit: 'Per bag',
    region: 'All Regions',
    notes: 'Dangote, GHACEM. Prices vary by haulage distance.'
  },
  {
    category: 'Building Materials',
    title: 'High Tensile Iron Rods',
    subCategory: 'Structural',
    spec: '12mm-16mm',
    minPrice: 9500,
    maxPrice: 11500,
    unit: 'Per tonne',
    region: 'Greater Accra',
    notes: 'Local & imported stock. Price fluctuation tied to exchange rate.'
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Seed: Connected to DB');

    await MarketData.deleteMany({});
    console.log('Seed: Cleared existing MarketData');

    await MarketData.insertMany(seedData);
    console.log('Seed: Successfully populated MarketData');

    process.exit();
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
};

seedDB();
