const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Household = require('../../models/householdModel');
const Resident = require('../../models/residentModel');
const Payment = require('../../models/paymentModel');
const Fee = require('../../models/feeModel');
const User = require('../../models/userModel');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bluemoon_apartment')
  .then(async () => {
    console.log('🔌 Đã kết nối đến MongoDB');
    
    try {
      await clearDatabase();
      console.log('\n✅ Hoàn thành xóa dữ liệu!');
    } catch (error) {
      console.error('❌ Lỗi:', error);
    } finally {
      await mongoose.connection.close();
      console.log('🔌 Đã đóng kết nối MongoDB');
    }
  })
  .catch(err => {
    console.error('❌ Lỗi kết nối đến MongoDB:', err);
    process.exit(1);
  });

async function clearDatabase() {
  console.log('\n🗑️ Bắt đầu xóa dữ liệu...');

  try {
    // Xóa dữ liệu theo thứ tự để tránh lỗi khóa ngoại
    console.log('1. Xóa thanh toán...');
    const paymentResult = await Payment.deleteMany({});
    console.log(`✅ Đã xóa ${paymentResult.deletedCount} thanh toán`);

    console.log('2. Xóa cư dân...');
    const residentResult = await Resident.deleteMany({});
    console.log(`✅ Đã xóa ${residentResult.deletedCount} cư dân`);

    console.log('3. Xóa hộ gia đình...');
    const householdResult = await Household.deleteMany({});
    console.log(`✅ Đã xóa ${householdResult.deletedCount} hộ gia đình`);

    console.log('4. Xóa loại phí...');
    const feeResult = await Fee.deleteMany({});
    console.log(`✅ Đã xóa ${feeResult.deletedCount} loại phí`);

    console.log('5. Xóa người dùng (trừ admin)...');
    const userResult = await User.deleteMany({ role: { $ne: 'admin' } });
    console.log(`✅ Đã xóa ${userResult.deletedCount} người dùng`);

    // Thống kê cuối cùng
    console.log('\n📊 THỐNG KÊ SAU KHI XÓA:');
    console.log(`🏠 Số hộ gia đình còn lại: ${await Household.countDocuments()}`);
    console.log(`👥 Số cư dân còn lại: ${await Resident.countDocuments()}`);
    console.log(`💰 Số thanh toán còn lại: ${await Payment.countDocuments()}`);
    console.log(`📋 Số loại phí còn lại: ${await Fee.countDocuments()}`);
    console.log(`👤 Số người dùng còn lại: ${await User.countDocuments()}`);

  } catch (error) {
    console.error('❌ Lỗi khi xóa dữ liệu:', error);
    throw error;
  }
}