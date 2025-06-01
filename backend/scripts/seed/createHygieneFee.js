const mongoose = require('mongoose');
const Fee = require('../../models/feeModel');
const { HYGIENE_FEE_INFO } = require('../../services/hygieneFeeService');
require('dotenv').config();

const createHygieneFee = async () => {
  try {
    console.log('🧽 Bắt đầu tạo phí vệ sinh...');

    // Kết nối database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bluemoon_apartment');
    console.log('✅ Đã kết nối MongoDB');

    // Kiểm tra xem đã có phí vệ sinh chưa
    const existingFee = await Fee.findOne({ feeCode: HYGIENE_FEE_INFO.feeCode });

    if (existingFee) {
      console.log('⚠️  Phí vệ sinh đã tồn tại:');
      console.log({
        feeCode: existingFee.feeCode,
        name: existingFee.name,
        amount: existingFee.amount,
        active: existingFee.active
      });
      
      // Cập nhật thông tin nếu cần
      existingFee.name = HYGIENE_FEE_INFO.name;
      existingFee.amount = HYGIENE_FEE_INFO.unitPrice;
      existingFee.description = HYGIENE_FEE_INFO.description;
      existingFee.feeType = 'mandatory';
      existingFee.active = true;
      
      await existingFee.save();
      console.log('✅ Đã cập nhật thông tin phí vệ sinh');
    } else {
      // Tạo phí vệ sinh mới
      const hygieneFee = await Fee.create({
        feeCode: HYGIENE_FEE_INFO.feeCode,
        name: HYGIENE_FEE_INFO.name,
        amount: HYGIENE_FEE_INFO.unitPrice,
        feeType: 'mandatory',
        description: HYGIENE_FEE_INFO.description,
        active: true,
        startDate: new Date()
      });

      console.log('✅ Đã tạo phí vệ sinh mới:');
      console.log({
        feeCode: hygieneFee.feeCode,
        name: hygieneFee.name,
        amount: hygieneFee.amount,
        feeType: hygieneFee.feeType,
        description: hygieneFee.description
      });
    }

    console.log('\n📋 THÔNG TIN PHÍ VỆ SINH:');
    console.log(`Mã phí: ${HYGIENE_FEE_INFO.feeCode}`);
    console.log(`Tên phí: ${HYGIENE_FEE_INFO.name}`);
    console.log(`Định mức: ${HYGIENE_FEE_INFO.unitPrice.toLocaleString('vi-VN')} VND/tháng/người`);
    console.log(`Mô tả: ${HYGIENE_FEE_INFO.description}`);
    
    console.log('\n💡 CÁCH SỬ DỤNG:');
    console.log('1. Phí vệ sinh tính theo số nhân khẩu hoạt động trong hộ gia đình');
    console.log('2. Thu 1 lần/năm với định mức 6.000 VND/tháng/người');
    console.log('3. Công thức: Số nhân khẩu × 6.000 × 12 tháng');
    console.log('4. Sử dụng API /api/hygiene-fees/calculate/:householdId để tính phí');
    console.log('5. Sử dụng API /api/hygiene-fees/create-bulk-payments để tạo thanh toán hàng loạt');

    console.log('\n🎉 Hoàn thành tạo phí vệ sinh!');
  } catch (error) {
    console.error('❌ Lỗi khi tạo phí vệ sinh:', error);
  } finally {
    mongoose.connection.close();
  }
};

createHygieneFee(); 