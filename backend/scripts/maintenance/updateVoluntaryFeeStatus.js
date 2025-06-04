const mongoose = require('mongoose');
const Payment = require('../../models/paymentModel');
const Fee = require('../../models/feeModel');

// Load environment variables
require('dotenv').config();

async function updateVoluntaryFeeStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bluemoon_apartment', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('🔌 Đã kết nối đến MongoDB');

    // Tìm phí sửa chữa công trình chung (phí đóng góp)
    const voluntaryFee = await Fee.findOne({ feeCode: 'PHI004' });
    
    if (!voluntaryFee) {
      console.log('❌ Không tìm thấy "Phí sửa chữa công trình chung" (PHI004)');
      return;
    }

    console.log(`📋 Tìm thấy phí đóng góp: ${voluntaryFee.name} (${voluntaryFee.feeCode})`);
    console.log(`💰 Giá: ${voluntaryFee.amount.toLocaleString()} VND`);
    console.log(`📝 Loại: ${voluntaryFee.feeType}`);

    // Thống kê trạng thái hiện tại
    const totalPayments = await Payment.countDocuments({ fee: voluntaryFee._id });
    const paidCount = await Payment.countDocuments({ fee: voluntaryFee._id, status: 'paid' });
    const pendingCount = await Payment.countDocuments({ fee: voluntaryFee._id, status: 'pending' });
    const overdueCount = await Payment.countDocuments({ fee: voluntaryFee._id, status: 'overdue' });

    console.log(`\n📊 Trạng thái hiện tại:`);
    console.log(`   📈 Tổng thanh toán: ${totalPayments}`);
    console.log(`   ✅ Đã thanh toán: ${paidCount}`);
    console.log(`   ⏳ Chờ thanh toán: ${pendingCount}`);
    console.log(`   ❌ Quá hạn: ${overdueCount}`);

    // Cập nhật tất cả thanh toán của phí đóng góp thành "paid"
    console.log(`\n🔄 Đang cập nhật tất cả thanh toán thành "Đã thanh toán"...`);
    
    const updateResult = await Payment.updateMany(
      { 
        fee: voluntaryFee._id,
        status: { $in: ['pending', 'overdue'] }
      },
      { 
        $set: { 
          status: 'paid',
          paymentDate: new Date() // Đặt ngày thanh toán là hôm nay
        }
      }
    );

    console.log(`✅ Đã cập nhật ${updateResult.modifiedCount} thanh toán`);

    // Kiểm tra kết quả
    const updatedStats = {
      total: await Payment.countDocuments({ fee: voluntaryFee._id }),
      paid: await Payment.countDocuments({ fee: voluntaryFee._id, status: 'paid' }),
      pending: await Payment.countDocuments({ fee: voluntaryFee._id, status: 'pending' }),
      overdue: await Payment.countDocuments({ fee: voluntaryFee._id, status: 'overdue' })
    };

    console.log(`\n📊 Trạng thái sau khi cập nhật:`);
    console.log(`   📈 Tổng thanh toán: ${updatedStats.total}`);
    console.log(`   ✅ Đã thanh toán: ${updatedStats.paid} (${(updatedStats.paid/updatedStats.total*100).toFixed(1)}%)`);
    console.log(`   ⏳ Chờ thanh toán: ${updatedStats.pending}`);
    console.log(`   ❌ Quá hạn: ${updatedStats.overdue}`);

    // Cập nhật loại phí thành "Đóng góp" nếu chưa đúng
    console.log(`\n🔄 Đang cập nhật loại phí...`);
    
    const updatedFee = await Fee.findByIdAndUpdate(
      voluntaryFee._id,
      { feeType: 'Đóng góp' },
      { new: true }
    );

    console.log(`✅ Đã cập nhật loại phí: ${updatedFee.feeType}`);

    // Tính tổng doanh thu từ phí đóng góp
    const totalRevenue = await Payment.aggregate([
      { $match: { fee: voluntaryFee._id, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    console.log(`\n💰 Tổng doanh thu từ phí đóng góp: ${(totalRevenue[0]?.total || 0).toLocaleString()} VND`);

    // Hiển thị một số thanh toán mẫu
    console.log(`\n📋 Một số thanh toán mẫu:`);
    const samplePayments = await Payment.find({ fee: voluntaryFee._id })
      .limit(5)
      .sort({ paymentDate: -1 });

    for (const payment of samplePayments) {
      console.log(`   - Thanh toán: ${payment.amount.toLocaleString()} VND - ${payment.status} (${payment.paymentDate ? payment.paymentDate.toLocaleDateString('vi-VN') : 'N/A'})`);
    }

  } catch (error) {
    console.error('❌ Lỗi khi cập nhật phí đóng góp:', error);
    throw error;
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\n🔌 Đã đóng kết nối MongoDB');
  }
}

// Run the script
updateVoluntaryFeeStatus()
  .then(() => {
    console.log('\n✅ Hoàn thành việc cập nhật phí đóng góp!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }); 