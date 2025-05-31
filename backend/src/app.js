const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const config = require('./config');

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors(config.cors));

// Only use morgan in development
if (config.nodeEnv !== 'production') {
  app.use(morgan('dev'));
}

// Define Routes
app.use('/api/users', require('../routes/userRoutes'));
app.use('/api/households', require('../routes/householdRoutes'));
app.use('/api/residents', require('../routes/residentRoutes'));
app.use('/api/fees', require('../routes/feeRoutes'));
app.use('/api/payments', require('../routes/paymentRoutes'));
app.use('/api/vehicles', require('../routes/vehicleRoutes'));
app.use('/api/vehicle-fees', require('../routes/vehicleFeeRoutes'));
app.use('/api/area-fees', require('../routes/areaBasedFeeRoutes'));
app.use('/api/hygiene-fees', require('../routes/hygieneFeeRoutes'));
app.use('/api/facilities', require('../routes/facilityRoutes'));
app.use('/api/statistics', require('../routes/statisticRoutes'));

// Base route for API testing
app.get('/api', (req, res) => {
  res.json({ message: 'BlueMoon Apartment Fee Management API' });
});

// Serve static assets in production
if (config.nodeEnv === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../frontend', 'build', 'index.html'));
  });
}

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message || 'Something went wrong!',
    error: config.nodeEnv === 'production' ? {} : err
  });
});

module.exports = app; 