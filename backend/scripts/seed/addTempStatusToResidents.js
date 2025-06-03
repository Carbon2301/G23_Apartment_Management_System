const mongoose = require('mongoose');
const Resident = require('../../models/residentModel');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bluemoon_apartment');

const addTempStatusToResidents = async () => {
  try {
    console.log('🏠 Bắt đầu thêm trạng thái tạm trú/tạm vắng cho cư dân...');

    // Lấy một số cư dân để cập nhật
    const residents = await Resident.find().limit(5);

    if (residents.length === 0) {
      console.log('❌ Không tìm thấy cư dân nào.');
      return;
    }

    // Cập nhật 2 cư dân đầu tiên làm tạm trú
    if (residents[0]) {
      await Resident.findByIdAndUpdate(residents[0]._id, {
        tempStatus: 'tam_tru',
        tempStartDate: new Date('2024-12-01'),
        tempEndDate: new Date('2025-06-01'),
        tempReason: 'Đi làm tại thành phố Hồ Chí Minh'
      });
      console.log(`✅ ${residents[0].fullName} - Đã set TẠM TRÚ`);
    }

    if (residents[1]) {
      await Resident.findByIdAndUpdate(residents[1]._id, {
        tempStatus: 'tam_tru',
        tempStartDate: new Date('2024-11-15'),
        tempEndDate: new Date('2025-05-15'),
        tempReason: 'Học tập tại Hà Nội'
      });
      console.log(`✅ ${residents[1].fullName} - Đã set TẠM TRÚ`);
    }

    // Cập nhật 2 cư dân tiếp theo làm tạm vắng
    if (residents[2]) {
      await Resident.findByIdAndUpdate(residents[2]._id, {
        tempStatus: 'tam_vang',
        tempStartDate: new Date('2024-12-15'),
        tempEndDate: new Date('2025-02-15'),
        tempReason: 'Du học tại Nhật Bản'
      });
      console.log(`✅ ${residents[2].fullName} - Đã set TẠM VẮNG`);
    }

    if (residents[3]) {
      await Resident.findByIdAndUpdate(residents[3]._id, {
        tempStatus: 'tam_vang',
        tempStartDate: new Date('2024-10-01'),
        tempEndDate: new Date('2025-01-01'),
        tempReason: 'Công tác dài hạn tại Singapore'
      });
      console.log(`✅ ${residents[3].fullName} - Đã set TẠM VẮNG`);
    }

    // Cư dân cuối giữ nguyên (none)
    console.log(`ℹ️  ${residents[4]?.fullName || 'Cư dân khác'} - Giữ nguyên (không có trạng thái tạm trú/tạm vắng)`);

    // Thống kê
    const stats = await Promise.all([
      Resident.countDocuments({ tempStatus: 'tam_tru' }),
      Resident.countDocuments({ tempStatus: 'tam_vang' }),
      Resident.countDocuments({ tempStatus: 'none' }),
      Resident.countDocuments()
    ]);

    console.log('\n📊 THỐNG KÊ TRẠNG THÁI TẠM TRÚ/TẠM VẮNG:');
    console.log(`Tạm trú: ${stats[0]}`);
    console.log(`Tạm vắng: ${stats[1]}`);
    console.log(`Bình thường: ${stats[2]}`);
    console.log(`Tổng cư dân: ${stats[3]}`);

    console.log('\n🎉 Hoàn thành cập nhật trạng thái tạm trú/tạm vắng!');
    console.log('\n💡 Bây giờ bạn có thể:');
    console.log('1. Xem chi tiết hộ gia đình để thấy badge tạm trú/tạm vắng');
    console.log('2. Sửa thông tin cư dân để thay đổi trạng thái');
    console.log('3. Thấy ngày hết hạn dưới badge');

  } catch (error) {
    console.error('❌ Lỗi khi cập nhật:', error);
  } finally {
    mongoose.connection.close();
  }
};

addTempStatusToResidents(); 