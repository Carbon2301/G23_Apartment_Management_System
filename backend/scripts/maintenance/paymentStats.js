const mongoose = require('mongoose');
const Payment = require('../../models/paymentModel');
const Fee = require('../../models/feeModel');
const Household = require('../../models/householdModel');

// Load environment variables
require('dotenv').config();

async function showPaymentStats() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bluemoon_apartment', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('🔌 Đã kết nối đến MongoDB');

    // Lấy tất cả phí
    const fees = await Fee.find({}).sort({ feeCode: 1 });
    
    console.log('\n📋 THỐNG KÊ THANH TOÁN THEO LOẠI PHÍ\n');
    console.log('='.repeat(80));

    for (const fee of fees) {
      const payments = await Payment.find({ fee: fee._id });
      const paid = await Payment.countDocuments({ fee: fee._id, status: 'paid' });
      const pending = await Payment.countDocuments({ fee: fee._id, status: 'pending' });
      const overdue = await Payment.countDocuments({ fee: fee._id, status: 'overdue' });
      
      const totalRevenue = await Payment.aggregate([
        { $match: { fee: fee._id, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      const pendingAmount = await Payment.aggregate([
        { $match: { fee: fee._id, status: { $in: ['pending', 'overdue'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      console.log(`\n📊 ${fee.feeCode} - ${fee.name}`);
      console.log(`   💰 Giá: ${fee.amount.toLocaleString()} VND${fee.feeType === 'Bắt buộc' ? '/m²' : ''}`);
      console.log(`   📈 Tổng thanh toán: ${payments.length}`);
      console.log(`   ✅ Đã thanh toán: ${paid} (${(paid/payments.length*100).toFixed(1)}%)`);
      console.log(`   ⏳ Chờ thanh toán: ${pending} (${(pending/payments.length*100).toFixed(1)}%)`);
      console.log(`   ❌ Quá hạn: ${overdue} (${(overdue/payments.length*100).toFixed(1)}%)`);
      console.log(`   💵 Doanh thu: ${(totalRevenue[0]?.total || 0).toLocaleString()} VND`);
      console.log(`   ⏰ Còn nợ: ${(pendingAmount[0]?.total || 0).toLocaleString()} VND`);
      console.log('   ' + '-'.repeat(50));
    }

    // Thống kê tổng quan
    const totalPayments = await Payment.countDocuments({});
    const totalPaid = await Payment.countDocuments({ status: 'paid' });
    const totalPending = await Payment.countDocuments({ status: 'pending' });
    const totalOverdue = await Payment.countDocuments({ status: 'overdue' });

    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalDebt = await Payment.aggregate([
      { $match: { status: { $in: ['pending', 'overdue'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    console.log('\n🏆 TỔNG QUAN HỆ THỐNG');
    console.log('='.repeat(80));
    console.log(`📊 Tổng số thanh toán: ${totalPayments.toLocaleString()}`);
    console.log(`✅ Đã thanh toán: ${totalPaid.toLocaleString()} (${(totalPaid/totalPayments*100).toFixed(1)}%)`);
    console.log(`⏳ Chờ thanh toán: ${totalPending.toLocaleString()} (${(totalPending/totalPayments*100).toFixed(1)}%)`);
    console.log(`❌ Quá hạn: ${totalOverdue.toLocaleString()} (${(totalOverdue/totalPayments*100).toFixed(1)}%)`);
    console.log(`💵 Tổng doanh thu: ${(totalRevenue[0]?.total || 0).toLocaleString()} VND`);
    console.log(`⏰ Tổng công nợ: ${(totalDebt[0]?.total || 0).toLocaleString()} VND`);

    // Thống kê theo phương thức thanh toán
    console.log('\n💳 THỐNG KÊ THEO PHƯƠNG THỨC THANH TOÁN');
    console.log('='.repeat(80));
    
    const methods = ['cash', 'bank_transfer', 'card', 'other'];
    for (const method of methods) {
      const count = await Payment.countDocuments({ method: method, status: 'paid' });
      const amount = await Payment.aggregate([
        { $match: { method: method, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      const methodName = {
        'cash': 'Tiền mặt',
        'bank_transfer': 'Chuyển khoản',
        'card': 'Thẻ',
        'other': 'Khác'
      }[method];
      
      console.log(`${methodName}: ${count} giao dịch - ${(amount[0]?.total || 0).toLocaleString()} VND`);
    }

    // Top 5 hộ gia đình có doanh thu cao nhất
    console.log('\n🏠 TOP 5 HỘ GIA ĐÌNH CÓ DOANH THU CAO NHẤT');
    console.log('='.repeat(80));
    
    const topHouseholds = await Payment.aggregate([
      { $match: { status: 'paid' } },
      { 
        $group: { 
          _id: '$household', 
          totalPaid: { $sum: '$amount' },
          paymentCount: { $sum: 1 }
        } 
      },
      { $sort: { totalPaid: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'households',
          localField: '_id',
          foreignField: '_id',
          as: 'householdInfo'
        }
      }
    ]);

    topHouseholds.forEach((item, index) => {
      const household = item.householdInfo[0];
      console.log(`${index + 1}. Căn hộ ${household.apartmentNumber}: ${item.totalPaid.toLocaleString()} VND (${item.paymentCount} thanh toán)`);
    });

  } catch (error) {
    console.error('❌ Lỗi:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Đã đóng kết nối MongoDB');
  }
}

// Run the script
showPaymentStats()
  .then(() => {
    console.log('\n✅ Hoàn thành việc hiển thị thống kê!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }); 