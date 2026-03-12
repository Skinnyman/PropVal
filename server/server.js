const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/properties', require('./routes/properties'));
app.use('/api/valuations', require('./routes/valuations'));

app.get('/', (req, res) => {
  res.send('PropVal GH API is running...');
});

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/propvalgh';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    // Continue running the server even if DB fails for now, or exit
    app.listen(PORT, () => console.log(`Server running on port ${PORT} (DB connection failed)`));
  });
