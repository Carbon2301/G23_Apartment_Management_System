const mongoose = require('mongoose');
const Payment = require('../../models/paymentModel');
const Fee = require('../../models/feeModel');
const Household = require('../../models/householdModel');
const User = require('../../models/userModel');

// Load environment variables
require('dotenv').config();

async function addAreaBasedPayments() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bluemoon_apartment', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('🔌 Đã kết nối đến MongoDB');

    // Lấy thông tin các phí theo diện tích
    const serviceFee = await Fee.findOne({ feeCode: 'PHI006' }); // Phí dịch vụ chung cư
    const managementFee = await Fee.findOne({ feeCode: 'PHI007' }); // Phí quản lý chung cư
    
    if (!serviceFee || !managementFee) {
      console.log('❌ Không tìm thấy phí PHI006 hoặc PHI007');
      return;
    }

    console.log('✅ Tìm thấy phí:');
    console.log(`- ${serviceFee.name}: ${serviceFee.amount} VND/m²`);
    console.log(`- ${managementFee.name}: ${managementFee.amount} VND/m²`);

    // Lấy danh sách hộ gia đình
    const households = await Household.find({}).limit(20); // Giới hạn 20 hộ để test
    console.log(`📋 Tìm thấy ${households.length} hộ gia đình`);

    // Lấy admin user làm collector
    const adminUser = await User.findOne({ role: 'admin' });
    
    // Tạo thanh toán cho 6 tháng gần đây
    const months = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        period: new Date(date.getFullYear(), date.getMonth(), 1)
      });
    }

    console.log('\n💰 Đang tạo thanh toán...');
    
    let totalCreated = 0;
    const paymentMethods = ['cash', 'bank_transfer', 'card'];
    const statuses = ['paid', 'paid', 'paid', 'pending', 'overdue']; // Tỷ lệ thanh toán cao

    for (const household of households) {
      const area = household.area || Math.floor(Math.random() * 50) + 50; // Diện tích từ 50-100m²
      
      for (const monthData of months) {
        // Tạo thanh toán cho phí dịch vụ chung cư
        const serviceAmount = area * serviceFee.amount;
        const serviceStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        try {
          const servicePayment = new Payment({
            fee: serviceFee._id,
            household: household._id,
            amount: serviceAmount,
            status: serviceStatus,
            paymentDate: serviceStatus === 'paid' ? 
              new Date(monthData.year, monthData.month - 1, Math.floor(Math.random() * 28) + 1) : 
              undefined,
            dueDate: new Date(monthData.year, monthData.month - 1, 15), // Hạn thanh toán ngày 15
            method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            collector: adminUser ? adminUser._id : undefined,
            period: monthData.period,
            note: `Thanh toán phí dịch vụ chung cư tháng ${monthData.month}/${monthData.year} - Diện tích: ${area}m²`
          });

          await servicePayment.save();
          totalCreated++;
        } catch (error) {
          if (error.code !== 11000) { // Bỏ qua lỗi duplicate
            console.error(`Lỗi tạo thanh toán dịch vụ cho ${household.apartmentNumber}:`, error.message);
          }
        }

        // Tạo thanh toán cho phí quản lý chung cư
        const managementAmount = area * managementFee.amount;
        const managementStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        try {
          const managementPayment = new Payment({
            fee: managementFee._id,
            household: household._id,
            amount: managementAmount,
            status: managementStatus,
            paymentDate: managementStatus === 'paid' ? 
              new Date(monthData.year, monthData.month - 1, Math.floor(Math.random() * 28) + 1) : 
              undefined,
            dueDate: new Date(monthData.year, monthData.month - 1, 15), // Hạn thanh toán ngày 15
            method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            collector: adminUser ? adminUser._id : undefined,
            period: monthData.period,
            note: `Thanh toán phí quản lý chung cư tháng ${monthData.month}/${monthData.year} - Diện tích: ${area}m²`
          });

          await managementPayment.save();
          totalCreated++;
        } catch (error) {
          if (error.code !== 11000) { // Bỏ qua lỗi duplicate
            console.error(`Lỗi tạo thanh toán quản lý cho ${household.apartmentNumber}:`, error.message);
          }
        }
      }
    }

    // Thống kê kết quả
    console.log(`\n📊 Thống kê thanh toán đã tạo:`);
    console.log(`✅ Tổng số thanh toán đã tạo: ${totalCreated}`);
    
    const servicePayments = await Payment.find({ fee: serviceFee._id });
    const managementPayments = await Payment.find({ fee: managementFee._id });
    
    console.log(`- Phí dịch vụ chung cư: ${servicePayments.length} thanh toán`);
    console.log(`- Phí quản lý chung cư: ${managementPayments.length} thanh toán`);

    // Thống kê theo trạng thái
    const paidService = await Payment.countDocuments({ fee: serviceFee._id, status: 'paid' });
    const pendingService = await Payment.countDocuments({ fee: serviceFee._id, status: 'pending' });
    const overdueService = await Payment.countDocuments({ fee: serviceFee._id, status: 'overdue' });

    const paidManagement = await Payment.countDocuments({ fee: managementFee._id, status: 'paid' });
    const pendingManagement = await Payment.countDocuments({ fee: managementFee._id, status: 'pending' });
    const overdueManagement = await Payment.countDocuments({ fee: managementFee._id, status: 'overdue' });

    console.log(`\n📋 Thống kê theo trạng thái:`);
    console.log(`Phí dịch vụ: ${paidService} đã thanh toán, ${pendingService} chờ thanh toán, ${overdueService} quá hạn`);
    console.log(`Phí quản lý: ${paidManagement} đã thanh toán, ${pendingManagement} chờ thanh toán, ${overdueManagement} quá hạn`);

  } catch (error) {
    console.error('❌ Lỗi khi tạo thanh toán:', error);
    throw error;
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\n🔌 Đã đóng kết nối MongoDB');
  }
}

// Run the script
addAreaBasedPayments()
  .then(() => {
    console.log('\n✅ Hoàn thành việc tạo thanh toán cho phí theo diện tích!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }); 