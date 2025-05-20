const asyncHandler = require('express-async-handler');
const areaBasedFeeService = require('../services/areaBasedFeeService');

// @desc    Tính phí theo diện tích cho một hộ gia đình
// @route   GET /api/area-fees/calculate/:householdId
// @access  Private
const calculateAreaBasedFeeForHousehold = asyncHandler(async (req, res) => {
  const { householdId } = req.params;
  
  const feeCalculation = await areaBasedFeeService.calculateAreaBasedFeeForHousehold(householdId);
  
  res.json({
    success: true,
    data: feeCalculation
  });
});

// @desc    Tính phí theo diện tích cho tất cả hộ gia đình
// @route   GET /api/area-fees/calculate-all
// @access  Private
const calculateAreaBasedFeesForAllHouseholds = asyncHandler(async (req, res) => {
  const feeCalculations = await areaBasedFeeService.calculateAreaBasedFeesForAllHouseholds();
  
  const summary = {
    totalHouseholds: feeCalculations.length,
    totalArea: feeCalculations.reduce((sum, calc) => sum + calc.area, 0),
    totalAmount: feeCalculations.reduce((sum, calc) => sum + calc.totalAmount, 0),
    avgFeePerHousehold: feeCalculations.length > 0 ? 
      Math.round(feeCalculations.reduce((sum, calc) => sum + calc.totalAmount, 0) / feeCalculations.length) : 0
  };
  
  res.json({
    success: true,
    summary,
    data: feeCalculations
  });
});

// @desc    Tạo thanh toán phí theo diện tích cho một tháng
// @route   POST /api/area-fees/create-payments
// @access  Private/Admin
const createAreaBasedPayments = asyncHandler(async (req, res) => {
  const { 
    year = new Date().getFullYear(), 
    month = new Date().getMonth() + 1,
    overwriteExisting = false 
  } = req.body;
  
  // Tạo ngày đầu tháng
  const period = new Date(year, month - 1, 1);
  
  const result = await areaBasedFeeService.createAreaBasedPaymentsForMonth(period, overwriteExisting);
  
  res.json({
    success: true,
    message: `Đã tạo ${result.created} thanh toán phí theo diện tích cho tháng ${month}/${year}`,
    data: result
  });
});

// @desc    Lấy thống kê phí theo diện tích
// @route   GET /api/area-fees/statistics
// @access  Private
const getAreaBasedFeeStatistics = asyncHandler(async (req, res) => {
  const statistics = await areaBasedFeeService.getAreaBasedFeeStatistics();
  
  res.json({
    success: true,
    data: statistics
  });
});

// @desc    Lấy bảng giá phí theo diện tích
// @route   GET /api/area-fees/prices
// @access  Private
const getAreaBasedFeePrices = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      feeTypes: areaBasedFeeService.AREA_BASED_FEE_CODES,
      description: 'Phí tính theo diện tích căn hộ (VND/m²/tháng)'
    }
  });
});

// @desc    Xem trước phí theo diện tích cho tháng được chọn
// @route   GET /api/area-fees/preview
// @access  Private
const previewAreaBasedFeesForNextMonth = asyncHandler(async (req, res) => {
  const { 
    year = new Date().getFullYear(), 
    month = new Date().getMonth() + 1 // Tháng hiện tại mặc định
  } = req.query;
  
  // Chuyển đổi string thành number nếu cần
  const actualYear = parseInt(year);
  const actualMonth = parseInt(month);
  
  // Validate month
  if (actualMonth < 1 || actualMonth > 12) {
    return res.status(400).json({
      success: false,
      message: 'Tháng không hợp lệ (1-12)'
    });
  }
  
  const feeCalculations = await areaBasedFeeService.calculateAreaBasedFeesForAllHouseholds();
  
  const preview = {
    period: {
      year: actualYear,
      month: actualMonth,
      monthName: new Date(actualYear, actualMonth - 1, 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
    },
    summary: {
      totalHouseholds: feeCalculations.length,
      totalArea: feeCalculations.reduce((sum, calc) => sum + calc.area, 0),
      totalAmount: feeCalculations.reduce((sum, calc) => sum + calc.totalAmount, 0),
      avgFeePerHousehold: feeCalculations.length > 0 ? 
        Math.round(feeCalculations.reduce((sum, calc) => sum + calc.totalAmount, 0) / feeCalculations.length) : 0
    },
    householdDetails: feeCalculations.map(calc => ({
      householdId: calc.householdId,
      apartmentNumber: calc.apartmentNumber,
      area: calc.area,
      totalAmount: calc.totalAmount,
      feeDetails: calc.feeDetails
    }))
  };
  
  res.json({
    success: true,
    data: preview
  });
});

module.exports = {
  calculateAreaBasedFeeForHousehold,
  calculateAreaBasedFeesForAllHouseholds,
  createAreaBasedPayments,
  getAreaBasedFeeStatistics,
  getAreaBasedFeePrices,
  previewAreaBasedFeesForNextMonth
}; 