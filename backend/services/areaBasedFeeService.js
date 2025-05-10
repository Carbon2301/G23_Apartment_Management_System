const Fee = require('../models/feeModel');
const Payment = require('../models/paymentModel');
const Household = require('../models/householdModel');

// Mapping các loại phí tính theo diện tích
const AREA_BASED_FEE_CODES = {
  'PHI006': { // Phí dịch vụ chung cư
    name: 'Phí dịch vụ chung cư',
    unitPrice: 5000, // 5,000 VND/m²/tháng
    description: 'Phí dịch vụ chung cư'
  },
  'PHI007': { // Phí quản lý chung cư  
    name: 'Phí quản lý chung cư',
    unitPrice: 7000, // 7,000 VND/m²/tháng
    description: 'Phí quản lý chung cư'
  }
};

/**
 * Tính phí theo diện tích cho một hộ gia đình
 * @param {string} householdId - ID hộ gia đình
 * @returns {Object} - Chi tiết phí theo diện tích
 */
const calculateAreaBasedFeeForHousehold = async (householdId) => {
  try {
    // Lấy thông tin hộ gia đình
    const household = await Household.findById(householdId);
    if (!household || !household.active) {
      return {
        householdId,
        apartmentNumber: household ? household.apartmentNumber : 'Unknown',
        area: 0,
        feeDetails: [],
        totalAmount: 0
      };
    }

    const area = household.area || 0;
    if (area <= 0) {
      return {
        householdId,
        apartmentNumber: household.apartmentNumber,
        area: 0,
        feeDetails: [],
        totalAmount: 0
      };
    }

    // Lấy các loại phí theo diện tích đang hoạt động
    const areaBasedFees = await Fee.find({
      feeCode: { $in: Object.keys(AREA_BASED_FEE_CODES) },
      active: true
    });

    const feeDetails = [];
    let totalAmount = 0;

    for (const fee of areaBasedFees) {
      const feeInfo = AREA_BASED_FEE_CODES[fee.feeCode];
      const amount = area * feeInfo.unitPrice;
      totalAmount += amount;

      feeDetails.push({
        feeCode: fee.feeCode,
        feeName: fee.name,
        unitPrice: feeInfo.unitPrice,
        area: area,
        amount: amount,
        feeId: fee._id
      });
    }

    return {
      householdId,
      apartmentNumber: household.apartmentNumber,
      area: area,
      feeDetails,
      totalAmount
    };
  } catch (error) {
    console.error('Error calculating area-based fee for household:', error);
    throw error;
  }
};

/**
 * Tính phí theo diện tích cho tất cả hộ gia đình
 * @returns {Array} - Danh sách phí theo diện tích cho tất cả hộ
 */
const calculateAreaBasedFeesForAllHouseholds = async () => {
  try {
    // Lấy tất cả hộ gia đình đang hoạt động
    const households = await Household.find({ active: true });
    
    const feeCalculations = [];
    
    for (const household of households) {
      const calculation = await calculateAreaBasedFeeForHousehold(household._id);
      feeCalculations.push(calculation);
    }
    
    return feeCalculations;
  } catch (error) {
    console.error('Error calculating area-based fees for all households:', error);
    throw error;
  }
};

/**
 * Tạo thanh toán phí theo diện tích cho một tháng cụ thể
 * @param {Date} period - Tháng tạo phí (ngày 1 của tháng)
 * @param {boolean} overwriteExisting - Có ghi đè thanh toán đã tồn tại không
 * @returns {Object} - Kết quả tạo thanh toán
 */
const createAreaBasedPaymentsForMonth = async (period, overwriteExisting = false) => {
  try {
    // Đảm bảo period là ngày 1 của tháng
    const normalizedPeriod = new Date(period.getFullYear(), period.getMonth(), 1);
    
    console.log(`🏢 Tạo phí theo diện tích cho tháng ${normalizedPeriod.getMonth() + 1}/${normalizedPeriod.getFullYear()}`);

    // Lấy tất cả loại phí theo diện tích
    const areaBasedFees = await Fee.find({
      feeCode: { $in: Object.keys(AREA_BASED_FEE_CODES) },
      active: true
    });

    if (areaBasedFees.length === 0) {
      throw new Error('Không tìm thấy loại phí theo diện tích trong hệ thống');
    }

    // Tính phí theo diện tích cho tất cả hộ gia đình
    const householdAreaFees = await calculateAreaBasedFeesForAllHouseholds();
    
    const createdPayments = [];
    const skippedPayments = [];
    const errors = [];

    for (const householdFee of householdAreaFees) {
      if (householdFee.totalAmount <= 0) {
        continue; // Bỏ qua nếu không có phí hoặc không có diện tích
      }

      for (const feeDetail of householdFee.feeDetails) {
        try {
          // Kiểm tra xem đã có thanh toán cho tháng này chưa
          const existingPayment = await Payment.findOne({
            household: householdFee.householdId,
            fee: feeDetail.feeId,
            period: normalizedPeriod
          });

          if (existingPayment && !overwriteExisting) {
            skippedPayments.push({
              householdId: householdFee.householdId,
              apartmentNumber: householdFee.apartmentNumber,
              feeCode: feeDetail.feeCode,
              amount: feeDetail.amount,
              reason: 'Đã có thanh toán cho tháng này'
            });
            continue;
          }

          // Tạo hoặc cập nhật thanh toán
          let payment;
          if (existingPayment && overwriteExisting) {
            payment = await Payment.findByIdAndUpdate(
              existingPayment._id,
              {
                amount: feeDetail.amount,
                status: 'pending',
                description: `${feeDetail.feeName} tháng ${normalizedPeriod.getMonth() + 1}/${normalizedPeriod.getFullYear()} - ${householdFee.area}m² × ${feeDetail.unitPrice.toLocaleString()} VND/m²`,
                period: normalizedPeriod
              },
              { new: true }
            );
          } else {
            payment = new Payment({
              household: householdFee.householdId,
              fee: feeDetail.feeId,
              amount: feeDetail.amount,
              status: 'pending',
              description: `${feeDetail.feeName} tháng ${normalizedPeriod.getMonth() + 1}/${normalizedPeriod.getFullYear()} - ${householdFee.area}m² × ${feeDetail.unitPrice.toLocaleString()} VND/m²`,
              period: normalizedPeriod
            });
            await payment.save();
          }

          createdPayments.push({
            paymentId: payment._id,
            householdId: householdFee.householdId,
            apartmentNumber: householdFee.apartmentNumber,
            feeCode: feeDetail.feeCode,
            feeName: feeDetail.feeName,
            area: householdFee.area,
            unitPrice: feeDetail.unitPrice,
            amount: feeDetail.amount
          });

        } catch (error) {
          console.error(`Lỗi tạo thanh toán phí ${feeDetail.feeCode} cho hộ ${householdFee.apartmentNumber}:`, error);
          errors.push({
            householdId: householdFee.householdId,
            apartmentNumber: householdFee.apartmentNumber,
            feeCode: feeDetail.feeCode,
            error: error.message
          });
        }
      }
    }

    const summary = {
      period: normalizedPeriod,
      totalHouseholds: householdAreaFees.length,
      created: createdPayments.length,
      skipped: skippedPayments.length,
      errors: errors.length,
      totalAmount: createdPayments.reduce((sum, p) => sum + p.amount, 0)
    };

    console.log(`✅ Tạo phí theo diện tích hoàn tất:
      - Đã tạo: ${summary.created} thanh toán
      - Đã bỏ qua: ${summary.skipped} thanh toán  
      - Lỗi: ${summary.errors} thanh toán
      - Tổng tiền: ${summary.totalAmount.toLocaleString()} VND`);

    return {
      ...summary,
      createdPayments,
      skippedPayments,
      errors
    };

  } catch (error) {
    console.error('Error creating area-based payments for month:', error);
    throw error;
  }
};

/**
 * Lấy thống kê phí theo diện tích
 * @returns {Object} - Thống kê phí theo diện tích
 */
const getAreaBasedFeeStatistics = async () => {
  try {
    // Lấy thống kê tổng quan
    const totalHouseholds = await Household.countDocuments({ active: true });
    const householdStats = await Household.aggregate([
      { $match: { active: true } },
      { 
        $group: { 
          _id: null,
          totalArea: { $sum: '$area' },
          avgArea: { $avg: '$area' },
          minArea: { $min: '$area' },
          maxArea: { $max: '$area' }
        }
      }
    ]);

    const stats = householdStats[0] || { totalArea: 0, avgArea: 0, minArea: 0, maxArea: 0 };

    // Tính tổng phí theo diện tích hàng tháng cho từng loại phí
    const feeCalculations = await calculateAreaBasedFeesForAllHouseholds();
    const totalMonthlyFees = feeCalculations.reduce((sum, calc) => sum + calc.totalAmount, 0);

    // Thống kê theo từng loại phí
    const feeBreakdown = {};
    for (const [feeCode, feeInfo] of Object.entries(AREA_BASED_FEE_CODES)) {
      const totalAmount = stats.totalArea * feeInfo.unitPrice;
      feeBreakdown[feeCode] = {
        name: feeInfo.name,
        unitPrice: feeInfo.unitPrice,
        totalArea: stats.totalArea,
        totalAmount: totalAmount
      };
    }

    // Thống kê thanh toán tháng gần nhất có dữ liệu
    const areaBasedFees = await Fee.find({
      feeCode: { $in: Object.keys(AREA_BASED_FEE_CODES) },
      active: true
    });

    // Tìm tháng gần nhất có thanh toán
    const latestPayment = await Payment.findOne({
      fee: { $in: areaBasedFees.map(f => f._id) }
    }).sort({ period: -1 });

    let recentMonthPayments = [];
    if (latestPayment) {
      recentMonthPayments = await Payment.find({
        fee: { $in: areaBasedFees.map(f => f._id) },
        period: latestPayment.period
      }).populate('fee');
    }

    const paidPayments = recentMonthPayments.filter(p => p.status === 'paid');
    const pendingPayments = recentMonthPayments.filter(p => p.status === 'pending');
    const overduePayments = recentMonthPayments.filter(p => p.status === 'overdue');

    const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const pendingRevenue = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    const overdueRevenue = overduePayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalHouseholds,
      totalArea: stats.totalArea,
      avgArea: Math.round(stats.avgArea || 0),
      minArea: stats.minArea || 0,
      maxArea: stats.maxArea || 0,
      totalMonthlyFees,
      feeBreakdown,
      currentMonthStats: {
        period: latestPayment ? latestPayment.period : null,
        totalPayments: recentMonthPayments.length,
        paidPayments: paidPayments.length,
        pendingPayments: pendingPayments.length,
        overduePayments: overduePayments.length,
        totalRevenue,
        pendingRevenue,
        overdueRevenue,
        collectionRate: recentMonthPayments.length > 0 ? 
          Math.round((paidPayments.length / recentMonthPayments.length) * 100) : 0
      }
    };
  } catch (error) {
    console.error('Error getting area-based fee statistics:', error);
    throw error;
  }
};

module.exports = {
  calculateAreaBasedFeeForHousehold,
  calculateAreaBasedFeesForAllHouseholds,
  createAreaBasedPaymentsForMonth,
  getAreaBasedFeeStatistics,
  AREA_BASED_FEE_CODES
}; 