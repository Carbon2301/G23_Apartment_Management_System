const mongoose = require('mongoose');
const Fee = require('../../models/feeModel');

// Load environment variables
require('dotenv').config();

async function restoreOriginalFees() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bluemoon_apartment', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('🔌 Đã kết nối đến MongoDB');

    // 1. Khôi phục "Phí quản lý hàng tháng" (PHI001)
    console.log('\n🔄 Đang khôi phục "Phí quản lý hàng tháng"...');
    
    const restoredFee = await Fee.findOneAndUpdate(
      { feeCode: 'PHI001' },
      { active: true },
      { new: true }
    );
    
    if (restoredFee) {
      console.log(`✅ Đã khôi phục: ${restoredFee.name} (${restoredFee.feeCode}) - ${restoredFee.amount.toLocaleString()} VND`);
    } else {
      console.log('❌ Không tìm thấy phí PHI001');
    }

    // 2. Khôi phục phí gửi xe về giá trị ban đầu
    console.log('\n🔄 Đang khôi phục phí gửi xe về giá trị ban đầu...');
    
    const vehicleFees = [
      { code: 'PHI002', name: 'Phí gửi xe ô tô', originalAmount: 1200000 },
      { code: 'PHI003', name: 'Phí gửi xe máy', originalAmount: 100000 },
      { code: 'PHI005', name: 'Phí gửi xe', originalAmount: 0.99 }
    ];
    
    for (const fee of vehicleFees) {
      const updatedFee = await Fee.findOneAndUpdate(
        { feeCode: fee.code },
        { amount: fee.originalAmount },
        { new: true }
      );
      
      if (updatedFee) {
        console.log(`✅ Đã khôi phục ${updatedFee.name} (${updatedFee.feeCode}): ${updatedFee.amount.toLocaleString()} VND`);
      } else {
        console.log(`❌ Không tìm thấy phí ${fee.code}`);
      }
    }

    // 3. Hiển thị danh sách phí sau khi khôi phục
    console.log('\n📋 Danh sách phí sau khi khôi phục:');
    const allFees = await Fee.find({}).sort({ feeCode: 1 });
    
    for (const fee of allFees) {
      const status = fee.active ? '✅ Hoạt động' : '❌ Không hoạt động';
      const amount = `${fee.amount.toLocaleString()} VND`;
      console.log(`- ${fee.feeCode}: ${fee.name} - ${amount} (${status})`);
    }

  } catch (error) {
    console.error('❌ Lỗi khi khôi phục phí:', error);
    throw error;
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('\n🔌 Đã đóng kết nối MongoDB');
  }
}

// Run the script
restoreOriginalFees()
  .then(() => {
    console.log('\n✅ Hoàn thành việc khôi phục phí về trạng thái ban đầu!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }); 