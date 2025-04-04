const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/bluemoon_apartment',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    
    if (process.env.NODE_ENV === 'production') {
      console.error('Error details:', error.message);
    } else {
      process.exit(1);
    }
  }
};

module.exports = connectDB; 