const mongoose = require('mongoose');
const Payment = require('../../models/paymentModel');
const Fee = require('../../models/feeModel');
const Household = require('../../models/householdModel');
const User = require('../../models/userModel');

// Load environment variables
require('dotenv').config();

async function addMoreAreaPayments() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bluemoon_apartment', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('🔌 Đã kết nối đến MongoDB');

    // Lấy thông tin các phí
    const serviceFee = await Fee.findOne({ feeCode: 'PHI006' }); // Phí dịch vụ chung cư
    const managementFee = await Fee.findOne({ feeCode: 'PHI007' }); // Phí quản lý chung cư
    
    // Lấy tất cả hộ gia đình
    const households = await Household.find({});
    console.log(`📋 Tìm thấy ${households.length} hộ gia đình`);

    // Lấy admin user làm collector
    const adminUser = await User.findOne({ role: 'admin' });
    
    // Tạo thanh toán cho tháng hiện tại và tháng tới
    const currentDate = new Date();
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    
    const periods = [
      {
        name: 'Tháng hiện tại',
        period: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1
      },
      {
        name: 'Tháng tới',
        period: nextMonth,
        year: nextMonth.getFullYear(),
        month: nextMonth.getMonth() + 1
      }
    ];

    console.log('\n💰 Đang tạo thanh toán bổ sung...');
    
    let totalCreated = 0;
    const paymentMethods = ['cash', 'bank_transfer', 'card', 'other'];
    const payerNames = [
      'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Văn Cường', 'Phạm Thị Dung',
      'Hoàng Văn Em', 'Đỗ Thị Phượng', 'Bùi Văn Giang', 'Vũ Thị Hoa',
      'Đinh Văn Ích', 'Ngô Thị Kim'
    ];

    for (const household of households) {
      // Đảm bảo mỗi hộ có diện tích
      const area = household.area || (Math.floor(Math.random() * 50) + 50);
      
      // Cập nhật diện tích cho household nếu chưa có
      if (!household.area) {
        await Household.findByIdAndUpdate(household._id, { area: area });
      }
      
      for (const periodData of periods) {
        // Tạo thanh toán cho phí dịch vụ chung cư
        const serviceAmount = area * serviceFee.amount;
        
        try {
          const servicePayment = new Payment({
            fee: serviceFee._id,
            household: household._id,
            amount: serviceAmount,
            status: Math.random() > 0.3 ? 'paid' : (Math.random() > 0.5 ? 'pending' : 'overdue'),
            paymentDate: Math.random() > 0.3 ? 
              new Date(periodData.year, periodData.month - 1, Math.floor(Math.random() * 28) + 1) : 
              undefined,
            dueDate: new Date(periodData.year, periodData.month - 1, 15),
            method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            collector: adminUser ? adminUser._id : undefined,
            period: periodData.period,
            note: `Phí dịch vụ ${periodData.name.toLowerCase()} - Căn hộ ${household.apartmentNumber} (${area}m²)`,
            payerName: payerNames[Math.floor(Math.random() * payerNames.length)],
            payerPhone: `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
            receiptNumber: `HD${periodData.year}${periodData.month.toString().padStart(2, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
          });

          await servicePayment.save();
          totalCreated++;
        } catch (error) {
          if (error.code !== 11000) {
            console.error(`Lỗi tạo thanh toán dịch vụ:`, error.message);
          }
        }

        // Tạo thanh toán cho phí quản lý chung cư
        const managementAmount = area * managementFee.amount;
        
        try {
          const managementPayment = new Payment({
            fee: managementFee._id,
            household: household._id,
            amount: managementAmount,
            status: Math.random() > 0.3 ? 'paid' : (Math.random() > 0.5 ? 'pending' : 'overdue'),
            paymentDate: Math.random() > 0.3 ? 
              new Date(periodData.year, periodData.month - 1, Math.floor(Math.random() * 28) + 1) : 
              undefined,
            dueDate: new Date(periodData.year, periodData.month - 1, 15),
            method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            collector: adminUser ? adminUser._id : undefined,
            period: periodData.period,
            note: `Phí quản lý ${periodData.name.toLowerCase()} - Căn hộ ${household.apartmentNumber} (${area}m²)`,
            payerName: payerNames[Math.floor(Math.random() * payerNames.length)],
            payerPhone: `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
            receiptNumber: `HQ${periodData.year}${periodData.month.toString().padStart(2, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
          });

          await managementPayment.save();
          totalCreated++;
        } catch (error) {
          if (error.code !== 11000) {
            console.error(`Lỗi tạo thanh toán quản lý:`, error.message);
          }
        }
      }
    }

    // Thống kê chi tiết
    console.log(`\n📊 Thống kê tổng quan:`);
    console.log(`✅ Thanh toán mới được tạo: ${totalCreated}`);
    
    const totalServicePayments = await Payment.countDocuments({ fee: serviceFee._id });
    const totalManagementPayments = await Payment.countDocuments({ fee: managementFee._id });
    
    console.log(`📋 Tổng số thanh toán:`);
    console.log(`- Phí dịch vụ chung cư: ${totalServicePayments} thanh toán`);
    console.log(`- Phí quản lý chung cư: ${totalManagementPayments} thanh toán`);

    // Thống kê theo trạng thái
    const stats = {};
    for (const fee of [serviceFee, managementFee]) {
      const paid = await Payment.countDocuments({ fee: fee._id, status: 'paid' });
      const pending = await Payment.countDocuments({ fee: fee._id, status: 'pending' });
      const overdue = await Payment.countDocuments({ fee: fee._id, status: 'overdue' });
      const totalAmount = await Payment.aggregate([
        { $match: { fee: fee._id, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      stats[fee.name] = {
        paid,
        pending,
        overdue,
        totalRevenue: totalAmount[0]?.total || 0
      };
    }

    console.log(`\n💰 Thống kê chi tiết:`);
    for (const [feeName, stat] of Object.entries(stats)) {
      console.log(`\n${feeName}:`);
      console.log(`  ✅ Đã thanh toán: ${stat.paid}`);
      console.log(`  ⏳ Chờ thanh toán: ${stat.pending}`);
      console.log(`  ❌ Quá hạn: ${stat.overdue}`);
      console.log(`  💵 Tổng thu: ${stat.totalRevenue.toLocaleString()} VND`);
    }

  } catch (error) {
    console.error('❌ Lỗi:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Đã đóng kết nối MongoDB');
  }
}

// Run the script
addMoreAreaPayments()
  .then(() => {
    console.log('\n✅ Hoàn thành việc tạo thêm dữ liệu thanh toán!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }); 