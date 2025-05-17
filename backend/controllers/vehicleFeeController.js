const asyncHandler = require('express-async-handler');
const vehicleFeeService = require('../services/vehicleFeeService');

// @desc    Tính phí xe cho một hộ gia đình
// @route   GET /api/vehicle-fees/calculate/:householdId
// @access  Private
const calculateVehicleFeeForHousehold = asyncHandler(async (req, res) => {
  const { householdId } = req.params;
  
  const feeCalculation = await vehicleFeeService.calculateVehicleFeeForHousehold(householdId);
  
  res.json({
    success: true,
    data: feeCalculation
  });
});

// @desc    Tính phí xe cho tất cả hộ gia đình
// @route   GET /api/vehicle-fees/calculate-all
// @access  Private
const calculateVehicleFeesForAllHouseholds = asyncHandler(async (req, res) => {
  const feeCalculations = await vehicleFeeService.calculateVehicleFeesForAllHouseholds();
  
  const summary = {
    totalHouseholds: feeCalculations.length,
    totalVehicles: feeCalculations.reduce((sum, calc) => sum + calc.totalVehicles, 0),
    totalAmount: feeCalculations.reduce((sum, calc) => sum + calc.totalAmount, 0)
  };
  
  res.json({
    success: true,
    summary,
    data: feeCalculations
  });
});

// @desc    Tạo thanh toán phí xe cho một tháng
// @route   POST /api/vehicle-fees/create-payments
// @access  Private/Admin
const createVehiclePayments = asyncHandler(async (req, res) => {
  const { 
    year = new Date().getFullYear(), 
    month = new Date().getMonth() + 1,
    overwriteExisting = false 
  } = req.body;
  
  // Tạo ngày đầu tháng
  const period = new Date(year, month - 1, 1);
  
  const result = await vehicleFeeService.createVehiclePaymentsForMonth(period, overwriteExisting);
  
  res.json({
    success: true,
    message: `Đã tạo ${result.created} thanh toán phí xe cho tháng ${month}/${year}`,
    data: result
  });
});

// @desc    Lấy thống kê phí xe
// @route   GET /api/vehicle-fees/statistics
// @access  Private
const getVehicleFeeStatistics = asyncHandler(async (req, res) => {
  const statistics = await vehicleFeeService.getVehicleFeeStatistics();
  
  res.json({
    success: true,
    data: statistics
  });
});

// @desc    Lấy bảng giá xe
// @route   GET /api/vehicle-fees/prices
// @access  Private
const getVehiclePrices = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      prices: vehicleFeeService.VEHICLE_PRICES,
      feeMapping: vehicleFeeService.VEHICLE_FEE_MAPPING
    }
  });
});

// @desc    Xem trước phí xe cho tháng tiếp theo
// @route   GET /api/vehicle-fees/preview
// @access  Private
const previewVehicleFeesForNextMonth = asyncHandler(async (req, res) => {
  const { 
    year = new Date().getFullYear(), 
    month = new Date().getMonth() + 2 // Tháng tiếp theo
  } = req.query;
  
  // Nếu month > 12, chuyển sang năm sau
  const actualYear = month > 12 ? year + 1 : year;
  const actualMonth = month > 12 ? 1 : month;
  
  const feeCalculations = await vehicleFeeService.calculateVehicleFeesForAllHouseholds();
  
  const preview = {
    period: {
      year: actualYear,
      month: actualMonth,
      monthName: new Date(actualYear, actualMonth - 1, 1).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
    },
    summary: {
      totalHouseholds: feeCalculations.length,
      totalVehicles: feeCalculations.reduce((sum, calc) => sum + calc.totalVehicles, 0),
      totalAmount: feeCalculations.reduce((sum, calc) => sum + calc.totalAmount, 0)
    },
    householdDetails: feeCalculations.map(calc => ({
      householdId: calc.householdId,
      apartmentNumber: calc.apartmentNumber,
      totalVehicles: calc.totalVehicles,
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
  calculateVehicleFeeForHousehold,
  calculateVehicleFeesForAllHouseholds,
  createVehiclePayments,
  getVehicleFeeStatistics,
  getVehiclePrices,
  previewVehicleFeesForNextMonth
}; 