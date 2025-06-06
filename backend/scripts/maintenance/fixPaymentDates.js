const mongoose = require('mongoose');
const Payment = require('../../models/paymentModel');

// Load environment variables
require('dotenv').config();

async function fixPaymentDates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bluemoon_apartment', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('🔌 Đã kết nối đến MongoDB');

    // Lấy ngày hiện tại
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-based (5 = tháng 6)
    
    console.log(`📅 Ngày hiện tại: ${today.toLocaleDateString('vi-VN')}`);
    console.log(`📅 Tháng hiện tại: ${currentMonth + 1}/${currentYear}`);

    // Tìm tất cả thanh toán có ngày thanh toán trong tương lai
    const futurePayments = await Payment.find({
      paymentDate: { $gt: today },
      status: 'paid'
    });

    console.log(`🔍 Tìm thấy ${futurePayments.length} thanh toán có ngày trong tương lai`);

    let updatedCount = 0;

    for (const payment of futurePayments) {
      // Tạo ngày thanh toán ngẫu nhiên trong quá khứ (1-6 tháng trước)
      const monthsBack = Math.floor(Math.random() * 6) + 1; // 1-6 tháng trước
      const paymentDate = new Date();
      paymentDate.setMonth(paymentDate.getMonth() - monthsBack);
      
      // Đặt ngày trong tháng (1-28 để tránh vấn đề cuối tháng)
      const dayOfMonth = Math.floor(Math.random() * 28) + 1;
      paymentDate.setDate(dayOfMonth);

      // Cập nhật thanh toán
      await Payment.findByIdAndUpdate(payment._id, {
        paymentDate: paymentDate
      });

      updatedCount++;
    }

    console.log(`✅ Đã cập nhật ${updatedCount} thanh toán`);

    // Cập nhật các period cho thanh toán theo diện tích về quá khứ
    console.log('\n🔄 Đang cập nhật period cho thanh toán theo diện tích...');

    // Tạo danh sách 6 tháng trong quá khứ
    const pastMonths = [];
    for (let i = 1; i <= 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      pastMonths.push({
        period: new Date(date.getFullYear(), date.getMonth(), 1),
        year: date.getFullYear(),
        month: date.getMonth() + 1
      });
    }

    // Lấy phí theo diện tích
    const Fee = require('../../models/feeModel');
    const serviceFee = await Fee.findOne({ feeCode: 'PHI006' });
    const managementFee = await Fee.findOne({ feeCode: 'PHI007' });

    if (serviceFee && managementFee) {
      // Xóa tất cả thanh toán cũ cho phí theo diện tích
      await Payment.deleteMany({ 
        fee: { $in: [serviceFee._id, managementFee._id] } 
      });
      console.log('🗑️ Đã xóa thanh toán cũ cho phí theo diện tích');

      // Tạo lại thanh toán với thời gian trong quá khứ
      const Household = require('../../models/householdModel');
const User = require('../../models/userModel');
      
      const households = await Household.find({});
      const adminUser = await User.findOne({ role: 'admin' });
      
      let newPaymentsCount = 0;
      const paymentMethods = ['cash', 'bank_transfer', 'card', 'other'];
      const payerNames = [
        'Nguyễn Văn An', 'Trần Thị Bình', 'Lê Văn Cường', 'Phạm Thị Dung',
        'Hoàng Văn Em', 'Đỗ Thị Phượng', 'Bùi Văn Giang', 'Vũ Thị Hoa',
        'Đinh Văn Ích', 'Ngô Thị Kim'
      ];

      for (const household of households) {
        const area = household.area || (Math.floor(Math.random() * 50) + 50);
        
        // Cập nhật diện tích nếu chưa có
        if (!household.area) {
          await Household.findByIdAndUpdate(household._id, { area: area });
        }

        for (const monthData of pastMonths) {
          // Tạo thanh toán cho phí dịch vụ
          const serviceAmount = area * serviceFee.amount;
          const serviceStatus = Math.random() > 0.25 ? 'paid' : (Math.random() > 0.6 ? 'pending' : 'overdue');
          
          const servicePayment = new Payment({
            fee: serviceFee._id,
            household: household._id,
            amount: serviceAmount,
            status: serviceStatus,
            paymentDate: serviceStatus === 'paid' ? 
              new Date(monthData.year, monthData.month - 1, Math.floor(Math.random() * 28) + 1) : 
              undefined,
            dueDate: new Date(monthData.year, monthData.month - 1, 15),
            method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            collector: adminUser ? adminUser._id : undefined,
            period: monthData.period,
            note: `Phí dịch vụ chung cư tháng ${monthData.month}/${monthData.year} - Căn hộ ${household.apartmentNumber}`,
            payerName: payerNames[Math.floor(Math.random() * payerNames.length)],
            payerPhone: `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
            receiptNumber: serviceStatus === 'paid' ? 
              `DV${monthData.year}${monthData.month.toString().padStart(2, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}` : 
              undefined
          });

          try {
            await servicePayment.save();
            newPaymentsCount++;
          } catch (error) {
            if (error.code !== 11000) {
              console.error('Lỗi tạo thanh toán dịch vụ:', error.message);
            }
          }

          // Tạo thanh toán cho phí quản lý
          const managementAmount = area * managementFee.amount;
          const managementStatus = Math.random() > 0.25 ? 'paid' : (Math.random() > 0.6 ? 'pending' : 'overdue');
          
          const managementPayment = new Payment({
            fee: managementFee._id,
            household: household._id,
            amount: managementAmount,
            status: managementStatus,
            paymentDate: managementStatus === 'paid' ? 
              new Date(monthData.year, monthData.month - 1, Math.floor(Math.random() * 28) + 1) : 
              undefined,
            dueDate: new Date(monthData.year, monthData.month - 1, 15),
            method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
            collector: adminUser ? adminUser._id : undefined,
            period: monthData.period,
            note: `Phí quản lý chung cư tháng ${monthData.month}/${monthData.year} - Căn hộ ${household.apartmentNumber}`,
            payerName: payerNames[Math.floor(Math.random() * payerNames.length)],
            payerPhone: `09${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
            receiptNumber: managementStatus === 'paid' ? 
              `QL${monthData.year}${monthData.month.toString().padStart(2, '0')}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}` : 
              undefined
          });

          try {
            await managementPayment.save();
            newPaymentsCount++;
          } catch (error) {
            if (error.code !== 11000) {
              console.error('Lỗi tạo thanh toán quản lý:', error.message);
            }
          }
        }
      }

      console.log(`✅ Đã tạo lại ${newPaymentsCount} thanh toán cho phí theo diện tích`);
    }

    // Kiểm tra lại
    const remainingFuturePayments = await Payment.find({
      paymentDate: { $gt: today },
      status: 'paid'
    });

    console.log(`\n📊 Kết quả sau khi sửa:`);
    console.log(`❌ Còn lại ${remainingFuturePayments.length} thanh toán có ngày trong tương lai`);

    // Hiển thị khoảng thời gian thanh toán
    const earliestPayment = await Payment.findOne({
      paymentDate: { $exists: true }
    }).sort({ paymentDate: 1 });

    const latestPayment = await Payment.findOne({
      paymentDate: { $exists: true }
    }).sort({ paymentDate: -1 });

    if (earliestPayment && latestPayment) {
      console.log(`📅 Khoảng thời gian thanh toán: ${earliestPayment.paymentDate.toLocaleDateString('vi-VN')} - ${latestPayment.paymentDate.toLocaleDateString('vi-VN')}`);
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
fixPaymentDates()
  .then(() => {
    console.log('\n✅ Hoàn thành việc sửa ngày thanh toán!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }); 