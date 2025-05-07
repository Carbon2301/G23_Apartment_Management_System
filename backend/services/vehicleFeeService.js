const Vehicle = require('../models/vehicleModel');
const Fee = require('../models/feeModel');
const Payment = require('../models/paymentModel');
const Household = require('../models/householdModel');

// Giá xe theo loại
const VEHICLE_PRICES = {
  'Xe máy': 100000,
  'Ô tô': 1200000,
  'Xe đạp': 50000,
  'Xe điện': 50000
};

// Mapping loại xe với loại phí
const VEHICLE_FEE_MAPPING = {
  'Xe máy': 'PHI003', // Phí gửi xe máy
  'Ô tô': 'PHI002',   // Phí gửi xe ô tô
  'Xe đạp': 'PHI005', // Phí gửi xe khác
  'Xe điện': 'PHI005' // Phí gửi xe khác
};

/**
 * Tính phí xe cho một hộ gia đình
 * @param {string} householdId - ID hộ gia đình
 * @returns {Object} - Chi tiết phí xe
 */
const calculateVehicleFeeForHousehold = async (householdId) => {
  try {
    // Lấy tất cả xe của hộ gia đình
    const vehicles = await Vehicle.find({
      household: householdId,
      active: true,
      status: 'Đang sử dụng'
    });

    // Đếm xe theo loại
    const vehicleCount = {};
    vehicles.forEach(vehicle => {
      const type = vehicle.vehicleType;
      vehicleCount[type] = (vehicleCount[type] || 0) + 1;
    });

    // Tính phí theo từng loại xe
    const feeDetails = [];
    let totalAmount = 0;

    for (const [vehicleType, count] of Object.entries(vehicleCount)) {
      const unitPrice = VEHICLE_PRICES[vehicleType] || VEHICLE_PRICES['Xe đạp']; // Default to xe khác
      const amount = count * unitPrice;
      totalAmount += amount;

      feeDetails.push({
        vehicleType,
        count,
        unitPrice,
        amount,
        feeCode: VEHICLE_FEE_MAPPING[vehicleType] || 'PHI005'
      });
    }

    return {
      householdId,
      totalVehicles: vehicles.length,
      vehicleCount,
      feeDetails,
      totalAmount
    };
  } catch (error) {
    console.error('Error calculating vehicle fee for household:', error);
    throw error;
  }
};

/**
 * Tính phí xe cho tất cả hộ gia đình
 * @returns {Array} - Danh sách phí xe của tất cả hộ gia đình
 */
const calculateVehicleFeesForAllHouseholds = async () => {
  try {
    const households = await Household.find({ active: true });
    const allFees = [];

    for (const household of households) {
      const feeCalculation = await calculateVehicleFeeForHousehold(household._id);
      if (feeCalculation.totalAmount > 0) {
        // Thêm thông tin apartmentNumber
        feeCalculation.apartmentNumber = household.apartmentNumber;
        allFees.push(feeCalculation);
      }
    }

    return allFees;
  } catch (error) {
    console.error('Error calculating vehicle fees for all households:', error);
    throw error;
  }
};

/**
 * Tạo thanh toán phí xe cho một tháng cụ thể
 * @param {Date} period - Tháng tạo phí (ngày 1 của tháng)
 * @param {boolean} overwriteExisting - Có ghi đè thanh toán đã tồn tại không
 * @returns {Object} - Kết quả tạo thanh toán
 */
const createVehiclePaymentsForMonth = async (period, overwriteExisting = false) => {
  try {
    // Đảm bảo period là ngày 1 của tháng
    const normalizedPeriod = new Date(period.getFullYear(), period.getMonth(), 1);
    
    console.log(`🚗 Tạo phí xe cho tháng ${normalizedPeriod.getMonth() + 1}/${normalizedPeriod.getFullYear()}`);

    // Lấy tất cả loại phí xe
    const vehicleFees = await Fee.find({
      feeCode: { $in: ['PHI002', 'PHI003', 'PHI005'] },
      active: true
    });

    if (vehicleFees.length === 0) {
      throw new Error('Không tìm thấy loại phí xe trong hệ thống');
    }

    // Tính phí xe cho tất cả hộ gia đình
    const householdVehicleFees = await calculateVehicleFeesForAllHouseholds();
    
    const createdPayments = [];
    const skippedPayments = [];
    const errors = [];

    for (const householdFee of householdVehicleFees) {
      try {
        // Tạo thanh toán cho từng loại xe
        for (const feeDetail of householdFee.feeDetails) {
          const fee = vehicleFees.find(f => f.feeCode === feeDetail.feeCode);
          if (!fee) {
            console.warn(`Không tìm thấy phí với mã ${feeDetail.feeCode}`);
            continue;
          }

          // Kiểm tra xem đã có thanh toán cho tháng này chưa
          const existingPayment = await Payment.findOne({
            household: householdFee.householdId,
            fee: fee._id,
            period: normalizedPeriod
          });

          if (existingPayment && !overwriteExisting) {
            skippedPayments.push({
              household: householdFee.householdId,
              feeCode: feeDetail.feeCode,
              reason: 'Đã tồn tại'
            });
            continue;
          }

          // Xóa thanh toán cũ nếu ghi đè
          if (existingPayment && overwriteExisting) {
            await Payment.deleteOne({ _id: existingPayment._id });
          }

          // Tạo thanh toán mới
          const payment = new Payment({
            household: householdFee.householdId,
            fee: fee._id,
            amount: feeDetail.amount,
            period: normalizedPeriod,
            status: 'pending',
            note: `Phí xe ${feeDetail.vehicleType} - ${feeDetail.count} xe x ${feeDetail.unitPrice.toLocaleString()} VND`
          });

          await payment.save();
          createdPayments.push(payment);
        }
      } catch (error) {
        errors.push({
          household: householdFee.householdId,
          error: error.message
        });
      }
    }

    console.log(`✅ Đã tạo ${createdPayments.length} thanh toán phí xe`);
    console.log(`⏭️  Bỏ qua ${skippedPayments.length} thanh toán đã tồn tại`);
    if (errors.length > 0) {
      console.log(`❌ ${errors.length} lỗi xảy ra`);
    }

    return {
      created: createdPayments.length,
      skipped: skippedPayments.length,
      errors: errors.length,
      createdPayments,
      skippedPayments,
      errors
    };
  } catch (error) {
    console.error('Error creating vehicle payments:', error);
    throw error;
  }
};

/**
 * Lấy thống kê phí xe
 * @returns {Object} - Thống kê phí xe
 */
const getVehicleFeeStatistics = async () => {
  try {
    // Thống kê xe theo loại
    const vehicleStats = await Vehicle.aggregate([
      { $match: { active: true, status: 'Đang sử dụng' } },
      { $group: { 
        _id: '$vehicleType', 
        count: { $sum: 1 },
        households: { $addToSet: '$household' }
      }},
      { $addFields: {
        householdCount: { $size: '$households' }
      }},
      { $sort: { count: -1 } }
    ]);

    // Tính tổng phí xe hàng tháng
    let totalMonthlyFee = 0;
    const feeByType = {};

    for (const stat of vehicleStats) {
      const unitPrice = VEHICLE_PRICES[stat._id] || VEHICLE_PRICES['Xe đạp'];
      const totalFee = stat.count * unitPrice;
      totalMonthlyFee += totalFee;
      
      feeByType[stat._id] = {
        vehicleCount: stat.count,
        householdCount: stat.householdCount,
        unitPrice,
        totalFee
      };
    }

    // Thống kê thanh toán phí xe tháng hiện tại
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const vehicleFees = await Fee.find({
      feeCode: { $in: ['PHI002', 'PHI003', 'PHI005'] },
      active: true
    });

    const currentMonthPayments = await Payment.find({
      fee: { $in: vehicleFees.map(f => f._id) },
      period: currentMonth
    }).populate('fee');

    const paidPayments = currentMonthPayments.filter(p => p.status === 'paid');
    const pendingPayments = currentMonthPayments.filter(p => p.status === 'pending');
    const overduePayments = currentMonthPayments.filter(p => p.status === 'overdue');

    const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const pendingRevenue = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    const overdueRevenue = overduePayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      vehicleStats,
      feeByType,
      totalMonthlyFee,
      currentMonthStats: {
        totalPayments: currentMonthPayments.length,
        paidCount: paidPayments.length,
        pendingCount: pendingPayments.length,
        overdueCount: overduePayments.length,
        totalRevenue,
        pendingRevenue,
        overdueRevenue
      }
    };
  } catch (error) {
    console.error('Error getting vehicle fee statistics:', error);
    throw error;
  }
};

module.exports = {
  calculateVehicleFeeForHousehold,
  calculateVehicleFeesForAllHouseholds,
  createVehiclePaymentsForMonth,
  getVehicleFeeStatistics,
  VEHICLE_PRICES,
  VEHICLE_FEE_MAPPING
}; 