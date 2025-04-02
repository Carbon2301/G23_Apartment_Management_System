const app = require('./src/app');
const connectDB = require('./src/config/database');
const config = require('./src/config');

// Connect to MongoDB
connectDB();

// For traditional server environments
if (config.nodeEnv !== 'production') {
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
}

// Export the Express API for Vercel serverless deployment
module.exports = app; 