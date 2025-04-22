const Payment = require('../models/paymentModel');
const Fee = require('../models/feeModel');
const Household = require('../models/householdModel');
const asyncHandler = require('express-async-handler');
const hygieneFeeService = require('../services/hygieneFeeService');

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
const getPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find()
    .populate('fee', 'name feeType amount')
    .populate('household', 'apartmentNumber')
    .sort({ paymentDate: -1 });
  
  res.json(payments);
});

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('fee', 'name feeType amount startDate endDate')
    .populate('household', 'apartmentNumber');
  
  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }
  
  res.json(payment);
});

// @desc    Create a payment
// @route   POST /api/payments
// @access  Private/Admin/Accountant
const createPayment = asyncHandler(async (req, res) => {
  const { 
    fee, 
    household, 
    amount,
    paymentDate,
    payerName,
    payerId,
    payerPhone,
    receiptNumber,
    note,
    period,
    status
  } = req.body;
  
  // Check if fee exists
  const feeExists = await Fee.findById(fee);
  if (!feeExists) {
    res.status(404);
    throw new Error('Fee not found');
  }
  
  // Check if household exists
  const householdExists = await Household.findById(household);
  if (!householdExists) {
    res.status(404);
    throw new Error('Household not found');
  }
  
  // Determine the period if not provided (default to current month)
  let paymentPeriod = period;
  if (!paymentPeriod) {
    const paymentDate = new Date();
    paymentPeriod = new Date(paymentDate.getFullYear(), paymentDate.getMonth(), 1);
  } else if (typeof paymentPeriod === 'string') {
    paymentPeriod = new Date(paymentPeriod);
  }
  
  // Check if payment already exists for this fee, household and period
  const paymentExists = await Payment.findOne({ 
    fee, 
    household,
    period: {
      $gte: new Date(paymentPeriod.getFullYear(), paymentPeriod.getMonth(), 1),
      $lt: new Date(paymentPeriod.getFullYear(), paymentPeriod.getMonth() + 1, 1)
    }
  });
  
  if (paymentExists) {
    res.status(400);
    throw new Error('A payment for this fee already exists for this household in the specified period');
  }
  
  const payment = await Payment.create({
    fee,
    household,
    amount: amount || feeExists.amount,
    paymentDate: paymentDate || Date.now(),
    payerName,
    payerId,
    payerPhone,
    receiptNumber,
    collector: req.user._id, // User who created the payment
    note,
    period: paymentPeriod,
    status: 'paid'
  });
  
  // Populate the new payment with fee and household details
  const populatedPayment = await Payment.findById(payment._id)
    .populate('fee', 'name feeType amount')
    .populate('household', 'apartmentNumber')
    .populate('collector', 'name');
  
  res.status(201).json(populatedPayment);
});

// @desc    Update a payment
// @route   PUT /api/payments/:id
// @access  Private/Admin/Accountant
const updatePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }

  const {
    amount,
    paymentDate,
    payerName,
    payerId,
    payerPhone,
    receiptNumber,
    method,
    note,
    status
  } = req.body;

  // Update payment fields
  payment.amount = amount || payment.amount;
  payment.paymentDate = paymentDate || payment.paymentDate;
  payment.payerName = payerName || payment.payerName;
  payment.payerId = payerId || payment.payerId;
  payment.payerPhone = payerPhone || payment.payerPhone;
  payment.receiptNumber = receiptNumber || payment.receiptNumber;
  payment.method = method || payment.method;
  payment.note = note || payment.note;
  payment.status = status || payment.status;

  const updatedPayment = await payment.save();

  // Populate the updated payment with fee and household details
  const populatedPayment = await Payment.findById(updatedPayment._id)
    .populate('fee', 'name feeType amount')
    .populate('household', 'apartmentNumber')
    .populate('collector', 'name');

  res.json(populatedPayment);
});

// @desc    Delete a payment
// @route   DELETE /api/payments/:id
// @access  Private/Admin
const deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }

  await Payment.findByIdAndDelete(req.params.id);

  res.json({ 
    message: 'Payment deleted successfully',
    deletedPayment: {
      id: payment._id,
      amount: payment.amount,
      paymentDate: payment.paymentDate
    }
  });
});

// @desc    Get payments by household
// @route   GET /api/payments/household/:id
// @access  Private
const getPaymentsByHousehold = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ household: req.params.id })
    .populate('fee', 'name amount dueDate')
    .populate('household', 'apartmentNumber');
  res.json(payments);
});

// @desc    Get payments by fee
// @route   GET /api/payments/fee/:id
// @access  Private
const getPaymentsByFee = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ fee: req.params.id })
    .populate('fee', 'name amount dueDate')
    .populate('household', 'apartmentNumber');
  res.json(payments);
});

// @desc    Search payments
// @route   GET /api/payments/search
// @access  Private
const searchPayments = asyncHandler(async (req, res) => {
  const {
    apartmentNumber,
    feeName,
    feeType,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    payerName,
    keyword
  } = req.query;

  // Build search conditions
  let searchConditions = {};
  let populateConditions = {};

  // Amount range
  if (minAmount || maxAmount) {
    searchConditions.amount = {};
    if (minAmount) searchConditions.amount.$gte = parseFloat(minAmount);
    if (maxAmount) searchConditions.amount.$lte = parseFloat(maxAmount);
  }

  // Date range
  if (startDate || endDate) {
    searchConditions.paymentDate = {};
    if (startDate) searchConditions.paymentDate.$gte = new Date(startDate);
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999); // End of day
      searchConditions.paymentDate.$lte = endDateTime;
    }
  }

  // Payer name
  if (payerName) {
    searchConditions.payerName = { $regex: payerName, $options: 'i' };
  }

  // Legacy keyword search
  if (keyword) {
    searchConditions.$or = [
      { status: { $regex: keyword, $options: 'i' } },
      { method: { $regex: keyword, $options: 'i' } },
      { payerName: { $regex: keyword, $options: 'i' } },
      { receiptNumber: { $regex: keyword, $options: 'i' } }
    ];
  }

  // Execute the query with population
  let query = Payment.find(searchConditions)
    .populate('household', 'apartmentNumber')
    .populate('fee', 'name feeType amount dueDate')
    .sort({ paymentDate: -1 });

  let payments = await query;

  if (apartmentNumber) {
    payments = payments.filter(payment => 
      payment.household?.apartmentNumber?.toLowerCase().includes(apartmentNumber.toLowerCase())
    );
  }

  if (feeName) {
    payments = payments.filter(payment => 
      payment.fee?.name?.toLowerCase().includes(feeName.toLowerCase())
    );
  }

  if (feeType) {
    payments = payments.filter(payment => 
      payment.fee?.feeType === feeType
    );
  }

  res.json(payments);
});

// @desc    Get fee payment status for a household
// @route   GET /api/payments/household/:id/fee-status
// @access  Private
const getHouseholdFeeStatus = asyncHandler(async (req, res) => {
  const householdId = req.params.id;
  
  // Kiểm tra nếu hộ gia đình tồn tại
  const household = await Household.findById(householdId);
  if (!household) {
    res.status(404);
    throw new Error('Không tìm thấy hộ gia đình');
  }
  
  // Import vehicle fee service and area-based fee service
  const vehicleFeeService = require('../services/vehicleFeeService');
  const areaBasedFeeService = require('../services/areaBasedFeeService');
  
  // Lấy các loại phí đang hoạt động (loại trừ tất cả phí xe, phí theo diện tích và phí vệ sinh)
  const activeFees = await Fee.find({ 
    active: true,
    feeCode: { $nin: ['PHI002', 'PHI003', 'PHI005', 'PHI006', 'PHI007', 'PHI008'] } // Loại trừ phí xe, phí theo diện tích và phí vệ sinh riêng lẻ
  });
  
  // Lấy tất cả các khoản thanh toán của hộ gia đình
  const householdPayments = await Payment.find({ household: householdId })
    .populate('fee', 'name feeType amount startDate endDate feeCode');
  
  // Lấy tháng hiện tại và tháng trước
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  
  // Kiểm tra quá hạn cho các khoản phí tháng trước
  const firstDayLastMonth = new Date(lastMonthYear, lastMonth, 1);
  const lastDayLastMonth = new Date(currentYear, currentMonth, 0);
  
  // Kiểm tra các khoản phí tháng hiện tại
  const firstDayCurrentMonth = new Date(currentYear, currentMonth, 1);
  const lastDayCurrentMonth = new Date(currentYear, currentMonth + 1, 0);
  
  // Kết quả sẽ chứa trạng thái cho từng loại phí
  const feeStatus = activeFees.map(fee => {
    // Tìm khoản thanh toán cho phí này trong tháng hiện tại (ưu tiên sử dụng period)
    const currentMonthPayment = householdPayments.find(payment => 
      payment.fee._id.toString() === fee._id.toString() && 
      ((payment.period && 
        payment.period >= firstDayCurrentMonth &&
        payment.period <= lastDayCurrentMonth) ||
       (!payment.period &&
        payment.paymentDate >= firstDayCurrentMonth &&
        payment.paymentDate <= lastDayCurrentMonth))
    );
    
    // Tìm khoản thanh toán cho phí này trong tháng trước (ưu tiên sử dụng period)
    const lastMonthPayment = householdPayments.find(payment => 
      payment.fee._id.toString() === fee._id.toString() && 
      ((payment.period && 
        payment.period >= firstDayLastMonth &&
        payment.period <= lastDayLastMonth) ||
       (!payment.period &&
        payment.paymentDate >= firstDayLastMonth &&
        payment.paymentDate <= lastDayLastMonth))
    );
    
    // Kiểm tra có khoản nào quá hạn không
    const isLastMonthOverdue = !lastMonthPayment && fee.startDate <= lastDayLastMonth;
    
    return {
      _id: fee._id,
      name: fee.name,
      feeType: fee.feeType,
      amount: fee.amount,
      currentMonthStatus: currentMonthPayment ? 'paid' : 'pending',
      lastMonthStatus: lastMonthPayment ? 'paid' : (isLastMonthOverdue ? 'overdue' : 'not_applicable'),
      currentMonthPayment: currentMonthPayment || null,
      lastMonthPayment: lastMonthPayment || null
    };
  });
  
  // Tính phí xe cho hộ gia đình này
  try {
    const vehicleFeeCalculation = await vehicleFeeService.calculateVehicleFeeForHousehold(householdId);
    
    // Chỉ hiển thị phí xe nếu hộ gia đình có xe và tổng phí > 0
    if (vehicleFeeCalculation.totalAmount > 0 && vehicleFeeCalculation.totalVehicles > 0) {
      // Tìm các khoản thanh toán phí xe trong tháng hiện tại và tháng trước
      const vehiclePayments = householdPayments.filter(payment => 
        payment.fee.feeCode && ['PHI002', 'PHI003', 'PHI005'].includes(payment.fee.feeCode)
      );
      
      const currentMonthVehiclePayments = vehiclePayments.filter(payment => 
        (payment.period && 
         payment.period >= firstDayCurrentMonth &&
         payment.period <= lastDayCurrentMonth) ||
        (!payment.period &&
         payment.paymentDate >= firstDayCurrentMonth &&
         payment.paymentDate <= lastDayCurrentMonth)
      );
      
      const lastMonthVehiclePayments = vehiclePayments.filter(payment => 
        (payment.period && 
         payment.period >= firstDayLastMonth &&
         payment.period <= lastDayLastMonth) ||
        (!payment.period &&
         payment.paymentDate >= firstDayLastMonth &&
         payment.paymentDate <= lastDayLastMonth)
      );
      
      // Tính tổng số tiền đã thanh toán và kiểm tra tính hợp lệ
      const currentMonthVehiclePaid = currentMonthVehiclePayments.reduce((sum, p) => sum + p.amount, 0);
      const lastMonthVehiclePaid = lastMonthVehiclePayments.reduce((sum, p) => sum + p.amount, 0);

      // Kiểm tra xem có payment nào trong tháng không và số tiền có đủ không
      const isCurrentMonthPaymentValid = currentMonthVehiclePayments.length > 0 && 
        currentMonthVehiclePaid >= vehicleFeeCalculation.totalAmount;

      const isLastMonthPaymentValid = lastMonthVehiclePayments.length > 0 && 
        lastMonthVehiclePaid >= vehicleFeeCalculation.totalAmount;


      
      // Xác định trạng thái tháng trước
      let lastMonthStatus = 'not_applicable';
      
      if (vehicleFeeCalculation.totalAmount > 0) {
        if (isLastMonthPaymentValid) {
          lastMonthStatus = 'paid';
        } else {
          lastMonthStatus = 'overdue'; // Nếu có xe nhưng chưa trả đúng phí
        }
      }
       
       // Tìm fee "Phí gửi xe khác" để làm đại diện cho phí xe gộp chung
       const vehicleFeeRepresentative = await Fee.findOne({ feeCode: 'PHI005', active: true });
       
       // Thêm mục phí xe gộp chung với ID đặc biệt
       feeStatus.push({
         _id: 'vehicle-fee-combined', // Sử dụng ID đặc biệt thay vì ID của PHI005
         name: 'Phí gửi xe',
         feeType: 'vehicle',
         amount: vehicleFeeCalculation.totalAmount,
         currentMonthStatus: isCurrentMonthPaymentValid ? 'paid' : 'pending',
         lastMonthStatus: lastMonthStatus,
         currentMonthPayment: currentMonthVehiclePayments.length > 0 ? currentMonthVehiclePayments[0] : null,
         lastMonthPayment: lastMonthVehiclePayments.length > 0 ? lastMonthVehiclePayments[0] : null,
         vehicleDetails: vehicleFeeCalculation.feeDetails, // Chi tiết xe để hiển thị
         isVehicleFee: true // Flag để frontend nhận biết đây là phí xe gộp chung
       });
    }
  } catch (error) {
    console.error('Error calculating vehicle fee:', error);
    // Không làm gì nếu có lỗi, chỉ bỏ qua phí xe
  }
  
  // Tính phí theo diện tích cho hộ gia đình này
  try {
    const areaFeeCalculation = await areaBasedFeeService.calculateAreaBasedFeeForHousehold(householdId);
    
    // Chỉ hiển thị phí theo diện tích nếu hộ gia đình có diện tích và tổng phí > 0
    if (areaFeeCalculation.totalAmount > 0 && areaFeeCalculation.area > 0) {
      // Tìm các khoản thanh toán phí theo diện tích trong tháng hiện tại và tháng trước
      const areaFeePayments = householdPayments.filter(payment => 
        payment.fee.feeCode && ['PHI006', 'PHI007'].includes(payment.fee.feeCode)
      );
      
      const currentMonthAreaPayments = areaFeePayments.filter(payment => 
        (payment.period && 
         payment.period >= firstDayCurrentMonth &&
         payment.period <= lastDayCurrentMonth) ||
        (!payment.period &&
         payment.paymentDate >= firstDayCurrentMonth &&
         payment.paymentDate <= lastDayCurrentMonth)
      );
      
      const lastMonthAreaPayments = areaFeePayments.filter(payment => 
        (payment.period && 
         payment.period >= firstDayLastMonth &&
         payment.period <= lastDayLastMonth) ||
        (!payment.period &&
         payment.paymentDate >= firstDayLastMonth &&
         payment.paymentDate <= lastDayLastMonth)
      );
      
      // Tính tổng số tiền đã thanh toán và kiểm tra tính hợp lệ
      const currentMonthAreaPaid = currentMonthAreaPayments.reduce((sum, p) => sum + p.amount, 0);
      const lastMonthAreaPaid = lastMonthAreaPayments.reduce((sum, p) => sum + p.amount, 0);

      // Kiểm tra xem có payment nào trong tháng không và số tiền có đủ không
      const isCurrentMonthAreaPaymentValid = currentMonthAreaPayments.length > 0 && 
        currentMonthAreaPaid >= areaFeeCalculation.totalAmount;

      const isLastMonthAreaPaymentValid = lastMonthAreaPayments.length > 0 && 
        lastMonthAreaPaid >= areaFeeCalculation.totalAmount;

      // Xác định trạng thái tháng trước
      let lastMonthAreaStatus = 'not_applicable';
      
      if (areaFeeCalculation.totalAmount > 0) {
        if (isLastMonthAreaPaymentValid) {
          lastMonthAreaStatus = 'paid';
        } else {
          lastMonthAreaStatus = 'overdue'; // Nếu có diện tích nhưng chưa trả đúng phí
        }
      }
       
       // Thêm mục phí theo diện tích gộp chung với ID đặc biệt
       feeStatus.push({
         _id: 'area-fee-combined', // Sử dụng ID đặc biệt
         name: 'Phí dịch vụ & quản lý chung cư',
         feeType: 'area-based',
         amount: areaFeeCalculation.totalAmount,
         currentMonthStatus: isCurrentMonthAreaPaymentValid ? 'paid' : 'pending',
         lastMonthStatus: lastMonthAreaStatus,
         currentMonthPayment: currentMonthAreaPayments.length > 0 ? currentMonthAreaPayments[0] : null,
         lastMonthPayment: lastMonthAreaPayments.length > 0 ? lastMonthAreaPayments[0] : null,
         areaDetails: areaFeeCalculation.feeDetails, // Chi tiết phí theo diện tích để hiển thị
         area: areaFeeCalculation.area,
         isAreaFee: true // Flag để frontend nhận biết đây là phí theo diện tích gộp chung
       });
    }
  } catch (error) {
    console.error('Error calculating area-based fee:', error);
    // Không làm gì nếu có lỗi, chỉ bỏ qua phí theo diện tích
  }
  
  // Tính phí vệ sinh cho hộ gia đình này (thu 1 lần/năm)
  try {
    const hygieneFeeCalculation = await hygieneFeeService.calculateHygieneFeeForHousehold(householdId);
    
    // Chỉ hiển thị phí vệ sinh nếu hộ gia đình có cư dân hoạt động
    if (hygieneFeeCalculation.totalAmount > 0 && hygieneFeeCalculation.residentCount > 0) {
      // Lấy fee phí vệ sinh
      const hygieneFee = await Fee.findOne({
        feeCode: hygieneFeeService.HYGIENE_FEE_INFO.feeCode,
        active: true
      });
      
      if (hygieneFee) {
        // Tính năm hiện tại để kiểm tra thanh toán
        const currentYear = new Date().getFullYear();
        const currentYearStart = new Date(currentYear, 0, 1);
        const currentYearEnd = new Date(currentYear + 1, 0, 1);
        
        // Tìm thanh toán phí vệ sinh cho năm hiện tại
        const currentYearHygienePayment = householdPayments.find(payment => 
          payment.fee._id.toString() === hygieneFee._id.toString() && 
          payment.period &&
          payment.period >= currentYearStart &&
          payment.period < currentYearEnd
        );
        
        // Tìm thanh toán phí vệ sinh cho năm trước
        const lastYearStart = new Date(currentYear - 1, 0, 1);
        const lastYearEnd = new Date(currentYear, 0, 1);
        const lastYearHygienePayment = householdPayments.find(payment => 
          payment.fee._id.toString() === hygieneFee._id.toString() && 
          payment.period &&
          payment.period >= lastYearStart &&
          payment.period < lastYearEnd
        );
        
        // Xác định trạng thái thanh toán
        const currentYearStatus = currentYearHygienePayment ? 'paid' : 'pending';
        const lastYearStatus = lastYearHygienePayment ? 'paid' : 'overdue';
        
        // Thêm phí vệ sinh vào danh sách
        feeStatus.push({
          _id: 'hygiene-fee-combined', // ID đặc biệt cho phí vệ sinh
          name: 'Phí vệ sinh',
          feeType: 'hygiene',
          amount: hygieneFeeCalculation.totalAmount,
          currentMonthStatus: currentYearStatus, // Sử dụng year thay vì month
          lastMonthStatus: lastYearStatus, // Năm trước
          currentMonthPayment: currentYearHygienePayment || null,
          lastMonthPayment: lastYearHygienePayment || null,
          hygieneDetails: hygieneFeeCalculation.feeDetails, // Chi tiết phí vệ sinh
          residentCount: hygieneFeeCalculation.residentCount,
          residents: hygieneFeeCalculation.residents,
          isHygieneFee: true, // Flag để frontend nhận biết đây là phí vệ sinh
          paymentCycle: 'yearly' // Thêm thông tin chu kỳ thanh toán
        });
      }
    }
  } catch (error) {
    console.error('Error calculating hygiene fee:', error);
    // Không làm gì nếu có lỗi, chỉ bỏ qua phí vệ sinh
  }
  
  res.json({
    household: {
      _id: household._id,
      apartmentNumber: household.apartmentNumber,
    },
    feeStatus
  });
});

module.exports = {
  getPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentsByHousehold,
  getPaymentsByFee,
  searchPayments,
  getHouseholdFeeStatus
}; 