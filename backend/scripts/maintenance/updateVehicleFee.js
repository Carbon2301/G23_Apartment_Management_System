const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Fee = require('../../models/feeModel');

dotenv.config();

const updateVehicleFee = async () => {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });

    console.log('🔗 Đã kết nối MongoDB');

    // Cập nhật tên PHI005
    const result = await Fee.updateOne(
      { feeCode: 'PHI005' },
      { 
        $set: { 
          name: 'Phí gửi xe',
          description: 'Phí gửi xe tổng hợp cho tất cả loại phương tiện'
        }
      }
    );

    if (result.matchedCount > 0) {
      console.log('✅ Đã cập nhật tên PHI005 thành "Phí gửi xe"');
    } else {
      console.log('⚠️ Không tìm thấy PHI005 để cập nhật');
    }

    // Đóng kết nối
    await mongoose.connection.close();
    console.log('📋 Hoàn thành cập nhật');

  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
};

updateVehicleFee(); 