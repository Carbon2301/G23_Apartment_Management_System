const hygieneFeeService = require('../services/hygieneFeeService');
const asyncHandler = require('express-async-handler');

// @desc    Tính phí vệ sinh cho một hộ gia đình
// @route   GET /api/hygiene-fees/calculate/:householdId
// @access  Private
const calculateHouseholdHygieneFee = asyncHandler(async (req, res) => {
  const { householdId } = req.params;
  
  try {
    const calculation = await hygieneFeeService.calculateHygieneFeeForHousehold(householdId);
    
    res.json({
      success: true,
      data: calculation
    });
  } catch (error) {
    console.error('Error calculating hygiene fee for household:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tính phí vệ sinh cho hộ gia đình này'
    });
  }
});

// @desc    Tính phí vệ sinh cho tất cả hộ gia đình
// @route   GET /api/hygiene-fees/calculate-all
// @access  Private
const calculateAllHygieneFees = asyncHandler(async (req, res) => {
  try {
    const calculations = await hygieneFeeService.calculateHygieneFeesForAllHouseholds();
    
    const totalAmount = calculations.reduce((sum, calc) => sum + calc.totalAmount, 0);
    const totalResidents = calculations.reduce((sum, calc) => sum + calc.residentCount, 0);
    
    res.json({
      success: true,
      data: {
        householdDetails: calculations,
        summary: {
          totalHouseholds: calculations.length,
          totalResidents: totalResidents,
          totalAmount: totalAmount,
          unitPrice: hygieneFeeService.HYGIENE_FEE_INFO.unitPrice
        }
      }
    });
  } catch (error) {
    console.error('Error calculating hygiene fees for all households:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tính phí vệ sinh cho tất cả hộ gia đình'
    });
  }
});

// @desc    Tạo thanh toán hàng loạt cho phí vệ sinh
// @route   POST /api/hygiene-fees/create-bulk-payments
// @access  Private/Admin
const createBulkHygieneFeePayments = asyncHandler(async (req, res) => {
  const { year } = req.body;
  const targetYear = year || new Date().getFullYear();
  
  try {
    const result = await hygieneFeeService.createBulkHygieneFeePayments(targetYear);
    
    if (result.success) {
      res.status(201).json({
        success: true,
        message: result.message,
        data: {
          createdCount: result.createdCount,
          totalAmount: result.totalAmount,
          year: targetYear
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error creating bulk hygiene fee payments:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tạo thanh toán hàng loạt cho phí vệ sinh'
    });
  }
});

// @desc    Lấy thống kê phí vệ sinh
// @route   GET /api/hygiene-fees/statistics
// @access  Private
const getHygieneFeeStatistics = asyncHandler(async (req, res) => {
  try {
    const statistics = await hygieneFeeService.getHygieneFeeStatistics();
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error getting hygiene fee statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thống kê phí vệ sinh'
    });
  }
});

// @desc    Xem preview trước khi tạo thanh toán hàng loạt
// @route   GET /api/hygiene-fees/preview/:year
// @access  Private
const previewBulkHygieneFeePayments = asyncHandler(async (req, res) => {
  const { year } = req.params;
  const targetYear = parseInt(year) || new Date().getFullYear();
  
  try {
    const calculations = await hygieneFeeService.calculateHygieneFeesForAllHouseholds();
    
    const previewData = {
      year: targetYear,
      householdDetails: calculations.slice(0, 10), // Hiển thị 10 hộ đầu tiên
      totalHouseholds: calculations.length,
      totalResidents: calculations.reduce((sum, calc) => sum + calc.residentCount, 0),
      totalAmount: calculations.reduce((sum, calc) => sum + calc.totalAmount, 0),
      unitPrice: hygieneFeeService.HYGIENE_FEE_INFO.unitPrice,
      description: hygieneFeeService.HYGIENE_FEE_INFO.description
    };
    
    res.json({
      success: true,
      data: previewData
    });
  } catch (error) {
    console.error('Error previewing bulk hygiene fee payments:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xem preview phí vệ sinh'
    });
  }
});

module.exports = {
  calculateHouseholdHygieneFee,
  calculateAllHygieneFees,
  createBulkHygieneFeePayments,
  getHygieneFeeStatistics,
  previewBulkHygieneFeePayments
}; 