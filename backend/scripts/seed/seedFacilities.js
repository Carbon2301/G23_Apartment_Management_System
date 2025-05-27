const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Facility = require('../../models/facilityModel');

dotenv.config();

const facilityData = [
  {
    tenTienIch: 'Thang máy Tòa A - Số 1',
    loaiTienIch: 'Thang máy',
    trangThai: 'Hoạt động bình thường',
    viTri: 'Tòa A - Tầng 1 đến 25',
    ngayLapDat: new Date('2020-03-15'),
    nhaCungCap: 'Công ty TNHH Thang máy Mitsubishi Việt Nam',
    lanBaoTriCuoi: new Date('2024-09-15'),
    baoTriTiepTheo: new Date('2024-12-15'),
    chiPhiBaoTri: 15000000,
    hetHanBaoHanh: new Date('2025-03-15'),
    soDienThoaiHotro: '024-3333-4444',
    thongSoKyThuat: {
      congSuat: '10kW',
      dienAp: '380V',
      donViTinh: 'bộ',
      thongSoKhac: 'Tải trọng: 1000kg, Tốc độ: 1.5m/s'
    },
    ghiChu: 'Thang máy chính phục vụ tòa A, hoạt động tốt.',
    mucDoUuTien: 'Rất cao',
    tinhTrangBaoHanh: 'Còn bảo hành'
  },
  {
    tenTienIch: 'Thang máy Tòa A - Số 2',
    loaiTienIch: 'Thang máy',
    trangThai: 'Đang bảo trì',
    viTri: 'Tòa A - Tầng 1 đến 25',
    ngayLapDat: new Date('2020-03-15'),
    nhaCungCap: 'Công ty TNHH Thang máy Mitsubishi Việt Nam',
    lanBaoTriCuoi: new Date('2024-11-01'),
    baoTriTiepTheo: new Date('2025-02-01'),
    chiPhiBaoTri: 8000000,
    hetHanBaoHanh: new Date('2025-03-15'),
    soDienThoaiHotro: '024-3333-4444',
    thongSoKyThuat: {
      congSuat: '10kW',
      dienAp: '380V',
      donViTinh: 'bộ',
      thongSoKhac: 'Tải trọng: 1000kg, Tốc độ: 1.5m/s'
    },
    ghiChu: '[01/11/2024] Bảo trì định kỳ, thay cáp và kiểm tra hệ thống an toàn',
    mucDoUuTien: 'Rất cao',
    tinhTrangBaoHanh: 'Còn bảo hành'
  },
  {
    tenTienIch: 'Máy phát điện dự phòng',
    loaiTienIch: 'Máy phát điện',
    trangThai: 'Hoạt động bình thường',
    viTri: 'Tầng hầm B1 - Khu kỹ thuật',
    ngayLapDat: new Date('2019-12-20'),
    nhaCungCap: 'Công ty CP Máy phát điện Cummins Việt Nam',
    lanBaoTriCuoi: new Date('2024-08-20'),
    baoTriTiepTheo: new Date('2024-11-20'),
    chiPhiBaoTri: 25000000,
    hetHanBaoHanh: new Date('2024-12-20'),
    soDienThoaiHotro: '028-6666-7777',
    thongSoKyThuat: {
      congSuat: '500kVA',
      dienAp: '400V',
      donViTinh: 'máy',
      thongSoKhac: 'Động cơ diesel, Tự động khởi động khi mất điện'
    },
    ghiChu: 'Máy phát điện dự phòng cho toàn bộ chung cư khi mất điện lưới.',
    mucDoUuTien: 'Rất cao',
    tinhTrangBaoHanh: 'Hết bảo hành'
  },
  {
    tenTienIch: 'Hệ thống bơm cấp nước',
    loaiTienIch: 'Máy bơm nước',
    trangThai: 'Hoạt động bình thường',
    viTri: 'Tầng hầm B2 - Khu máy bơm',
    ngayLapDat: new Date('2019-11-10'),
    nhaCungCap: 'Công ty TNHH Grundfos Việt Nam',
    lanBaoTriCuoi: new Date('2024-10-10'),
    baoTriTiepTheo: new Date('2025-01-10'),
    chiPhiBaoTri: 12000000,
    hetHanBaoHanh: new Date('2022-11-10'),
    soDienThoaiHotro: '024-5555-6666',
    thongSoKyThuat: {
      congSuat: '15kW',
      dienAp: '380V',
      donViTinh: 'hệ thống',
      thongSoKhac: 'Lưu lượng: 100m³/h, Áp suất: 6 bar'
    },
    ghiChu: 'Hệ thống bơm cấp nước sinh hoạt cho toàn bộ chung cư.',
    mucDoUuTien: 'Cao',
    tinhTrangBaoHanh: 'Hết bảo hành'
  },
  {
    tenTienIch: 'Hệ thống PCCC tầng 1-10',
    loaiTienIch: 'Hệ thống PCCC',
    trangThai: 'Hoạt động bình thường',
    viTri: 'Tòa A - Tầng 1 đến 10',
    ngayLapDat: new Date('2020-01-15'),
    nhaCungCap: 'Công ty CP PCCC An Toàn Việt Nam',
    lanBaoTriCuoi: new Date('2024-07-15'),
    baoTriTiepTheo: new Date('2024-10-15'),
    chiPhiBaoTri: 8500000,
    hetHanBaoHanh: new Date('2025-01-15'),
    soDienThoaiHotro: '024-7777-8888',
    thongSoKyThuat: {
      congSuat: '5kW',
      dienAp: '220V',
      donViTinh: 'hệ thống',
      thongSoKhac: 'Sprinkler tự động, Báo khói, Nút báo cháy'
    },
    ghiChu: 'Hệ thống phòng cháy chữa cháy tự động cho các tầng thấp.',
    mucDoUuTien: 'Rất cao',
    tinhTrangBaoHanh: 'Còn bảo hành'
  },
  {
    tenTienIch: 'Camera an ninh Lobby',
    loaiTienIch: 'Camera an ninh',
    trangThai: 'Hỏng hóc',
    viTri: 'Tầng 1 - Khu Lobby chính',
    ngayLapDat: new Date('2021-05-20'),
    nhaCungCap: 'Công ty TNHH Hikvision Việt Nam',
    lanBaoTriCuoi: new Date('2024-05-20'),
    baoTriTiepTheo: new Date('2024-11-30'),
    chiPhiBaoTri: 3000000,
    hetHanBaoHanh: new Date('2024-05-20'),
    soDienThoaiHotro: '024-9999-0000',
    thongSoKyThuat: {
      congSuat: '50W',
      dienAp: '12V',
      donViTinh: 'bộ',
      thongSoKhac: '4K resolution, Quan sát ban đêm, Góc rộng 120°'
    },
    ghiChu: '[30/10/2024] Camera bị hỏng do sét đánh, cần thay thế module điều khiển',
    mucDoUuTien: 'Cao',
    tinhTrangBaoHanh: 'Hết bảo hành'
  },
  {
    tenTienIch: 'Cổng tự động chính',
    loaiTienIch: 'Cổng tự động',
    trangThai: 'Hoạt động bình thường',
    viTri: 'Lối vào chính - Đường Nguyễn Văn Cừ',
    ngayLapDat: new Date('2020-02-10'),
    nhaCungCap: 'Công ty TNHH Cổng tự động FAAC',
    lanBaoTriCuoi: new Date('2024-09-10'),
    baoTriTiepTheo: new Date('2024-12-10'),
    chiPhiBaoTri: 5000000,
    hetHanBaoHanh: new Date('2023-02-10'),
    soDienThoaiHotro: '024-1111-2222',
    thongSoKyThuat: {
      congSuat: '2kW',
      dienAp: '220V',
      donViTinh: 'bộ',
      thongSoKhac: 'Động cơ servo, Cảm biến chướng ngại vật, Remote điều khiển'
    },
    ghiChu: 'Cổng tự động phục vụ ra vào cho xe ô tô và xe máy.',
    mucDoUuTien: 'Trung bình',
    tinhTrangBaoHanh: 'Hết bảo hành'
  },
  {
    tenTienIch: 'Hệ thống điều hòa Lobby',
    loaiTienIch: 'Hệ thống điều hòa',
    trangThai: 'Hoạt động bình thường',
    viTri: 'Tầng 1 - Khu Lobby và sảnh chờ',
    ngayLapDat: new Date('2020-04-25'),
    nhaCungCap: 'Công ty TNHH Daikin Việt Nam',
    lanBaoTriCuoi: new Date('2024-10-25'),
    baoTriTiepTheo: new Date('2025-04-25'),
    chiPhiBaoTri: 6000000,
    hetHanBaoHanh: new Date('2025-04-25'),
    soDienThoaiHotro: '024-3333-5555',
    thongSoKyThuat: {
      congSuat: '20kW',
      dienAp: '380V',
      donViTinh: 'hệ thống',
      thongSoKhac: 'VRV system, 8 dàn lạnh, Tiết kiệm năng lượng Inverter'
    },
    ghiChu: 'Hệ thống điều hòa trung tâm cho khu vực công cộng.',
    mucDoUuTien: 'Trung bình',
    tinhTrangBaoHanh: 'Còn bảo hành'
  },
  {
    tenTienIch: 'Đèn chiếu sáng hành lang',
    loaiTienIch: 'Đèn chiếu sáng',
    trangThai: 'Hoạt động bình thường',
    viTri: 'Tất cả tầng - Hành lang và cầu thang',
    ngayLapDat: new Date('2019-12-01'),
    nhaCungCap: 'Công ty TNHH Philips Lighting Việt Nam',
    lanBaoTriCuoi: new Date('2024-06-01'),
    baoTriTiepTheo: new Date('2024-12-01'),
    chiPhiBaoTri: 4000000,
    hetHanBaoHanh: new Date('2021-12-01'),
    soDienThoaiHotro: '024-4444-5555',
    thongSoKyThuat: {
      congSuat: '5kW',
      dienAp: '220V',
      donViTinh: 'hệ thống',
      thongSoKhac: 'LED tiết kiệm điện, Cảm biến chuyển động, Điều khiển thông minh'
    },
    ghiChu: 'Hệ thống đèn LED chiếu sáng toàn bộ khu vực chung.',
    mucDoUuTien: 'Thấp',
    tinhTrangBaoHanh: 'Hết bảo hành'
  },
  {
    tenTienIch: 'Hệ thống Internet WiFi',
    loaiTienIch: 'Hệ thống internet',
    trangThai: 'Hoạt động bình thường',
    viTri: 'Toàn bộ khu vực chung - Lobby, hành lang',
    ngayLapDat: new Date('2021-08-15'),
    nhaCungCap: 'Công ty TNHH Viettel Networks',
    lanBaoTriCuoi: new Date('2024-08-15'),
    baoTriTiepTheo: new Date('2025-08-15'),
    chiPhiBaoTri: 2000000,
    hetHanBaoHanh: new Date('2024-08-15'),
    soDienThoaiHotro: '024-6666-7777',
    thongSoKyThuat: {
      congSuat: '500W',
      dienAp: '220V',
      donViTinh: 'hệ thống',
      thongSoKhac: 'Băng thông 1Gbps, 20 Access Point, Mesh network'
    },
    ghiChu: 'WiFi miễn phí cho cư dân tại khu vực chung.',
    mucDoUuTien: 'Trung bình',
    tinhTrangBaoHanh: 'Hết bảo hành'
  }
];

const seedFacilities = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bluemoon_apartment');
    console.log('📡 Đã kết nối MongoDB...');

    // Clear existing facilities
    await Facility.deleteMany({});
    console.log('🗑️  Đã xóa dữ liệu tiện ích cũ...');

    // Insert sample facilities
    const facilities = await Facility.insertMany(facilityData);
    console.log(`✅ Đã tạo ${facilities.length} tiện ích mẫu thành công!`);

    // Show created facilities
    console.log('\n📋 Danh sách tiện ích đã tạo:');
    facilities.forEach((facility, index) => {
      console.log(`${index + 1}. ${facility.tenTienIch} - ${facility.trangThai}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi tạo dữ liệu:', error.message);
    process.exit(1);
  }
};

seedFacilities(); 