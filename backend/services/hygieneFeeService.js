const Fee = require('../models/feeModel');
const Payment = require('../models/paymentModel');
const Household = require('../models/householdModel');
const Resident = require('../models/residentModel');

// Thông tin phí vệ sinh
const HYGIENE_FEE_INFO = {
  feeCode: 'PHI008', // Phí vệ sinh
  name: 'Phí vệ sinh',
  unitPrice: 6000, // 6,000 VND/tháng/người
  description: 'Phí vệ sinh theo nhân khẩu, thu 1 lần/năm với định mức 6.000 VNĐ/tháng/người'
};

/**
 * Tính phí vệ sinh cho một hộ gia đình
 * @param {string} householdId - ID hộ gia đình
 * @returns {Object} - Chi tiết phí vệ sinh
 */
const calculateHygieneFeeForHousehold = async (householdId) => {
  try {
    // Lấy thông tin hộ gia đình
    const household = await Household.findById(householdId);
    if (!household || !household.active) {
      return {
        householdId,
        apartmentNumber: household ? household.apartmentNumber : 'Unknown',
        residentCount: 0,
        feeDetails: [],
        totalAmount: 0
      };
    }

    // Lấy số cư dân đang hoạt động trong hộ gia đình
    const residents = await Resident.find({ 
      household: householdId, 
      active: true 
    });

    const residentCount = residents.length;
    
    if (residentCount <= 0) {
      return {
        householdId,
        apartmentNumber: household.apartmentNumber,
        residentCount: 0,
        feeDetails: [],
        totalAmount: 0
      };
    }

    // Tính phí vệ sinh (1 năm = 12 tháng)
    const monthlyAmount = residentCount * HYGIENE_FEE_INFO.unitPrice;
    const yearlyAmount = monthlyAmount * 12; // Thu 1 lần/năm

    // Lấy thông tin fee
    const hygieneFee = await Fee.findOne({
      feeCode: HYGIENE_FEE_INFO.feeCode,
      active: true
    });

    const feeDetails = [{
      feeCode: HYGIENE_FEE_INFO.feeCode,
      feeName: HYGIENE_FEE_INFO.name,
      unitPrice: HYGIENE_FEE_INFO.unitPrice,
      residentCount: residentCount,
      monthlyAmount: monthlyAmount,
      yearlyAmount: yearlyAmount,
      feeId: hygieneFee ? hygieneFee._id : null
    }];

    return {
      householdId,
      apartmentNumber: household.apartmentNumber,
      residentCount: residentCount,
      residents: residents.map(r => ({ id: r._id, name: r.fullName })),
      feeDetails,
      totalAmount: yearlyAmount
    };
  } catch (error) {
    console.error('Error calculating hygiene fee for household:', error);
    throw error;
  }
};

/**
 * Tính phí vệ sinh cho tất cả hộ gia đình
 * @returns {Array} - Danh sách phí vệ sinh cho tất cả hộ
 */
const calculateHygieneFeesForAllHouseholds = async () => {
  try {
    // Lấy tất cả hộ gia đình đang hoạt động
    const households = await Household.find({ active: true });
    
    const feeCalculations = [];
    
    for (const household of households) {
      const calculation = await calculateHygieneFeeForHousehold(household._id);
      if (calculation.totalAmount > 0) {
        feeCalculations.push(calculation);
      }
    }
    
    return feeCalculations;
  } catch (error) {
    console.error('Error calculating hygiene fees for all households:', error);
    throw error;
  }
};

/**
 * Tạo thanh toán hàng loạt cho phí vệ sinh
 * @param {number} year - Năm tạo thanh toán (mặc định năm hiện tại)
 * @returns {Object} - Kết quả tạo thanh toán
 */
const createBulkHygieneFeePayments = async (year = new Date().getFullYear()) => {
  try {
    // Lấy fee vệ sinh
    const hygieneFee = await Fee.findOne({
      feeCode: HYGIENE_FEE_INFO.feeCode,
      active: true
    });

    if (!hygieneFee) {
      throw new Error('Không tìm thấy phí vệ sinh trong hệ thống');
    }

    // Tính phí cho tất cả hộ gia đình
    const feeCalculations = await calculateHygieneFeesForAllHouseholds();
    
    if (feeCalculations.length === 0) {
      return {
        success: false,
        message: 'Không có hộ gia đình nào để tạo phí vệ sinh'
      };
    }

    // Tạo period cho năm được chỉ định (tháng 1)
    const period = new Date(year, 0, 1); // 1/1/year

    const paymentsToCreate = [];
    
    for (const calculation of feeCalculations) {
      // Kiểm tra xem đã có thanh toán phí vệ sinh cho năm này chưa
      const existingPayment = await Payment.findOne({
        household: calculation.householdId,
        fee: hygieneFee._id,
        period: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1)
        }
      });

      if (!existingPayment) {
        paymentsToCreate.push({
          household: calculation.householdId,
          fee: hygieneFee._id,
          amount: calculation.totalAmount,
          period: period,
          status: 'pending',
          note: `Phí vệ sinh năm ${year} - ${calculation.residentCount} nhân khẩu x 6.000 VNĐ/tháng x 12 tháng`
        });
      }
    }

    if (paymentsToCreate.length > 0) {
      await Payment.insertMany(paymentsToCreate);
    }

    return {
      success: true,
      message: `Đã tạo ${paymentsToCreate.length} khoản phí vệ sinh cho năm ${year}`,
      createdCount: paymentsToCreate.length,
      totalAmount: paymentsToCreate.reduce((sum, p) => sum + p.amount, 0)
    };
  } catch (error) {
    console.error('Error creating bulk hygiene fee payments:', error);
    throw error;
  }
};

/**
 * Lấy thống kê phí vệ sinh
 * @returns {Object} - Thống kê phí vệ sinh
 */
const getHygieneFeeStatistics = async () => {
  try {
    // Lấy thống kê tổng quan
    const totalHouseholds = await Household.countDocuments({ active: true });
    const totalResidents = await Resident.countDocuments({ active: true });
    
    // Tính phí cho tất cả hộ gia đình
    const feeCalculations = await calculateHygieneFeesForAllHouseholds();
    
    const totalMonthlyFees = feeCalculations.reduce((sum, calc) => sum + (calc.residentCount * HYGIENE_FEE_INFO.unitPrice), 0);
    const totalYearlyFees = totalMonthlyFees * 12;

    // Thống kê thanh toán cho năm hiện tại
    const currentYear = new Date().getFullYear();
    const hygieneFee = await Fee.findOne({
      feeCode: HYGIENE_FEE_INFO.feeCode,
      active: true
    });

    let paymentStats = {
      totalPaid: 0,
      totalPending: 0,
      paidCount: 0,
      pendingCount: 0
    };

    if (hygieneFee) {
      const currentYearPayments = await Payment.find({
        fee: hygieneFee._id,
        period: {
          $gte: new Date(currentYear, 0, 1),
          $lt: new Date(currentYear + 1, 0, 1)
        }
      });

      paymentStats = {
        totalPaid: currentYearPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
        totalPending: currentYearPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
        paidCount: currentYearPayments.filter(p => p.status === 'paid').length,
        pendingCount: currentYearPayments.filter(p => p.status === 'pending').length
      };
    }

    return {
      totalHouseholds,
      totalResidents,
      unitPrice: HYGIENE_FEE_INFO.unitPrice,
      totalMonthlyFees,
      totalYearlyFees,
      householdDetails: feeCalculations,
      paymentStats,
      currentYear
    };
  } catch (error) {
    console.error('Error getting hygiene fee statistics:', error);
    throw error;
  }
};

module.exports = {
  calculateHygieneFeeForHousehold,
  calculateHygieneFeesForAllHouseholds,
  createBulkHygieneFeePayments,
  getHygieneFeeStatistics,
  HYGIENE_FEE_INFO
}; 