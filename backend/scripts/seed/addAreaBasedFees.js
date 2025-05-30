const mongoose = require('mongoose');
const Fee = require('../../models/feeModel');

// Load environment variables
require('dotenv').config();

async function addAreaBasedFees() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bluemoon_apartment', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('🔌 Đã kết nối đến MongoDB');

    // Check if area-based fees already exist
    const existingAreaFees = await Fee.find({
      feeCode: { $in: ['PHI006', 'PHI007'] }
    });

    if (existingAreaFees.length > 0) {
      console.log(`✅ Đã có ${existingAreaFees.length} loại phí theo diện tích, bỏ qua bước này.`);
      return;
    }

    // Create new area-based fees
    const areaBasedFees = [
      {
        feeCode: 'PHI006',
        name: 'Phí dịch vụ chung cư',
        amount: 5000,
        feeType: 'mandatory',
        description: 'Phí dịch vụ chung cư tính theo diện tích căn hộ - 5,000 VND/m²/tháng',
        startDate: new Date('2024-01-01'),
        active: true
      },
      {
        feeCode: 'PHI007',
        name: 'Phí quản lý chung cư',
        amount: 7000,
        feeType: 'mandatory',
        description: 'Phí quản lý chung cư tính theo diện tích căn hộ - 7,000 VND/m²/tháng',
        startDate: new Date('2024-01-01'),
        active: true
      }
    ];

    await Fee.insertMany(areaBasedFees);
    console.log(`✅ Đã tạo ${areaBasedFees.length} loại phí theo diện tích mới.`);

    // Display the created fees
    console.log('\n📋 Các loại phí theo diện tích đã tạo:');
    for (const fee of areaBasedFees) {
      console.log(`- ${fee.feeCode}: ${fee.name} - ${fee.amount.toLocaleString()} VND/m²/tháng`);
    }

  } catch (error) {
    console.error('❌ Lỗi khi thêm phí theo diện tích:', error);
    throw error;
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('🔌 Đã đóng kết nối MongoDB');
  }
}

// Run the script
addAreaBasedFees()
  .then(() => {
    console.log('✅ Hoàn thành việc thêm phí theo diện tích!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }); 