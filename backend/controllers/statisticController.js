const Household = require('../models/householdModel');
const Resident = require('../models/residentModel');
const Fee = require('../models/feeModel');
const Payment = require('../models/paymentModel');
const TemporaryResidence = require('../models/temporaryResidenceModel');
const TemporaryAbsence = require('../models/temporaryAbsenceModel');
const asyncHandler = require('express-async-handler');

// @desc    Get dashboard statistics
// @route   GET /api/statistics/dashboard
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const householdCount = await Household.countDocuments({ active: true });
    const residentCount = await Resident.countDocuments({ active: true });
    const feeCount = await Fee.countDocuments({ active: true });
    
    // Get payment stats
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);
    
    const currentMonthEnd = new Date();
    currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1);
    currentMonthEnd.setDate(0);
    currentMonthEnd.setHours(23, 59, 59, 999);
    
    // Lấy các khoản thanh toán của tháng hiện tại
    console.log("Tháng hiện tại: ", {
      start: currentMonthStart,
      end: currentMonthEnd
    });
    
    const paymentsThisMonth = await Payment.find({
      paymentDate: { 
        $gte: currentMonthStart, 
        $lte: currentMonthEnd 
      },
      status: 'paid'
    }).populate('fee', 'name feeType');
    
    console.log("Số lượng thanh toán tháng này: ", paymentsThisMonth.length);
    console.log("Chi tiết các thanh toán: ", paymentsThisMonth.map(p => ({
      id: p._id,
      amount: p.amount,
      date: p.paymentDate,
      fee: p.fee ? p.fee.name : 'unknown'
    })));
    
    const monthlyRevenue = paymentsThisMonth.reduce((total, payment) => total + payment.amount, 0);
    console.log("Tổng doanh thu tháng hiện tại: ", monthlyRevenue);
    
    // Sử dụng tháng hiện tại để hiển thị doanh thu
    const displayedMonthStart = currentMonthStart;
    const displayedMonthEnd = currentMonthEnd;
    const paymentsToDisplay = paymentsThisMonth;
    const displayedRevenue = monthlyRevenue;
    
    // Lấy tên tháng tiếng Việt cho tháng hiện tại
    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                       'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    const displayMonthName = `${monthNames[displayedMonthStart.getMonth()]}/${displayedMonthStart.getFullYear()}`;
    
    // Tính tỷ lệ doanh thu theo loại phí cho tháng hiển thị
    const revenueByType = {};
    
    paymentsToDisplay.forEach(payment => {
      // Sử dụng tên phí thay vì feeType để phân loại chi tiết hơn
      const feeName = payment.fee ? payment.fee.name : 'Phí khác';
      const feeDisplayName = translateFeeName(feeName);
      
      if (!revenueByType[feeDisplayName]) {
        revenueByType[feeDisplayName] = 0;
      }
      
      revenueByType[feeDisplayName] += payment.amount;
    });
    
    // Lấy dữ liệu doanh thu theo tháng trong 6 tháng gần nhất
    const monthlyTrend = await getMonthlyRevenueTrend();
    
    // Get counts for temporary residences and absences
    const tempResidenceCount = await TemporaryResidence.countDocuments({
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });
    
    const tempAbsenceCount = await TemporaryAbsence.countDocuments({
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });
    
    // Get most recent payments (ưu tiên thanh toán trong tháng hiện tại)
    const recentPayments = await Payment.find({
      status: 'paid'
    })
      .populate('household', 'apartmentNumber')
      .populate('fee', 'name type feeType')
      .sort({ paymentDate: -1 })
      .limit(10);
    
    res.json({
      counts: {
        households: householdCount,
        residents: residentCount,
        fees: feeCount,
        temporaryResidences: tempResidenceCount,
        temporaryAbsences: tempAbsenceCount
      },
      financials: {
        monthlyRevenue: displayedRevenue,
        revenueByType,
        monthlyTrend,
        displayMonthName
      },
      recentPayments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Hàm lấy doanh thu theo tháng trong 6 tháng gần nhất
const getMonthlyRevenueTrend = async () => {
  // Tạo mảng 6 tháng gần nhất
  const months = [];
  const monthNames = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
  const today = new Date();
  
  for (let i = 5; i >= 0; i--) {
    const month = new Date();
    month.setMonth(today.getMonth() - i);
    months.push({
      date: month,
      name: monthNames[month.getMonth()],
      revenue: 0
    });
  }
  
  // Lấy ngày đầu tiên của tháng cách đây 6 tháng
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);
  
  // Lấy toàn bộ thanh toán trong 6 tháng gần nhất (đã thanh toán)
  const payments = await Payment.find({
    paymentDate: { $gte: sixMonthsAgo },
    status: 'paid'
  });
  
  // Tính tổng doanh thu theo từng tháng
  payments.forEach(payment => {
    const paymentMonth = payment.paymentDate.getMonth();
    const paymentYear = payment.paymentDate.getFullYear();
    
    for (let i = 0; i < months.length; i++) {
      const month = months[i].date;
      if (month.getMonth() === paymentMonth && month.getFullYear() === paymentYear) {
        months[i].revenue += payment.amount;
        break;
      }
    }
  });
  
  return {
    labels: months.map(m => m.name),
    data: months.map(m => m.revenue)
  };
};

// @desc    Get household payment status
// @route   GET /api/statistics/payment-status
// @access  Private
exports.getPaymentStatus = async (req, res) => {
  try {
    // Get all active households
    const households = await Household.find({ active: true });
    
    // Get mandatory fees
    const mandatoryFees = await Fee.find({ 
      mandatory: true,
      active: true,
      dueDate: { $lte: new Date() }
    });
    
    // Get all payments
    const payments = await Payment.find({ 
      status: 'paid',
      fee: { $in: mandatoryFees.map(fee => fee._id) }
    });
    
    // Create payment status for each household
    const paymentStatus = [];
    
    for (const household of households) {
      const householdPayments = payments.filter(
        payment => payment.household.toString() === household._id.toString()
      );
      
      const paidFees = householdPayments.map(payment => payment.fee.toString());
      
      const unpaidFees = mandatoryFees.filter(
        fee => !paidFees.includes(fee._id.toString())
      );
      
      paymentStatus.push({
        household: {
          _id: household._id,
          apartmentNumber: household.apartmentNumber
        },
        status: unpaidFees.length === 0 ? 'Paid' : 'Unpaid',
        paidCount: paidFees.length,
        unpaidCount: unpaidFees.length,
        totalFees: mandatoryFees.length
      });
    }
    
    res.json(paymentStatus);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get monthly payment report
// @route   GET /api/statistics/monthly-report
// @access  Private
exports.getMonthlyReport = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    // Set date range for the report
    const startDate = new Date(year || new Date().getFullYear(), (month ? month - 1 : new Date().getMonth()), 1);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0); // Last day of the month
    endDate.setHours(23, 59, 59, 999);
    
    // Get payments for the specified month
    const payments = await Payment.find({
      paymentDate: { $gte: startDate, $lte: endDate },
      status: 'paid'
    })
      .populate('fee', 'name type amount')
      .populate('household', 'apartmentNumber')
      .sort({ paymentDate: 1 });
    
    // Calculate totals by fee type
    const totalsByType = {};
    payments.forEach(payment => {
      const type = payment.fee?.type || 'other';
      
      if (!totalsByType[type]) {
        totalsByType[type] = 0;
      }
      
      totalsByType[type] += payment.amount;
    });
    
    // Calculate total revenue
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Get payment count by day of month
    const paymentsByDay = {};
    payments.forEach(payment => {
      const day = payment.paymentDate.getDate();
      
      if (!paymentsByDay[day]) {
        paymentsByDay[day] = {
          count: 0,
          amount: 0
        };
      }
      
      paymentsByDay[day].count += 1;
      paymentsByDay[day].amount += payment.amount;
    });
    
    res.json({
      period: {
        year: startDate.getFullYear(),
        month: startDate.getMonth() + 1,
        startDate,
        endDate
      },
      summary: {
        totalRevenue,
        paymentCount: payments.length,
        totalsByType
      },
      paymentsByDay,
      payments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Hàm chuyển đổi tên loại phí sang tiếng Việt
const translateFeeType = (feeType) => {
  const translations = {
    'service': 'Dịch vụ',
    'maintenance': 'Bảo trì',
    'water': 'Nước',
    'electricity': 'Điện',
    'parking': 'Đỗ xe',
    'internet': 'Internet',
    'security': 'An ninh',
    'cleaning': 'Vệ sinh',
    'other': 'Khác'
  };
  
  return translations[feeType] || 'Khác';
};

// Hàm chuyển đổi tên phí thành dạng hiển thị ngắn gọn
const translateFeeName = (feeName) => {
  const feeTranslations = {
    'Phí quản lý hàng tháng': 'Quản lý',
    'Phí gửi xe ô tô': 'Gửi xe ô tô', 
    'Phí gửi xe máy': 'Gửi xe máy',
    'Phí sửa chữa công trình chung': 'Sửa chữa chung',
    'Phí bảo trì thang máy': 'Bảo trì thang máy',
    'Phí an ninh': 'An ninh',
    'Phí vệ sinh': 'Vệ sinh',
    'Phí điện': 'Điện',
    'Phí nước': 'Nước',
    'Phí internet': 'Internet',
    'Phí cable TV': 'Cable TV',
    'Phí dịch vụ chung cư': 'Dịch vụ chung cư',
    'Phí quản lý chung cư': 'Quản lý chung cư'
  };
  
  return feeTranslations[feeName] || feeName;
};

// Get total payment by month/year
const getTotalPaymentsByMonth = asyncHandler(async (req, res) => {
  const { year } = req.params;
  const currentYear = parseInt(year) || new Date().getFullYear();

  const result = await Payment.aggregate([
    {
      $match: {
        status: 'paid',
        paymentDate: {
          $gte: new Date(`${currentYear}-01-01`),
          $lte: new Date(`${currentYear}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$paymentDate' },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Fill in missing months with 0
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const found = result.find(r => r._id === month);
    return {
      month,
      total: found ? found.total : 0,
      count: found ? found.count : 0
    };
  });

  res.json(monthlyData);
});

// Get payment statistics by payment method
const getPaymentStatsByMethod = asyncHandler(async (req, res) => {
  const result = await Payment.aggregate([
    {
      $match: {
        status: 'paid'
      }
    },
    {
      $group: {
        _id: '$method',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  res.json(result);
});

// Get payment statistics by fee type
const getPaymentStatsByFeeType = asyncHandler(async (req, res) => {
  const result = await Payment.aggregate([
    {
      $match: {
        status: 'paid'
      }
    },
    {
      $lookup: {
        from: 'fees',
        localField: 'fee',
        foreignField: '_id',
        as: 'feeDetails'
      }
    },
    {
      $unwind: '$feeDetails'
    },
    {
      $group: {
        _id: '$feeDetails.feeType',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  res.json(result);
});

// Get payment statistics by month for dashboard
const getMonthlyPaymentStats = asyncHandler(async (req, res) => {
  const today = new Date();
  const lastSixMonths = new Date(today.getFullYear(), today.getMonth() - 5, 1);

  const result = await Payment.aggregate([
    {
      $match: {
        status: 'paid',
        paymentDate: { $gte: lastSixMonths }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$paymentDate' },
          month: { $month: '$paymentDate' }
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  // Transform result into usable format
  const monthlyStats = result.map(item => ({
    month: `${item._id.month}/${item._id.year}`,
    total: item.total,
    count: item.count
  }));

  res.json(monthlyStats);
});

// Get area-based fee statistics
const getAreaBasedFeeStats = asyncHandler(async (req, res) => {
  try {
    const areaBasedFeeService = require('../services/areaBasedFeeService');
    const statistics = await areaBasedFeeService.getAreaBasedFeeStatistics();
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error('Error getting area-based fee statistics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi khi lấy thống kê phí theo diện tích' 
    });
  }
});

module.exports = {
  getDashboardStats: exports.getDashboardStats,
  getPaymentStatus: exports.getPaymentStatus,
  getMonthlyReport: exports.getMonthlyReport,
  getTotalPaymentsByMonth,
  getPaymentStatsByMethod,
  getPaymentStatsByFeeType,
  getMonthlyPaymentStats,
  getAreaBasedFeeStats
}; 