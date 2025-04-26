import React, { useState, useEffect, useContext } from 'react';
import { Form, Button, Row, Col, Card } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Message from '../components/common/Message';
import Loader from '../components/common/Loader';
import FormContainer from '../components/common/FormContainer';
import AuthContext from '../context/AuthContext';
import axios from 'axios';

const FeeEditScreen = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  
  // Basic form states
  const [feeCode, setFeeCode] = useState('');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [feeType, setFeeType] = useState('mandatory');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [active, setActive] = useState(true);
  
  // Enhanced form states
  const [category, setCategory] = useState('service');
  const [priority, setPriority] = useState('medium');
  const [paymentMethod, setPaymentMethod] = useState('monthly');
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [lateFee, setLateFee] = useState(0);
  const [gracePeriod, setGracePeriod] = useState(7);
  const [autoCalculate, setAutoCalculate] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [notifyResidents, setNotifyResidents] = useState(true);
  const [emailTemplate, setEmailTemplate] = useState('');
  const [smsTemplate, setSmsTemplate] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [calculating, setCalculating] = useState(false);
  
  // Analytics and tracking states
  const [feeHistory, setFeeHistory] = useState([]);
  const [usageStats, setUsageStats] = useState({
    totalHouseholds: 0,
    appliedTo: 0,
    totalRevenue: 0,
    averageAmount: 0,
    paymentRate: 0
  });
  const [relatedFees, setRelatedFees] = useState([]);
  const [duplicateWarning, setDuplicateWarning] = useState('');
  
  // Export and import states
  const [exportFormat, setExportFormat] = useState('excel');
  const [importData, setImportData] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [autoSave, setAutoSave] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext);
  
  useEffect(() => {
    if (isEditMode) {
      fetchFeeDetails();
      fetchFeeHistory();
      fetchUsageStats();
      fetchRelatedFees();
    } else {
      checkForDuplicates();
    }
    loadUserPreferences();
  }, [id]);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && isDirty && isEditMode) {
      const timeoutId = setTimeout(() => {
        autoSaveForm();
      }, 5000); // Auto-save after 5 seconds of inactivity
      
      return () => clearTimeout(timeoutId);
    }
  }, [isDirty, autoSave, isEditMode, feeCode, name, amount, description]);

  // Real-time calculation
  useEffect(() => {
    if (autoCalculate && amount && discountPercentage >= 0) {
      calculateFinalAmount();
    }
  }, [amount, discountPercentage, autoCalculate]);

  // Form change tracking
  useEffect(() => {
    setIsDirty(true);
  }, [feeCode, name, amount, feeType, description, category, priority]);
  
  const fetchFeeDetails = async () => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const { data } = await axios.get(`/api/fees/${id}`, config);
      
      setFeeCode(data.feeCode);
      setName(data.name);
      setAmount(data.amount || '');
      setFeeType(data.feeType || 'mandatory');
      setDescription(data.description || '');
      
      // Enhanced fields
      setCategory(data.category || 'service');
      setPriority(data.priority || 'medium');
      setPaymentMethod(data.paymentMethod || 'monthly');
      setDiscountPercentage(data.discountPercentage || 0);
      setLateFee(data.lateFee || 0);
      setGracePeriod(data.gracePeriod || 7);
      setAutoCalculate(data.autoCalculate || false);
      setRequireApproval(data.requireApproval || false);
      setNotifyResidents(data.notifyResidents !== false);
      setEmailTemplate(data.emailTemplate || '');
      setSmsTemplate(data.smsTemplate || '');
      
      if (data.startDate) {
        const startDateObj = new Date(data.startDate);
        setStartDate(startDateObj.toISOString().split('T')[0]);
      }
      
      if (data.endDate) {
        const endDateObj = new Date(data.endDate);
        setEndDate(endDateObj.toISOString().split('T')[0]);
      }
      
      setActive(data.active);
      setIsDirty(false);
      setLastSaved(new Date());
      
      setLoading(false);
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể tải thông tin phí'
      );
      setLoading(false);
    }
  };

  // Fetch fee history for analysis
  const fetchFeeHistory = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const { data } = await axios.get(`/api/fees/${id}/history`, config);
      setFeeHistory(data || []);
    } catch (error) {
      console.error('Failed to fetch fee history:', error);
    }
  };

  // Fetch usage statistics
  const fetchUsageStats = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const { data } = await axios.get(`/api/fees/${id}/stats`, config);
      setUsageStats(data || {
        totalHouseholds: 0,
        appliedTo: 0,
        totalRevenue: 0,
        averageAmount: 0,
        paymentRate: 0
      });
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
    }
  };

  // Fetch related fees
  const fetchRelatedFees = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const { data } = await axios.get(`/api/fees/related?type=${feeType}&category=${category}`, config);
      setRelatedFees(data || []);
    } catch (error) {
      console.error('Failed to fetch related fees:', error);
    }
  };

  // Check for duplicate fee codes
  const checkForDuplicates = async () => {
    if (!feeCode) return;
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const { data } = await axios.get(`/api/fees/check-duplicate?code=${feeCode}`, config);
      if (data.exists) {
        setDuplicateWarning(`Mã phí "${feeCode}" đã tồn tại. Vui lòng chọn mã khác.`);
      } else {
        setDuplicateWarning('');
      }
    } catch (error) {
      console.error('Failed to check duplicates:', error);
    }
  };

  // Load user preferences
  const loadUserPreferences = () => {
    const savedPrefs = localStorage.getItem('feeEditPreferences');
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      setAutoSave(prefs.autoSave !== false);
      setShowAdvanced(prefs.showAdvanced || false);
      setNotifyResidents(prefs.notifyResidents !== false);
    }
  };

  // Save user preferences
  const saveUserPreferences = () => {
    const prefs = {
      autoSave,
      showAdvanced,
      notifyResidents
    };
    localStorage.setItem('feeEditPreferences', JSON.stringify(prefs));
  };

  // Auto-save form data
  const autoSaveForm = async () => {
    if (!isEditMode) return;
    
    try {
      setCalculating(true);
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const draftData = {
        feeCode,
        name,
        amount: parseFloat(amount) || 0,
        feeType,
        description,
        category,
        priority,
        paymentMethod,
        discountPercentage: parseFloat(discountPercentage) || 0,
        lateFee: parseFloat(lateFee) || 0,
        gracePeriod: parseInt(gracePeriod) || 7,
        autoCalculate,
        requireApproval,
        notifyResidents,
        emailTemplate,
        smsTemplate,
        startDate: startDate || null,
        endDate: endDate || null,
        active,
        isDraft: true
      };
      
      await axios.put(`/api/fees/${id}/draft`, draftData, config);
      setLastSaved(new Date());
      setIsDirty(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setCalculating(false);
    }
  };

  // Calculate final amount with discounts
  const calculateFinalAmount = () => {
    const baseAmount = parseFloat(amount) || 0;
    const discount = parseFloat(discountPercentage) || 0;
    const finalAmount = baseAmount - (baseAmount * discount / 100);
    return finalAmount;
  };

  // Format currency for display
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value || 0);
  };

  // Export fee data
  const handleExportFee = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
        responseType: 'blob'
      };
      
      const { data } = await axios.get(`/api/fees/${id}/export?format=${exportFormat}`, config);
      
      const blob = new Blob([data], {
        type: exportFormat === 'excel' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fee_${feeCode}_${new Date().toISOString().split('T')[0]}.${exportFormat === 'excel' ? 'xlsx' : 'csv'}`;
      link.click();
      
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Không thể xuất dữ liệu phí');
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Basic validation
    if (!feeCode) errors.feeCode = 'Mã phí là bắt buộc';
    if (!name) errors.name = 'Tên phí là bắt buộc';
    if (!amount || amount <= 0) errors.amount = 'Số tiền phải lớn hơn 0';
    
    // Enhanced validation
    if (duplicateWarning) errors.feeCode = duplicateWarning;
    if (discountPercentage < 0 || discountPercentage > 100) {
      errors.discountPercentage = 'Phần trăm giảm giá phải từ 0 đến 100';
    }
    if (lateFee < 0) errors.lateFee = 'Phí phạt muộn không thể âm';
    if (gracePeriod < 0) errors.gracePeriod = 'Thời gian gia hạn không thể âm';
    
    // Date validation
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errors.endDate = 'Ngày kết thúc phải sau ngày bắt đầu';
    }
    
    // Template validation
    if (notifyResidents) {
      if (!emailTemplate && !smsTemplate) {
        errors.emailTemplate = 'Ít nhất một template thông báo là bắt buộc';
      }
    }
    
    // Business logic validation
    if (requireApproval && feeType === 'optional') {
      errors.requireApproval = 'Phí tùy chọn không cần phê duyệt';
    }
    
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
      
      const feeData = {
        feeCode,
        name,
        amount: parseFloat(amount),
        feeType,
        description,
        startDate: startDate || null,
        endDate: endDate || null,
        active,
        
        // Enhanced fields
        category,
        priority,
        paymentMethod,
        discountPercentage: parseFloat(discountPercentage) || 0,
        lateFee: parseFloat(lateFee) || 0,
        gracePeriod: parseInt(gracePeriod) || 7,
        autoCalculate,
        requireApproval,
        notifyResidents,
        emailTemplate,
        smsTemplate,
        
        // Calculated fields
        finalAmount: calculateFinalAmount(),
        
        // Metadata
        lastModifiedBy: userInfo.name,
        lastModifiedAt: new Date().toISOString(),
        isDraft: false
      };

      // Save user preferences
      saveUserPreferences();
      
      if (isEditMode) {
        await axios.put(`/api/fees/${id}`, feeData, config);
      } else {
        await axios.post('/api/fees', feeData, config);
      }
      
      setSuccess(true);
      setIsDirty(false);
      setLastSaved(new Date());
      
      // Log activity
      const activityLog = {
        action: isEditMode ? 'UPDATE_FEE' : 'CREATE_FEE',
        feeId: isEditMode ? id : 'new',
        feeName: name,
        amount: parseFloat(amount),
        user: userInfo.name,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('feeActivity', JSON.stringify([
        activityLog,
        ...JSON.parse(localStorage.getItem('feeActivity') || '[]').slice(0, 49)
      ]));
      
      setTimeout(() => {
        navigate('/fees');
      }, 1500);
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : `Không thể ${isEditMode ? 'cập nhật' : 'tạo'} phí`;
      
      setError(errorMessage);
      
      // Log error
      console.error('Fee submission error:', {
        action: isEditMode ? 'UPDATE_FEE' : 'CREATE_FEE',
        feeCode,
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle field changes with validation
  const handleFieldChange = (field, value) => {
    switch (field) {
      case 'feeCode':
        setFeeCode(value);
        if (value) checkForDuplicates();
        break;
      case 'name':
        setName(value);
        break;
      case 'amount':
        setAmount(value);
        break;
      case 'discountPercentage':
        setDiscountPercentage(Math.min(100, Math.max(0, value)));
        break;
      case 'lateFee':
        setLateFee(Math.max(0, value));
        break;
      case 'gracePeriod':
        setGracePeriod(Math.max(0, value));
        break;
      default:
        break;
    }
    setIsDirty(true);
  };
  
  return (
    <>
      <Link to='/fees' className='btn btn-light my-3'>
        <i className="fas fa-arrow-left"></i> Quay lại Phí
      </Link>
      
      {/* Analytics Dashboard for Edit Mode */}
      {isEditMode && usageStats.totalHouseholds > 0 && (
        <Card className="shadow-lg border-info mb-4">
          <Card.Header className="bg-info text-white">
            <Row className="align-items-center">
              <Col>
                <h5 className="mb-0">
                  <i className="fas fa-chart-bar me-2"></i>
                  Thống Kê Sử Dụng Phí
                </h5>
              </Col>
              <Col xs="auto">
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={handleExportFee}
                  disabled={loading}
                >
                  <i className="fas fa-download me-1"></i>
                  Xuất dữ liệu
                </Button>
              </Col>
            </Row>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={3}>
                <div className="text-center p-3 bg-light rounded">
                  <h4 className="text-primary mb-0">{usageStats.totalHouseholds}</h4>
                  <small className="text-muted">Tổng hộ gia đình</small>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3 bg-light rounded">
                  <h4 className="text-success mb-0">{usageStats.appliedTo}</h4>
                  <small className="text-muted">Đã áp dụng</small>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3 bg-light rounded">
                  <h4 className="text-warning mb-0">{formatCurrency(usageStats.totalRevenue)}</h4>
                  <small className="text-muted">Tổng doanh thu</small>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3 bg-light rounded">
                  <h4 className="text-info mb-0">{usageStats.paymentRate}%</h4>
                  <small className="text-muted">Tỷ lệ thanh toán</small>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      <Card className="shadow-lg border-warning mb-4">
        <Card.Header className="bg-warning text-dark">
          <Row className="align-items-center">
            <Col>
              <div className="d-flex align-items-center">
                <i className="fas fa-coins fa-lg me-2"></i>
                <h1 className="mb-0" style={{ fontSize: '1.5rem' }}>
                  {isEditMode ? 'Chỉnh Sửa Phí' : 'Tạo Phí Mới'}
                </h1>
                {isEditMode && lastSaved && (
                  <Badge bg="success" className="ms-3">
                    <i className="fas fa-save me-1"></i>
                    Lưu lúc {lastSaved.toLocaleTimeString('vi-VN')}
                  </Badge>
                )}
                {calculating && (
                  <Spinner animation="border" size="sm" className="ms-3" />
                )}
              </div>
            </Col>
            <Col xs="auto">
              <div className="d-flex gap-2">
                <Button
                  variant="outline-dark"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <i className={`fas fa-${showAdvanced ? 'minus' : 'plus'} me-1`}></i>
                  {showAdvanced ? 'Thu gọn' : 'Nâng cao'}
                </Button>
                {isEditMode && (
                  <Button
                    variant="outline-dark"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                  >
                    <i className="fas fa-history me-1"></i>
                    Lịch sử
                  </Button>
                )}
              </div>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {error && <Message variant='danger'>{error}</Message>}
          {success && <Message variant='success'>{isEditMode ? 'Phí đã được cập nhật' : 'Phí đã được tạo'}</Message>}
          {loading && <Loader />}
          <Form onSubmit={submitHandler} className="p-2">
            <Form.Group controlId='feeCode' className='mb-3'>
              <Form.Label><i className="fas fa-barcode me-1 text-primary"></i> Mã Phí</Form.Label>
              <Form.Control
                type='text'
                placeholder='Nhập mã phí...'
                value={feeCode}
                onChange={(e) => setFeeCode(e.target.value)}
                isInvalid={!!validationErrors.feeCode}
                required
              />
              <Form.Control.Feedback type='invalid'>
                {validationErrors.feeCode}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId='name' className='mb-3'>
              <Form.Label><i className="fas fa-file-signature me-1 text-success"></i> Tên Phí</Form.Label>
              <Form.Control
                type='text'
                placeholder='Nhập tên phí...'
                value={name}
                onChange={(e) => setName(e.target.value)}
                isInvalid={!!validationErrors.name}
                required
              />
              <Form.Control.Feedback type='invalid'>
                {validationErrors.name}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId='amount' className='mb-3'>
              <Form.Label><i className="fas fa-money-bill-wave me-1 text-danger"></i> Số Tiền</Form.Label>
              <Form.Control
                type='number'
                placeholder='Nhập số tiền...'
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
            <Form.Group controlId='feeType' className='mb-3'>
              <Form.Label><i className="fas fa-tags me-1 text-info"></i> Loại Phí</Form.Label>
              <Form.Select
                value={feeType}
                onChange={(e) => setFeeType(e.target.value)}
              >
                <option value='mandatory'>Bắt buộc</option>
                <option value='service'>Dịch vụ</option>
                <option value='maintenance'>Bảo trì</option>
                <option value='water'>Nước</option>
                <option value='electricity'>Điện</option>
                <option value='parking'>Đỗ xe</option>
                <option value='internet'>Internet</option>
                <option value='security'>An ninh</option>
                <option value='cleaning'>Vệ sinh</option>
                <option value='contribution'>Đóng góp</option>
                <option value='other'>Khác</option>
              </Form.Select>
            </Form.Group>
            <Form.Group controlId='description' className='mb-3'>
              <Form.Label><i className="fas fa-sticky-note me-1 text-secondary"></i> Mô Tả</Form.Label>
              <Form.Control
                as='textarea'
                rows={3}
                placeholder='Thêm mô tả cho phí (không bắt buộc)'
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Form.Group>

            {/* Enhanced Fields Section */}
            {showAdvanced && (
              <Card className="bg-light mb-4">
                <Card.Header className="bg-secondary text-white">
                  <h6 className="mb-0">
                    <i className="fas fa-cogs me-2"></i>
                    Cài Đặt Nâng Cao
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group controlId='category' className='mb-3'>
                        <Form.Label><i className="fas fa-layer-group me-1 text-primary"></i> Danh Mục</Form.Label>
                        <Form.Select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option value='service'>Dịch vụ</option>
                          <option value='utilities'>Tiện ích</option>
                          <option value='maintenance'>Bảo trì</option>
                          <option value='management'>Quản lý</option>
                          <option value='security'>An ninh</option>
                          <option value='facility'>Cơ sở vật chất</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group controlId='priority' className='mb-3'>
                        <Form.Label><i className="fas fa-exclamation-triangle me-1 text-warning"></i> Độ Ưu Tiên</Form.Label>
                        <Form.Select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                        >
                          <option value='low'>Thấp</option>
                          <option value='medium'>Trung bình</option>
                          <option value='high'>Cao</option>
                          <option value='urgent'>Khẩn cấp</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={4}>
                      <Form.Group controlId='paymentMethod' className='mb-3'>
                        <Form.Label><i className="fas fa-credit-card me-1 text-info"></i> Phương Thức Thu</Form.Label>
                        <Form.Select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                          <option value='monthly'>Hàng tháng</option>
                          <option value='quarterly'>Hàng quý</option>
                          <option value='yearly'>Hàng năm</option>
                          <option value='onetime'>Một lần</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group controlId='discountPercentage' className='mb-3'>
                        <Form.Label><i className="fas fa-percentage me-1 text-success"></i> Giảm Giá (%)</Form.Label>
                        <Form.Control
                          type='number'
                          placeholder='0'
                          value={discountPercentage}
                          onChange={(e) => handleFieldChange('discountPercentage', e.target.value)}
                          isInvalid={!!validationErrors.discountPercentage}
                          min="0"
                          max="100"
                          step="0.1"
                        />
                        <Form.Control.Feedback type='invalid'>
                          {validationErrors.discountPercentage}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group controlId='lateFee' className='mb-3'>
                        <Form.Label><i className="fas fa-clock me-1 text-danger"></i> Phí Phạt Muộn</Form.Label>
                        <Form.Control
                          type='number'
                          placeholder='0'
                          value={lateFee}
                          onChange={(e) => handleFieldChange('lateFee', e.target.value)}
                          isInvalid={!!validationErrors.lateFee}
                          min="0"
                          step="1000"
                        />
                        <Form.Control.Feedback type='invalid'>
                          {validationErrors.lateFee}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group controlId='gracePeriod' className='mb-3'>
                        <Form.Label><i className="fas fa-hourglass-half me-1 text-secondary"></i> Thời Gian Gia Hạn (ngày)</Form.Label>
                        <Form.Control
                          type='number'
                          placeholder='7'
                          value={gracePeriod}
                          onChange={(e) => handleFieldChange('gracePeriod', e.target.value)}
                          isInvalid={!!validationErrors.gracePeriod}
                          min="0"
                          max="90"
                        />
                        <Form.Control.Feedback type='invalid'>
                          {validationErrors.gracePeriod}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <div className="mb-3">
                        <Form.Label><i className="fas fa-calculator me-1 text-primary"></i> Tính Toán Tự Động</Form.Label>
                        <div className="d-flex gap-3 mt-2">
                          <Form.Check
                            type='checkbox'
                            label='Tự động tính toán'
                            checked={autoCalculate}
                            onChange={(e) => setAutoCalculate(e.target.checked)}
                          />
                          <Form.Check
                            type='checkbox'
                            label='Yêu cầu phê duyệt'
                            checked={requireApproval}
                            onChange={(e) => setRequireApproval(e.target.checked)}
                            isInvalid={!!validationErrors.requireApproval}
                          />
                        </div>
                        {validationErrors.requireApproval && (
                          <Form.Text className="text-danger">
                            {validationErrors.requireApproval}
                          </Form.Text>
                        )}
                      </div>
                    </Col>
                  </Row>

                  {/* Notification Settings */}
                  <div className="border-top pt-3">
                    <h6 className="text-primary mb-3">
                      <i className="fas fa-bell me-2"></i>
                      Cài Đặt Thông Báo
                    </h6>
                    
                    <Form.Group className='mb-3'>
                      <Form.Check
                        type='checkbox'
                        label={
                          <span>
                            <i className="fas fa-users me-1 text-info"></i>
                            Thông báo cho cư dân
                          </span>
                        }
                        checked={notifyResidents}
                        onChange={(e) => setNotifyResidents(e.target.checked)}
                      />
                    </Form.Group>

                    {notifyResidents && (
                      <Row>
                        <Col md={6}>
                          <Form.Group controlId='emailTemplate' className='mb-3'>
                            <Form.Label><i className="fas fa-envelope me-1 text-primary"></i> Mẫu Email</Form.Label>
                            <Form.Control
                              as='textarea'
                              rows={4}
                              placeholder='Nhập nội dung email thông báo...'
                              value={emailTemplate}
                              onChange={(e) => setEmailTemplate(e.target.value)}
                              isInvalid={!!validationErrors.emailTemplate}
                            />
                            <Form.Control.Feedback type='invalid'>
                              {validationErrors.emailTemplate}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group controlId='smsTemplate' className='mb-3'>
                            <Form.Label><i className="fas fa-sms me-1 text-success"></i> Mẫu SMS</Form.Label>
                            <Form.Control
                              as='textarea'
                              rows={4}
                              placeholder='Nhập nội dung SMS thông báo...'
                              value={smsTemplate}
                              onChange={(e) => setSmsTemplate(e.target.value)}
                              maxLength={160}
                            />
                            <Form.Text className="text-muted">
                              {smsTemplate.length}/160 ký tự
                            </Form.Text>
                          </Form.Group>
                        </Col>
                      </Row>
                    )}
                  </div>

                  {/* Auto-calculated amount preview */}
                  {autoCalculate && amount && (
                    <Alert variant="info" className="mt-3">
                      <Row className="align-items-center">
                        <Col>
                          <strong>Số tiền sau khi tính toán:</strong>
                        </Col>
                        <Col xs="auto">
                          <h5 className="mb-0 text-primary">
                            {formatCurrency(calculateFinalAmount())}
                          </h5>
                        </Col>
                      </Row>
                      {discountPercentage > 0 && (
                        <small className="text-muted">
                          Giảm giá {discountPercentage}% từ {formatCurrency(amount)}
                        </small>
                      )}
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            )}

            <Row>
              <Col md={6}>
                <Form.Group controlId='startDate' className='mb-3'>
                  <Form.Label><i className="fas fa-calendar-plus me-1 text-success"></i> Ngày Bắt Đầu</Form.Label>
                  <Form.Control
                    type='date'
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId='endDate' className='mb-3'>
                  <Form.Label><i className="fas fa-calendar-times me-1 text-danger"></i> Ngày Kết Thúc</Form.Label>
                  <Form.Control
                    type='date'
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
            {isEditMode && (
              <Form.Group controlId='active' className='mb-3'>
                <Form.Check
                  type='checkbox'
                  label={<span><i className="fas fa-toggle-on me-1 text-success"></i> Hoạt động</span>}
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
              </Form.Group>
            )}
            <Button type='submit' variant='warning' className='mt-3 w-100 shadow-sm' size="lg">
              {isEditMode ? <><i className="fas fa-save me-2"></i> Cập Nhật</> : <><i className="fas fa-plus-circle me-2"></i> Tạo Mới</>}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {/* Related Fees Section */}
      {relatedFees.length > 0 && (
        <Card className="shadow-lg border-info mb-4">
          <Card.Header className="bg-info text-white">
            <h6 className="mb-0">
              <i className="fas fa-link me-2"></i>
              Phí Liên Quan ({relatedFees.length})
            </h6>
          </Card.Header>
          <Card.Body>
            <Row>
              {relatedFees.slice(0, 4).map((fee) => (
                <Col md={3} key={fee._id}>
                  <Card className="border-0 bg-light h-100">
                    <Card.Body className="text-center">
                      <h6 className="text-primary">{fee.name}</h6>
                      <p className="text-muted small mb-1">{fee.feeCode}</p>
                      <h5 className="mb-0">{formatCurrency(fee.amount)}</h5>
                      <Badge bg={fee.active ? 'success' : 'secondary'} className="mt-2">
                        {fee.active ? 'Hoạt động' : 'Tạm dừng'}
                      </Badge>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card.Body>
        </Card>
      )}

      {/* Fee History Modal */}
      <Modal show={showHistory} onHide={() => setShowHistory(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-history me-2"></i>
            Lịch Sử Thay Đổi - {name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {feeHistory.length === 0 ? (
            <Alert variant="info">
              <i className="fas fa-info-circle me-2"></i>
              Chưa có lịch sử thay đổi nào
            </Alert>
          ) : (
            <div className="timeline">
              {feeHistory.map((history, index) => (
                <div key={index} className="timeline-item mb-3">
                  <Row>
                    <Col xs={2} className="text-center">
                      <div className="timeline-marker bg-primary rounded-circle d-inline-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                        <i className="fas fa-edit text-white"></i>
                      </div>
                    </Col>
                    <Col xs={10}>
                      <Card className="border-0 bg-light">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <h6 className="mb-1">{history.action}</h6>
                              <p className="text-muted small mb-1">
                                bởi {history.user} • {new Date(history.timestamp).toLocaleString('vi-VN')}
                              </p>
                              {history.changes && (
                                <div className="mt-2">
                                  {Object.entries(history.changes).map(([field, change]) => (
                                    <div key={field} className="small">
                                      <strong>{field}:</strong> {change.from} → {change.to}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Badge bg="outline-primary">
                              v{history.version}
                            </Badge>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHistory(false)}>
            Đóng
          </Button>
          {isEditMode && (
            <Button variant="primary" onClick={handleExportFee}>
              <i className="fas fa-download me-2"></i>
              Xuất lịch sử
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Import Data Modal */}
      <Modal show={showImportModal} onHide={() => setShowImportModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-upload me-2"></i>
            Nhập Dữ Liệu Phí
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <i className="fas fa-info-circle me-2"></i>
            Tải lên file Excel hoặc CSV chứa thông tin các khoản phí để nhập hàng loạt
          </Alert>
          
          <Form.Group className="mb-3">
            <Form.Label>Chọn file dữ liệu</Form.Label>
            <Form.Control
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  // Process file upload logic here
                  console.log('File selected:', file.name);
                }
              }}
            />
            <Form.Text className="text-muted">
              Hỗ trợ file Excel (.xlsx, .xls) và CSV (.csv)
            </Form.Text>
          </Form.Group>

          {importData.length > 0 && (
            <div>
              <h6>Xem trước dữ liệu:</h6>
              <div className="table-responsive" style={{maxHeight: '300px'}}>
                <table className="table table-striped table-sm">
                  <thead>
                    <tr>
                      <th>Mã phí</th>
                      <th>Tên phí</th>
                      <th>Số tiền</th>
                      <th>Loại</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importData.slice(0, 10).map((item, index) => (
                      <tr key={index}>
                        <td>{item.feeCode}</td>
                        <td>{item.name}</td>
                        <td>{formatCurrency(item.amount)}</td>
                        <td>{item.feeType}</td>
                        <td>
                          <Badge bg={item.valid ? 'success' : 'danger'}>
                            {item.valid ? 'Hợp lệ' : 'Lỗi'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImportModal(false)}>
            Hủy
          </Button>
          <Button 
            variant="primary" 
            disabled={importData.length === 0}
            onClick={() => {
              // Process import logic here
              setShowImportModal(false);
            }}
          >
            <i className="fas fa-check me-2"></i>
            Nhập dữ liệu ({importData.length})
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Auto-save indicator */}
      {autoSave && isDirty && (
        <div className="position-fixed bottom-0 end-0 p-3" style={{zIndex: 1050}}>
          <Alert variant="warning" className="mb-0 shadow-lg">
            <div className="d-flex align-items-center">
              <Spinner animation="border" size="sm" className="me-2" />
              <span>Đang tự động lưu...</span>
            </div>
          </Alert>
        </div>
      )}

      {/* Duplicate warning notification */}
      {duplicateWarning && (
        <div className="position-fixed bottom-0 start-50 translate-middle-x p-3" style={{zIndex: 1050}}>
          <Alert variant="danger" className="mb-0 shadow-lg">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {duplicateWarning}
          </Alert>
        </div>
      )}
    </>
  );
};

export default FeeEditScreen; 