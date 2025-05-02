const Facility = require('../models/facilityModel');
const asyncHandler = require('express-async-handler');

// @desc    Lấy danh sách tất cả tiện ích
// @route   GET /api/facilities
// @access  Private
const getFacilities = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    loaiTienIch,
    trangThai,
    mucDoUuTien,
    canBaoTri
  } = req.query;

  const query = { active: true };

  // Tìm kiếm theo tên, vị trí, nhà cung cấp
  if (search) {
    query.$or = [
      { tenTienIch: { $regex: search, $options: 'i' } },
      { viTri: { $regex: search, $options: 'i' } },
      { nhaCungCap: { $regex: search, $options: 'i' } }
    ];
  }

  // Lọc theo loại tiện ích
  if (loaiTienIch) {
    query.loaiTienIch = loaiTienIch;
  }

  // Lọc theo trạng thái
  if (trangThai) {
    query.trangThai = trangThai;
  }

  // Lọc theo mức độ ưu tiên
  if (mucDoUuTien) {
    query.mucDoUuTien = mucDoUuTien;
  }

  // Lọc những tiện ích cần bảo trì
  if (canBaoTri === 'true') {
    query.baoTriTiepTheo = { $lte: new Date() };
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 }
  };

  const facilities = await Facility.find(query)
    .sort(options.sort)
    .skip((options.page - 1) * options.limit)
    .limit(options.limit);

  const total = await Facility.countDocuments(query);

  res.json({
    facilities,
    totalPages: Math.ceil(total / options.limit),
    currentPage: options.page,
    total
  });
});

// @desc    Lấy thông tin một tiện ích
// @route   GET /api/facilities/:id
// @access  Private
const getFacilityById = asyncHandler(async (req, res) => {
  const facility = await Facility.findById(req.params.id);

  if (!facility) {
    res.status(404);
    throw new Error('Không tìm thấy tiện ích');
  }

  res.json(facility);
});

// @desc    Tạo tiện ích mới
// @route   POST /api/facilities
// @access  Private/Admin/Manager
const createFacility = asyncHandler(async (req, res) => {
  const {
    tenTienIch,
    loaiTienIch,
    trangThai,
    viTri,
    ngayLapDat,
    nhaCungCap,
    lanBaoTriCuoi,
    baoTriTiepTheo,
    chiPhiBaoTri,
    hetHanBaoHanh,
    soDienThoaiHotro,
    thongSoKyThuat,
    ghiChu,
    mucDoUuTien,
    tinhTrangBaoHanh
  } = req.body;

  // Kiểm tra xem tiện ích đã tồn tại chưa
  const facilityExists = await Facility.findOne({ 
    tenTienIch, 
    viTri,
    active: true 
  });

  if (facilityExists) {
    res.status(400);
    throw new Error('Tiện ích này đã tồn tại tại vị trí này');
  }

  const facility = await Facility.create({
    tenTienIch,
    loaiTienIch,
    trangThai: trangThai || 'Hoạt động bình thường',
    viTri,
    ngayLapDat,
    nhaCungCap,
    lanBaoTriCuoi,
    baoTriTiepTheo,
    chiPhiBaoTri: chiPhiBaoTri || 0,
    hetHanBaoHanh,
    soDienThoaiHotro,
    thongSoKyThuat,
    ghiChu,
    mucDoUuTien: mucDoUuTien || 'Trung bình',
    tinhTrangBaoHanh: tinhTrangBaoHanh || 'Không có bảo hành'
  });

  res.status(201).json(facility);
});

// @desc    Cập nhật thông tin tiện ích
// @route   PUT /api/facilities/:id
// @access  Private/Admin/Manager
const updateFacility = asyncHandler(async (req, res) => {
  const facility = await Facility.findById(req.params.id);

  if (!facility) {
    res.status(404);
    throw new Error('Không tìm thấy tiện ích');
  }

  const {
    tenTienIch,
    loaiTienIch,
    trangThai,
    viTri,
    ngayLapDat,
    nhaCungCap,
    lanBaoTriCuoi,
    baoTriTiepTheo,
    chiPhiBaoTri,
    hetHanBaoHanh,
    soDienThoaiHotro,
    thongSoKyThuat,
    ghiChu,
    mucDoUuTien,
    tinhTrangBaoHanh
  } = req.body;

  // Cập nhật thông tin
  facility.tenTienIch = tenTienIch || facility.tenTienIch;
  facility.loaiTienIch = loaiTienIch || facility.loaiTienIch;
  facility.trangThai = trangThai || facility.trangThai;
  facility.viTri = viTri || facility.viTri;
  facility.ngayLapDat = ngayLapDat || facility.ngayLapDat;
  facility.nhaCungCap = nhaCungCap || facility.nhaCungCap;
  facility.lanBaoTriCuoi = lanBaoTriCuoi || facility.lanBaoTriCuoi;
  facility.baoTriTiepTheo = baoTriTiepTheo || facility.baoTriTiepTheo;
  facility.chiPhiBaoTri = chiPhiBaoTri !== undefined ? chiPhiBaoTri : facility.chiPhiBaoTri;
  facility.hetHanBaoHanh = hetHanBaoHanh || facility.hetHanBaoHanh;
  facility.soDienThoaiHotro = soDienThoaiHotro || facility.soDienThoaiHotro;
  facility.thongSoKyThuat = thongSoKyThuat || facility.thongSoKyThuat;
  facility.ghiChu = ghiChu !== undefined ? ghiChu : facility.ghiChu;
  facility.mucDoUuTien = mucDoUuTien || facility.mucDoUuTien;
  facility.tinhTrangBaoHanh = tinhTrangBaoHanh || facility.tinhTrangBaoHanh;

  const updatedFacility = await facility.save();
  res.json(updatedFacility);
});

// @desc    Xóa tiện ích (soft delete)
// @route   DELETE /api/facilities/:id
// @access  Private/Admin
const deleteFacility = asyncHandler(async (req, res) => {
  const facility = await Facility.findById(req.params.id);

  if (!facility) {
    res.status(404);
    throw new Error('Không tìm thấy tiện ích');
  }

  facility.active = false;
  await facility.save();

  res.json({ message: 'Tiện ích đã được xóa thành công' });
});

// @desc    Ghi nhận bảo trì cho tiện ích
// @route   PUT /api/facilities/:id/maintenance
// @access  Private/Admin/Manager
const recordMaintenance = asyncHandler(async (req, res) => {
  const facility = await Facility.findById(req.params.id);

  if (!facility) {
    res.status(404);
    throw new Error('Không tìm thấy tiện ích');
  }

  const {
    ngayBaoTri,
    chiPhiBaoTri,
    baoTriTiepTheo,
    ghiChuBaoTri,
    trangThaiSauBaoTri
  } = req.body;

  // Cập nhật thông tin bảo trì
  facility.lanBaoTriCuoi = ngayBaoTri || new Date();
  facility.chiPhiBaoTri = (facility.chiPhiBaoTri || 0) + (chiPhiBaoTri || 0);
  facility.baoTriTiepTheo = baoTriTiepTheo;
  facility.trangThai = trangThaiSauBaoTri || 'Hoạt động bình thường';
  
  if (ghiChuBaoTri) {
    facility.ghiChu = facility.ghiChu ? 
      `${facility.ghiChu}\n[${new Date().toLocaleDateString('vi-VN')}] ${ghiChuBaoTri}` : 
      `[${new Date().toLocaleDateString('vi-VN')}] ${ghiChuBaoTri}`;
  }

  const updatedFacility = await facility.save();
  res.json(updatedFacility);
});

// @desc    Lấy thống kê tiện ích
// @route   GET /api/facilities/statistics
// @access  Private
const getFacilityStatistics = asyncHandler(async (req, res) => {
  // Thống kê theo trạng thái
  const statusStats = await Facility.aggregate([
    { $match: { active: true } },
    { $group: { _id: '$trangThai', count: { $sum: 1 } } }
  ]);

  // Thống kê theo loại tiện ích
  const typeStats = await Facility.aggregate([
    { $match: { active: true } },
    { $group: { _id: '$loaiTienIch', count: { $sum: 1 } } }
  ]);

  // Tiện ích cần bảo trì
  const needMaintenanceCount = await Facility.countDocuments({
    active: true,
    baoTriTiepTheo: { $lte: new Date() }
  });

  // Tổng chi phí bảo trì
  const totalMaintenanceCost = await Facility.aggregate([
    { $match: { active: true } },
    { $group: { _id: null, total: { $sum: '$chiPhiBaoTri' } } }
  ]);

  // Tiện ích hết bảo hành
  const expiredWarrantyCount = await Facility.countDocuments({
    active: true,
    hetHanBaoHanh: { $lt: new Date() }
  });

  res.json({
    statusStats,
    typeStats,
    needMaintenanceCount,
    totalMaintenanceCost: totalMaintenanceCost[0]?.total || 0,
    expiredWarrantyCount,
    totalFacilities: await Facility.countDocuments({ active: true })
  });
});

// @desc    Lấy danh sách tiện ích cần bảo trì
// @route   GET /api/facilities/maintenance-due
// @access  Private
const getMaintenanceDue = asyncHandler(async (req, res) => {
  const facilities = await Facility.find({
    active: true,
    baoTriTiepTheo: { $lte: new Date() }
  }).sort({ baoTriTiepTheo: 1 });

  res.json(facilities);
});

module.exports = {
  getFacilities,
  getFacilityById,
  createFacility,
  updateFacility,
  deleteFacility,
  recordMaintenance,
  getFacilityStatistics,
  getMaintenanceDue
}; 