import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Form, Button, Row, Col, Card } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Message from '../components/common/Message';
import Loader from '../components/common/Loader';
import FormContainer from '../components/common/FormContainer';
import AuthContext from '../context/AuthContext';
import axios from 'axios';

const PaymentCreateScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Lấy query params từ URL
  const searchParams = new URLSearchParams(location.search);
  const householdParam = searchParams.get('household');
  const feeParam = searchParams.get('fee');
  const isDebtPayment = searchParams.get('isDebt') === 'true';
  
  const [households, setHouseholds] = useState([]);
  const [fees, setFees] = useState([]);
  
  // Form fields
  const [householdId, setHouseholdId] = useState(householdParam || '');
  const [feeId, setFeeId] = useState(feeParam || '');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [payerName, setPayerName] = useState('');
  const [payerId, setPayerId] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [note, setNote] = useState('');
  
  // Period field for debt payments
  const [period, setPeriod] = useState('');
  
  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  const { userInfo } = useContext(AuthContext);
  
  const fetchHouseholdHead = useCallback(async () => {
    try {
      if (!householdId || !userInfo) return;
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const { data } = await axios.get(`/api/households/${householdId}/residents`, config);
      
      // Tìm chủ hộ hoặc người đầu tiên trong danh sách
      const householdHead = data.find(resident => resident.isHouseholdHead) || data[0];
      
      if (householdHead) {
        setPayerName(householdHead.fullName || '');
        setPayerId(householdHead.idCard || '');
        setPayerPhone(householdHead.phone || '');
      }
    } catch (error) {
      console.error('Lỗi khi tải thông tin chủ hộ:', error);
    }
  }, [householdId, userInfo]);
  
  const fetchHouseholds = useCallback(async () => {
    try {
      if (!userInfo) return;
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const { data } = await axios.get('/api/households', config);
      setHouseholds(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách hộ gia đình:', error);
    }
  }, [userInfo]);
  
  const fetchFees = useCallback(async () => {
    try {
      if (!userInfo) return;
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const { data } = await axios.get('/api/fees', config);
      setFees(data.filter(fee => fee.active));
    } catch (error) {
      console.error('Lỗi khi tải danh sách phí:', error);
    }
  }, [userInfo]);
  
  // Tải danh sách hộ dân và phí khi component mount
  useEffect(() => {
    fetchHouseholds();
    fetchFees();
  }, [userInfo, fetchHouseholds, fetchFees]);
  
  // Khi feeId thay đổi, cập nhật số tiền
  useEffect(() => {
    if (feeId && householdId) {
      const fee = fees.find(f => f._id === feeId);
      if (fee) {
        // Kiểm tra nếu là phí xe (PHI005) thì tính phí xe tự động
        if (fee.feeCode === 'PHI005') {
          fetchVehicleFeeForHousehold();
        } else {
          setAmount(fee.amount);
        }
      }
    } else if (feeId) {
      const fee = fees.find(f => f._id === feeId);
      if (fee) {
        setAmount(fee.amount);
      }
    }
  }, [feeId, fees, householdId]);

  // Fetch vehicle fee cho household khi chọn PHI005
  const fetchVehicleFeeForHousehold = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const response = await axios.get(`/api/vehicle-fees/calculate/${householdId}`, config);
      
      if (response.data.data.totalAmount > 0) {
        setAmount(response.data.data.totalAmount);
        
        // Tạo note chi tiết về xe
        const vehicleDetails = response.data.data.feeDetails.map(detail => 
          `${detail.count} ${detail.vehicleType}: ${detail.amount.toLocaleString('vi-VN')} VND`
        ).join(', ');
        
        setNote(`Phí gửi xe: ${vehicleDetails}`);
      } else {
        setAmount(0);
        setNote('Hộ gia đình này không có phương tiện nào');
      }
    } catch (error) {
      console.error('Error fetching vehicle fee:', error);
      // Fallback to default fee amount
      const fee = fees.find(f => f._id === feeId);
      if (fee) {
        setAmount(fee.amount);
      }
    }
  };
  
  // Nếu đã chọn hộ dân và có thông tin về chủ hộ, điền thông tin người thanh toán
  useEffect(() => {
    if (householdId) {
      fetchHouseholdHead();
    }
  }, [householdId, fetchHouseholdHead]);
  
  // Set default period for debt payment
  useEffect(() => {
    if (isDebtPayment) {
      // Set to previous month by default
      const today = new Date();
      const lastMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
      const lastMonthYear = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear();
      const lastMonthDate = new Date(lastMonthYear, lastMonth, 1);
      setPeriod(lastMonthDate.toISOString().split('T')[0]);
      
      // Set default note for debt payment
      setNote('Thanh toán nợ tháng trước');
    } else {
      // Set to current month for regular payments
      const today = new Date();
      const currentMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
      setPeriod(currentMonthDate.toISOString().split('T')[0]);
    }
  }, [isDebtPayment]);
  
  const validateForm = () => {
    const errors = {};
    
    if (!householdId) errors.householdId = 'Hộ gia đình là bắt buộc';
    if (!feeId) errors.feeId = 'Loại phí là bắt buộc';
    if (!amount || amount <= 0) errors.amount = 'Số tiền phải lớn hơn 0';
    if (!paymentDate) errors.paymentDate = 'Ngày thanh toán là bắt buộc';
    if (!period) errors.period = 'Kỳ thanh toán là bắt buộc';
    
    setValidationErrors(errors);
    
    return Object.keys(errors).length === 0;
  };
  
  const submitHandler = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccess(false);
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      // Ensure period is a proper date string
      let periodDate = period;
      if (period && period.length === 7) {
        // If only month and year are provided (YYYY-MM format)
        periodDate = `${period}-01`; // Add day to make it a valid date
      }
      
      const paymentData = {
        household: householdId,
        fee: feeId,
        amount: parseFloat(amount),
        paymentDate,
        payerName,
        payerId,
        payerPhone,
        receiptNumber,
        note,
        period: periodDate,
        method: 'cash', // Default payment method
        status: 'paid' // Ensure status is always 'paid' after successful payment
      };
      
      console.log('Tạo thanh toán với dữ liệu:', paymentData);
      
      const response = await axios.post('/api/payments', paymentData, config);
      
      // Verify that the payment was created with 'paid' status
      if (response.data && response.data.status === 'paid') {
        console.log('✅ Thanh toán đã được tạo thành công với status: paid');
        setSuccess(true);
        
        // Reset form for next payment if needed
        if (!isDebtPayment) {
          setAmount('');
          setPayerName('');
          setPayerId('');
          setPayerPhone('');
          setNote('');
        }
        
        setTimeout(() => {
          navigate('/payments', { 
            state: { 
              message: 'Thanh toán đã được tạo thành công và đã được đánh dấu là đã thanh toán!' 
            }
          });
        }, 1500);
      } else {
        throw new Error('Payment status not confirmed as paid');
      }
      
    } catch (error) {
      console.error('❌ Lỗi tạo thanh toán:', error);
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể tạo thanh toán. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Generate unique receipt number
  useEffect(() => {
    const generateReceiptNumber = () => {
      const date = new Date();
      const year = date.getFullYear().toString().substr(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      
      return `PM${year}${month}${day}${random}`;
    };
    
    setReceiptNumber(generateReceiptNumber());
  }, []);
  
  return (
    <>
      <Link to='/payments' className='btn btn-light my-3'>
        <i className="fas fa-arrow-left"></i> Quay lại Thanh Toán
      </Link>
      
      <Card className="shadow-lg border-success mb-4">
        <Card.Header className="bg-success text-white d-flex align-items-center">
          <i className="fas fa-money-check-alt fa-lg me-2"></i>
          <h1 className="mb-0" style={{ fontSize: '1.5rem' }}>Tạo Thanh Toán Mới</h1>
        </Card.Header>
        <Card.Body>
          {error && <Message variant='danger'>{error}</Message>}
          {success && (
            <Message variant='success'>
              <i className="fas fa-check-circle me-2"></i>
              Thanh toán đã được tạo thành công và đã được đánh dấu là <strong>ĐÃ THANH TOÁN</strong>!
            </Message>
          )}
          {loading && <Loader />}
          <Form onSubmit={submitHandler} className="p-2">
            <Form.Group controlId='household' className='mb-3'>
              <Form.Label><i className="fas fa-home me-1 text-primary"></i> Hộ Gia Đình</Form.Label>
              <Form.Select
                value={householdId}
                onChange={(e) => setHouseholdId(e.target.value)}
                isInvalid={!!validationErrors.householdId}
                required
              >
                <option value="">Chọn Hộ Gia Đình</option>
                {households.map((household) => (
                  <option key={household._id} value={household._id}>
                    {household.apartmentNumber}
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type='invalid'>
                {validationErrors.householdId}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId='fee' className='mb-3'>
              <Form.Label><i className="fas fa-coins me-1 text-warning"></i> Loại Phí</Form.Label>
              <Form.Select
                value={feeId}
                onChange={(e) => setFeeId(e.target.value)}
                isInvalid={!!validationErrors.feeId}
                required
              >
                <option value="">Chọn Loại Phí</option>
                {fees.map((fee) => (
                  <option key={fee._id} value={fee._id}>
                    {fee.name} ({fee.amount.toLocaleString()} VND)
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type='invalid'>
                {validationErrors.feeId}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId='amount' className='mb-3'>
              <Form.Label><i className="fas fa-money-bill-wave me-1 text-success"></i> Số Tiền</Form.Label>
              <Form.Control
                type='number'
                placeholder='Nhập số tiền thanh toán...'
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                isInvalid={!!validationErrors.amount}
                required
                min="0"
                step="0.01"
              />
              <Form.Control.Feedback type='invalid'>
                {validationErrors.amount}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId='paymentDate' className='mb-3'>
              <Form.Label><i className="fas fa-calendar-day me-1 text-info"></i> Ngày Thanh Toán</Form.Label>
              <Form.Control
                type='date'
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                isInvalid={!!validationErrors.paymentDate}
                required
              />
              <Form.Control.Feedback type='invalid'>
                {validationErrors.paymentDate}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId='period' className='mb-3'>
              <Form.Label><i className="fas fa-calendar-alt me-1 text-secondary"></i> {isDebtPayment ? 'Kỳ Thanh Toán (Nợ)' : 'Kỳ Thanh Toán'}</Form.Label>
              <Form.Control
                type='month'
                value={period.substring(0, 7)}
                onChange={(e) => setPeriod(e.target.value)}
                isInvalid={!!validationErrors.period}
                required
              />
              <Form.Text className="text-muted">
                {isDebtPayment ? 'Chọn tháng cần thanh toán nợ' : 'Chọn tháng áp dụng khoản thanh toán này'}
              </Form.Text>
              <Form.Control.Feedback type='invalid'>
                {validationErrors.period}
              </Form.Control.Feedback>
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group controlId='payerName' className='mb-3'>
                  <Form.Label><i className="fas fa-user me-1 text-primary"></i> Tên Người Thanh Toán</Form.Label>
                  <Form.Control
                    type='text'
                    placeholder='Nhập tên người thanh toán...'
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId='payerPhone' className='mb-3'>
                  <Form.Label><i className="fas fa-phone me-1 text-success"></i> Số Điện Thoại</Form.Label>
                  <Form.Control
                    type='text'
                    placeholder='Nhập số điện thoại...'
                    value={payerPhone}
                    onChange={(e) => setPayerPhone(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group controlId='payerId' className='mb-3'>
              <Form.Label><i className="fas fa-id-card me-1 text-info"></i> CMND/CCCD</Form.Label>
              <Form.Control
                type='text'
                placeholder='Nhập CMND/CCCD...'
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId='receiptNumber' className='mb-3'>
              <Form.Label><i className="fas fa-receipt me-1 text-warning"></i> Mã Biên Lai</Form.Label>
              <Form.Control
                type='text'
                placeholder='Nhập mã biên lai hoặc để tự động...'
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
              />
              <Form.Text className="text-muted">
                Tự động tạo, nhưng có thể thay đổi
              </Form.Text>
            </Form.Group>
            <Form.Group controlId='note' className='mb-3'>
              <Form.Label><i className="fas fa-sticky-note me-1 text-secondary"></i> Ghi Chú</Form.Label>
              <Form.Control
                as='textarea'
                rows={3}
                placeholder='Thêm ghi chú cho thanh toán (không bắt buộc)'
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Form.Group>
            
            {/* Payment Status Info */}
            <div className="alert alert-info d-flex align-items-center" role="alert">
              <i className="fas fa-info-circle me-2"></i>
              <div>
                <strong>Trạng thái thanh toán:</strong> Sau khi tạo, thanh toán sẽ được tự động đánh dấu là <span className="badge bg-success">ĐÃ THANH TOÁN</span>
              </div>
            </div>
            
            <Button type='submit' variant='success' className='mt-3 w-100 shadow-sm' size="lg" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <i className="fas fa-plus-circle me-2"></i> Tạo Thanh Toán
                </>
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </>
  );
};

export default PaymentCreateScreen; 