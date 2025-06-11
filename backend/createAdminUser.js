const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/userModel');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bluemoon_apartment')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });

const createAdminUser = async () => {
  try {
    // Check if admin user already exists
    const adminExists = await User.findOne({ username: 'admin' });

    if (adminExists) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      username: 'admin',
      password: 'admin123',
      fullName: 'Admin User',
      role: 'admin',
      email: 'admin@example.com',
      phone: '0123456789',
      active: true
    });

    console.log('Admin user created:');
    console.log({
      username: admin.username,
      fullName: admin.fullName,
      role: admin.role,
      email: admin.email
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser(); 