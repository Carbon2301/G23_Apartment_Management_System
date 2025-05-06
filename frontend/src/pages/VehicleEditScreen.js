import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import { Row, Col, Form, Button, Card, Alert, Spinner, Modal, Badge, Tab, Tabs, Table, ProgressBar, Toast, ToastContainer, Dropdown, OverlayTrigger, Tooltip, Accordion, ListGroup, InputGroup, FloatingLabel, Offcanvas } from 'react-bootstrap';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { FaSave, FaArrowLeft, FaCar, FaUser, FaHome, FaCamera, FaQrcode, FaFileUpload, FaHistory, FaTags, FaTools, FaChartLine, FaSearch, FaPrint, FaShare, FaClipboard, FaCalendar, FaMoneyBill, FaShield, FaGas, FaCog, FaBell } from 'react-icons/fa';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { Formik, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import Webcam from 'react-webcam';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

const VehicleEditScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { userInfo } = useContext(AuthContext);
  const isEditing = Boolean(id);
  const webcamRef = useRef(null);
  const printRef = useRef(null);

  // Core form data
  const [formData, setFormData] = useState({
    licensePlate: '',
    vehicleType: 'Xe máy',
    brand: '',
    model: '',
    color: '',
    year: new Date().getFullYear(),
    household: '',
    owner: '',
    parkingSlot: '',
    status: 'Đang sử dụng',
    note: '',
    // Extended vehicle info
    engineNumber: '',
    chassisNumber: '',
    fuelType: 'Xăng',
    engineCapacity: '',
    weight: '',
    maxSpeed: '',
    purchaseDate: new Date(),
    purchasePrice: '',
    estimatedValue: '',
    insuranceCompany: '',
    insuranceNumber: '',
    insuranceExpiry: new Date(),
    registrationExpiry: new Date(),
    images: [],
    documents: [],
    tags: [],
    modifications: []
  });

  // Basic states
  const [households, setHouseholds] = useState([]);
  const [residents, setResidents] = useState([]);
  const [filteredResidents, setFilteredResidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Advanced states
  const [vehicleHistory, setVehicleHistory] = useState([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [violationRecords, setViolationRecords] = useState([]);
  const [insuranceHistory, setInsuranceHistory] = useState([]);
  const [relatedVehicles, setRelatedVehicles] = useState([]);
  const [parkingSlots, setParkingSlots] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [vehicleBrands, setVehicleBrands] = useState([]);
  const [vehicleModels, setVehicleModels] = useState([]);
  const [vehicleColors, setVehicleColors] = useState([]);

  // UI states
  const [activeTab, setActiveTab] = useState('basic');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showSettingsOffcanvas, setShowSettingsOffcanvas] = useState(false);

  // Camera and image states
  const [capturedImages, setCapturedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Document management
  const [documents, setDocuments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([
    'Đăng ký xe', 'Bảo hiểm', 'Giấy phép lái xe', 'Hóa đơn mua xe', 
    'Giấy tờ sửa chữa', 'Giấy kiểm định', 'Phiếu phạt', 'Hợp đồng cho thuê'
  ]);

  // Form validation and auto-save
  const [validationErrors, setValidationErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    status: 'all',
    vehicleType: 'all',
    year: 'all',
    household: 'all'
  });

  // Analytics and reporting
  const [vehicleStats, setVehicleStats] = useState({
    totalCost: 0,
    maintenanceCost: 0,
    insuranceCost: 0,
    violationCost: 0,
    depreciationValue: 0
  });

  // Notifications and alerts
  const [notifications, setNotifications] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [upcomingMaintenances, setUpcomingMaintenances] = useState([]);
  const [expiringDocuments, setExpiringDocuments] = useState([]);

  // Print and export
  const [printOptions, setPrintOptions] = useState({
    includeImages: true,
    includeHistory: false,
    includeMaintenance: false,
    includeDocuments: false,
    format: 'a4'
  });

  // Comparison and favorites
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Auto-refresh and real-time updates
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Toast notifications
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');

  // Computed values
  const vehicleAge = useMemo(() => {
    return new Date().getFullYear() - formData.year;
  }, [formData.year]);

  const isInsuranceExpiring = useMemo(() => {
    const expiryDate = new Date(formData.insuranceExpiry);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  }, [formData.insuranceExpiry]);

  const isRegistrationExpiring = useMemo(() => {
    const expiryDate = new Date(formData.registrationExpiry);
    const today = new Date();
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  }, [formData.registrationExpiry]);

  const estimatedDepreciation = useMemo(() => {
    if (!formData.purchasePrice || !vehicleAge) return 0;
    const annualDepreciation = 0.15; // 15% per year
    const depreciationRate = Math.pow(1 - annualDepreciation, vehicleAge);
    return formData.purchasePrice * (1 - depreciationRate);
  }, [formData.purchasePrice, vehicleAge]);

  const totalMaintenanceCost = useMemo(() => {
    return maintenanceRecords.reduce((sum, record) => sum + (record.cost || 0), 0);
  }, [maintenanceRecords]);

  const vehicleQRData = useMemo(() => {
    return JSON.stringify({
      id: id,
      licensePlate: formData.licensePlate,
      brand: formData.brand,
      model: formData.model,
      year: formData.year,
      owner: formData.owner,
      parkingSlot: formData.parkingSlot
    });
  }, [id, formData]);

  // Callback functions
  const showToastMessage = useCallback((message, variant = 'success') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, []);

  const handleImageUpload = useCallback((files) => {
    const newImages = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date()
    }));
    setImagePreview(prev => [...prev, ...newImages]);
    setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
  }, []);

  const handleCapturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      const newImage = {
        preview: imageSrc,
        name: `camera-${Date.now()}.jpg`,
        type: 'image/jpeg',
        capturedAt: new Date()
      };
      setCapturedImages(prev => [...prev, newImage]);
      setImagePreview(prev => [...prev, newImage]);
    }
  }, []);

  const handleDocumentUpload = useCallback((file, type) => {
    const newDocument = {
      file,
      type,
      name: file.name,
      size: file.size,
      uploadedAt: new Date(),
      expiryDate: null
    };
    setDocuments(prev => [...prev, newDocument]);
    showToastMessage(`Đã tải lên tài liệu: ${file.name}`);
  }, [showToastMessage]);

  const handleAddMaintenance = useCallback((maintenance) => {
    setMaintenanceRecords(prev => [...prev, {
      ...maintenance,
      id: Date.now(),
      createdAt: new Date()
    }]);
    showToastMessage('Đã thêm bản ghi bảo dưỡng');
  }, [showToastMessage]);

  const handleAddToFavorites = useCallback(() => {
    if (!favorites.includes(id)) {
      setFavorites(prev => [...prev, id]);
      showToastMessage('Đã thêm vào danh sách yêu thích');
    }
  }, [favorites, id, showToastMessage]);

  const handleExportPDF = useCallback(async () => {
    const pdf = new jsPDF();
    const element = printRef.current;
    
    if (element) {
      const canvas = await toPng(element);
      const imgData = canvas;
      pdf.addImage(imgData, 'PNG', 0, 0);
      pdf.save(`vehicle-${formData.licensePlate}.pdf`);
      showToastMessage('Đã xuất PDF thành công');
    }
  }, [formData.licensePlate, showToastMessage]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: `Thông tin xe ${formData.licensePlate}`,
        text: `Xe ${formData.brand} ${formData.model} - ${formData.licensePlate}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToastMessage('Đã sao chép liên kết');
    }
  }, [formData, showToastMessage]);

  const handleAutoSave = useCallback(async () => {
    if (autoSaveEnabled && isDirty && isEditing) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
            'Content-Type': 'application/json',
          },
        };
        await axios.put(`/api/vehicles/${id}`, formData, config);
        setLastSaved(new Date());
        setIsDirty(false);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  }, [autoSaveEnabled, isDirty, isEditing, formData, id, userInfo]);

  const handleValidation = useCallback(() => {
    const errors = {};
    
    if (!formData.licensePlate) errors.licensePlate = 'Biển số xe là bắt buộc';
    if (!formData.brand) errors.brand = 'Hãng xe là bắt buộc';
    if (!formData.color) errors.color = 'Màu sắc là bắt buộc';
    if (!formData.household) errors.household = 'Hộ gia đình là bắt buộc';
    if (!formData.owner) errors.owner = 'Chủ sở hữu là bắt buộc';
    
    if (formData.licensePlate && !/^[0-9]{2}[A-Z]{1,2}-[0-9]{4,5}$/.test(formData.licensePlate)) {
      errors.licensePlate = 'Biển số xe không đúng định dạng';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const fetchVehicleAnalytics = useCallback(async () => {
    if (!id) return;
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const response = await axios.get(`/api/vehicles/${id}/analytics`, config);
      setVehicleStats(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  }, [id, userInfo]);

  const fetchMaintenanceRecords = useCallback(async () => {
    if (!id) return;
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const response = await axios.get(`/api/vehicles/${id}/maintenance`, config);
      setMaintenanceRecords(response.data);
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
    }
  }, [id, userInfo]);

  const fetchVehicleHistory = useCallback(async () => {
    if (!id) return;
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const response = await axios.get(`/api/vehicles/${id}/history`, config);
      setVehicleHistory(response.data);
    } catch (error) {
      console.error('Error fetching vehicle history:', error);
    }
  }, [id, userInfo]);

  const fetchRelatedVehicles = useCallback(async () => {
    if (!formData.household) return;
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const response = await axios.get(`/api/vehicles?household=${formData.household}`, config);
      setRelatedVehicles(response.data.filter(v => v._id !== id));
    } catch (error) {
      console.error('Error fetching related vehicles:', error);
    }
  }, [formData.household, id, userInfo]);

  useEffect(() => {
    if (userInfo) {
      fetchHouseholds();
      if (isEditing) {
        fetchVehicle();
        fetchVehicleAnalytics();
        fetchMaintenanceRecords();
        fetchVehicleHistory();
      }
    }
  }, [id, isEditing, userInfo, fetchVehicleAnalytics, fetchMaintenanceRecords, fetchVehicleHistory]);

  useEffect(() => {
    if (userInfo && formData.household) {
      fetchResidentsByHousehold(formData.household);
      fetchRelatedVehicles();
    } else {
      setFilteredResidents([]);
      setFormData(prev => ({ ...prev, owner: '' }));
    }
  }, [formData.household, userInfo, fetchRelatedVehicles]);

  // Auto-save effect
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      handleAutoSave();
    }, 5000);

    return () => clearTimeout(saveTimer);
  }, [formData, handleAutoSave]);

  // Form validation effect
  useEffect(() => {
    handleValidation();
  }, [formData, handleValidation]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && isEditing) {
      const refreshTimer = setInterval(() => {
        fetchVehicleAnalytics();
        fetchMaintenanceRecords();
        setLastRefresh(new Date());
      }, refreshInterval);

      return () => clearInterval(refreshTimer);
    }
  }, [autoRefresh, refreshInterval, isEditing, fetchVehicleAnalytics, fetchMaintenanceRecords]);

  // Check for expiring documents
  useEffect(() => {
    const checkExpirations = () => {
      const alerts = [];
      
      if (isInsuranceExpiring) {
        alerts.push({
          type: 'warning',
          message: 'Bảo hiểm xe sắp hết hạn',
          date: formData.insuranceExpiry
        });
      }
      
      if (isRegistrationExpiring) {
        alerts.push({
          type: 'warning',
          message: 'Đăng ký xe sắp hết hạn',
          date: formData.registrationExpiry
        });
      }
      
      setAlerts(alerts);
    };

    checkExpirations();
  }, [isInsuranceExpiring, isRegistrationExpiring, formData.insuranceExpiry, formData.registrationExpiry]);

  // Track recent views
  useEffect(() => {
    if (isEditing && id) {
      const recentItem = {
        id,
        licensePlate: formData.licensePlate,
        brand: formData.brand,
        model: formData.model,
        viewedAt: new Date()
      };
      
      setRecentlyViewed(prev => [
        recentItem,
        ...prev.filter(item => item.id !== id).slice(0, 9)
      ]);
    }
  }, [id, isEditing, formData.licensePlate, formData.brand, formData.model]);

  const fetchHouseholds = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const response = await axios.get('/api/households', config);
      console.log('Households response:', response.data);
      setHouseholds(response.data || []);
    } catch (error) {
      setError('Có lỗi xảy ra khi tải danh sách hộ gia đình');
      console.error('Error fetching households:', error);
    }
  };

  const fetchResidentsByHousehold = async (householdId) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const response = await axios.get(`/api/residents?household=${householdId}`, config);
      const householdResidents = response.data || [];
      setFilteredResidents(householdResidents);
    } catch (error) {
      console.error('Error fetching residents:', error);
      setFilteredResidents([]);
    }
  };

  const fetchVehicle = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const response = await axios.get(`/api/vehicles/${id}`, config);
      const vehicle = response.data;

      setFormData({
        licensePlate: vehicle.licensePlate || '',
        vehicleType: vehicle.vehicleType || 'Xe máy',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        color: vehicle.color || '',
        year: vehicle.year || new Date().getFullYear(),
        household: vehicle.household?._id || '',
        owner: vehicle.owner?._id || '',
        parkingSlot: vehicle.parkingSlot || '',
        status: vehicle.status || 'Đang sử dụng',
        note: vehicle.note || ''
      });
    } catch (error) {
      setError('Có lỗi xảy ra khi tải thông tin xe');
      console.error('Error fetching vehicle:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setIsDirty(true);
    
    // Real-time validation for specific fields
    if (name === 'licensePlate' && value) {
      const isValid = /^[0-9]{2}[A-Z]{1,2}-[0-9]{4,5}$/.test(value.toUpperCase());
      if (!isValid) {
        setValidationErrors(prev => ({
          ...prev,
          licensePlate: 'Biển số xe không đúng định dạng (VD: 30A-12345)'
        }));
      } else {
        setValidationErrors(prev => {
          const { licensePlate, ...rest } = prev;
          return rest;
        });
      }
    }
  };

  const handleDateChange = (date, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
    setIsDirty(true);
  };

  const handleSelectChange = (selectedOption, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: selectedOption ? selectedOption.value : ''
    }));
    setIsDirty(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const submitData = {
        ...formData,
        year: parseInt(formData.year) || undefined
      };

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          'Content-Type': 'application/json',
        },
      };

      if (isEditing) {
        await axios.put(`/api/vehicles/${id}`, submitData, config);
        setSuccess('Cập nhật thông tin xe thành công!');
      } else {
        await axios.post('/api/vehicles', submitData, config);
        setSuccess('Thêm xe mới thành công!');
      }

      setTimeout(() => {
        navigate('/vehicles');
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin xe');
      console.error('Error saving vehicle:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentYear = () => new Date().getFullYear();

  if (loading && isEditing) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Đang tải thông tin xe...</p>
      </div>
    );
  }

  return (
    <div className="vehicle-edit-screen">
      {/* Hero Section */}
      <div className="hero-section mb-4">
        <Row className="align-items-center">
          <Col>
            <h1 className="hero-title mb-0">
              <FaCar className="me-3" />
              {isEditing ? 'Chỉnh Sửa Xe' : 'Thêm Xe Mới'}
            </h1>
            <p className="hero-subtitle mb-0">
              {isEditing ? 'Cập nhật thông tin xe' : 'Đăng ký xe mới cho hộ gia đình'}
            </p>
          </Col>
          <Col xs="auto">
            <Button
              variant="outline-secondary"
              onClick={() => navigate('/vehicles')}
              className="gradient-btn-outline"
            >
              <FaArrowLeft className="me-2" />
              Quay lại
            </Button>
          </Col>
        </Row>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Row>
          <Col lg={8}>
            {/* Vehicle Information */}
            <Card className="form-card mb-4">
              <Card.Header className="form-header">
                <h5 className="mb-0">
                  <FaCar className="me-2" />
                  Thông tin xe
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Biển số xe *</Form.Label>
                      <Form.Control
                        type="text"
                        name="licensePlate"
                        value={formData.licensePlate}
                        onChange={handleInputChange}
                        placeholder="VD: 30A-12345"
                        required
                        className="form-control-modern"
                        style={{ textTransform: 'uppercase' }}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Loại xe *</Form.Label>
                      <Form.Select
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleInputChange}
                        required
                        className="form-control-modern"
                      >
                        <option value="Xe máy">Xe máy</option>
                        <option value="Ô tô">Ô tô</option>
                        <option value="Xe đạp">Xe đạp</option>
                        <option value="Xe điện">Xe điện</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Hãng xe *</Form.Label>
                      <Form.Control
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                        placeholder="VD: Honda, Toyota, Yamaha..."
                        required
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mẫu xe</Form.Label>
                      <Form.Control
                        type="text"
                        name="model"
                        value={formData.model}
                        onChange={handleInputChange}
                        placeholder="VD: Vios, Wave, Exciter..."
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Màu sắc *</Form.Label>
                      <Form.Control
                        type="text"
                        name="color"
                        value={formData.color}
                        onChange={handleInputChange}
                        placeholder="VD: Đỏ, Xanh, Trắng..."
                        required
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Năm sản xuất</Form.Label>
                      <Form.Control
                        type="number"
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        min="1900"
                        max={getCurrentYear() + 1}
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Vị trí đỗ xe</Form.Label>
                      <Form.Control
                        type="text"
                        name="parkingSlot"
                        value={formData.parkingSlot}
                        onChange={handleInputChange}
                        placeholder="VD: Tầng 1-A01, Tầng hầm B2..."
                        className="form-control-modern"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Trạng thái</Form.Label>
                      <Form.Select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="form-control-modern"
                      >
                        <option value="Đang sử dụng">Đang sử dụng</option>
                        <option value="Tạm ngưng">Tạm ngưng</option>
                        <option value="Đã bán">Đã bán</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Ghi chú</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    placeholder="Ghi chú thêm về xe..."
                    className="form-control-modern"
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4}>
            {/* Owner Information */}
            <Card className="form-card mb-4">
              <Card.Header className="form-header">
                <h5 className="mb-0">
                  <FaHome className="me-2" />
                  Hộ gia đình & Chủ xe
                </h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Hộ gia đình *</Form.Label>
                  <Form.Select
                    name="household"
                    value={formData.household}
                    onChange={handleInputChange}
                    required
                    className="form-control-modern"
                  >
                    <option value="">Chọn hộ gia đình</option>
                    {households.map(household => (
                      <option key={household._id} value={household._id}>
                        {household.apartmentNumber} - {household.address}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Chủ sở hữu *</Form.Label>
                  <Form.Select
                    name="owner"
                    value={formData.owner}
                    onChange={handleInputChange}
                    required
                    disabled={!formData.household}
                    className="form-control-modern"
                  >
                    <option value="">Chọn chủ sở hữu</option>
                    {filteredResidents.map(resident => (
                      <option key={resident._id} value={resident._id}>
                        {resident.fullName} - {resident.idCard}
                      </option>
                    ))}
                  </Form.Select>
                  {!formData.household && (
                    <Form.Text className="text-muted">
                      Vui lòng chọn hộ gia đình trước
                    </Form.Text>
                  )}
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Action Buttons */}
            <Card className="form-card">
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="gradient-btn"
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        {isEditing ? 'Đang cập nhật...' : 'Đang thêm...'}
                      </>
                    ) : (
                      <>
                        <FaSave className="me-2" />
                        {isEditing ? 'Cập nhật xe' : 'Thêm xe mới'}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline-secondary"
                    onClick={() => navigate('/vehicles')}
                    disabled={loading}
                  >
                    Hủy
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default VehicleEditScreen; 