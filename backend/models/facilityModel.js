const mongoose = require('mongoose');

const facilitySchema = new mongoose.Schema({
  tenTienIch: {
    type: String,
    required: [true, 'Tên tiện ích là bắt buộc'],
    trim: true
  },
  loaiTienIch: {
    type: String,
    required: [true, 'Loại tiện ích là bắt buộc'],
    enum: [
      'Thang máy',
      'Máy phát điện',
      'Máy bơm nước',
      'Hệ thống PCCC',
      'Hệ thống điều hòa',
      'Camera an ninh',
      'Cổng tự động',
      'Hệ thống âm thanh',
      'Đèn chiếu sáng',
      'Hệ thống internet',
      'Khác'
    ]
  },
  trangThai: {
    type: String,
    required: [true, 'Trạng thái là bắt buộc'],
    enum: ['Hoạt động bình thường', 'Đang bảo trì', 'Hỏng hóc', 'Ngừng hoạt động'],
    default: 'Hoạt động bình thường'
  },
  viTri: {
    type: String,
    required: [true, 'Vị trí là bắt buộc'],
    trim: true
  },
  ngayLapDat: {
    type: Date,
    required: [true, 'Ngày lắp đặt là bắt buộc']
  },
  nhaCungCap: {
    type: String,
    required: [true, 'Nhà cung cấp là bắt buộc'],
    trim: true
  },
  lanBaoTriCuoi: {
    type: Date
  },
  baoTriTiepTheo: {
    type: Date
  },
  chiPhiBaoTri: {
    type: Number,
    default: 0,
    min: [0, 'Chi phí bảo trì không thể âm']
  },
  hetHanBaoHanh: {
    type: Date
  },
  soDienThoaiHotro: {
    type: String,
    trim: true
  },
  thongSoKyThuat: {
    congSuat: String,
    dienAp: String,
    donViTinh: String,
    thongSoKhac: String
  },
  ghiChu: {
    type: String,
    trim: true
  },
  mucDoUuTien: {
    type: String,
    enum: ['Thấp', 'Trung bình', 'Cao', 'Rất cao'],
    default: 'Trung bình'
  },
  tinhTrangBaoHanh: {
    type: String,
    enum: ['Còn bảo hành', 'Hết bảo hành', 'Không có bảo hành'],
    default: 'Không có bảo hành'
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual để kiểm tra cần bảo trì hay không
facilitySchema.virtual('canBaoTri').get(function() {
  if (!this.baoTriTiepTheo) return false;
  return new Date() >= this.baoTriTiepTheo;
});

// Virtual để kiểm tra tình trạng bảo hành
facilitySchema.virtual('tinhTrangBaoHanhHienTai').get(function() {
  if (!this.hetHanBaoHanh) return 'Không có bảo hành';
  return new Date() <= this.hetHanBaoHanh ? 'Còn bảo hành' : 'Hết bảo hành';
});

// Virtual để tính số ngày từ lần bảo trì cuối
facilitySchema.virtual('soNgayKhongBaoTri').get(function() {
  if (!this.lanBaoTriCuoi) return null;
  const today = new Date();
  const lastMaintenance = new Date(this.lanBaoTriCuoi);
  const diffTime = Math.abs(today - lastMaintenance);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Index cho tìm kiếm hiệu quả
facilitySchema.index({ tenTienIch: 'text', viTri: 'text', nhaCungCap: 'text' });
facilitySchema.index({ loaiTienIch: 1, trangThai: 1 });
facilitySchema.index({ baoTriTiepTheo: 1 });

module.exports = mongoose.model('Facility', facilitySchema); 