import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import { Row, Col, Card, Form, Button, Alert, Spinner, Modal, Badge, Tab, Tabs, Table, ProgressBar, Toast, ToastContainer, Dropdown, OverlayTrigger, Tooltip, Accordion, ListGroup, InputGroup, FloatingLabel, Offcanvas } from 'react-bootstrap';
import { FaCogs, FaSave, FaArrowLeft, FaPlus, FaEdit, FaCamera, FaQrcode, FaFileUpload, FaHistory, FaTags, FaTools, FaChartLine, FaSearch, FaPrint, FaShare, FaClipboard, FaCalendar, FaMoneyBill, FaShield, FaGas, FaCog, FaBell, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaWrench, FaChartBar, FaFileAlt, FaImage, FaVideo, FaMapMarkerAlt, FaPhone, FaEnvelope, FaGlobe, FaUser, FaBuilding, FaIndustry } from 'react-icons/fa';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
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
import Chart from 'react-apexcharts';

const FacilityFormScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { userInfo } = useContext(AuthContext);
  const isEdit = Boolean(id);
  const webcamRef = useRef(null);
  const printRef = useRef(null);

  // Core form data
  const [formData, setFormData] = useState({
    tenTienIch: '',
    loaiTienIch: '',
    trangThai: 'Hoạt động bình thường',
    viTri: '',
    ngayLapDat: '',
    nhaCungCap: '',
    lanBaoTriCuoi: '',
    baoTriTiepTheo: '',
    chiPhiBaoTri: 0,
    hetHanBaoHanh: '',
    soDienThoaiHotro: '',
    thongSoKyThuat: {
      congSuat: '',
      dienAp: '',
      donViTinh: '',
      thongSoKhac: ''
    },
    ghiChu: '',
    mucDoUuTien: 'Trung bình',
    tinhTrangBaoHanh: 'Không có bảo hành',
    // Extended facility info
    maTienIch: '',
    serialNumber: '',
    modelNumber: '',
    manufacturer: '',
    installationCost: 0,
    warrantyPeriod: 12,
    operatingHours: 0,
    energyConsumption: 0,
    lastInspectionDate: '',
    nextInspectionDate: '',
    certifications: [],
    safetyRating: 'A',
    environmentalImpact: 'Thấp',
    operatingTemperature: '',
    dimensions: {
      length: '',
      width: '',
      height: '',
      weight: ''
    },
    contactInfo: {
      technicalSupport: '',
      emergencyContact: '',
      supplierEmail: '',
      supplierWebsite: ''
    },
    images: [],
    documents: [],
    tags: [],
    customFields: {}
  });
  
  // Basic states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Advanced states
  const [facilityHistory, setFacilityHistory] = useState([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [inspectionRecords, setInspectionRecords] = useState([]);
  const [incidentReports, setIncidentReports] = useState([]);
  const [relatedFacilities, setRelatedFacilities] = useState([]);
  const [facilityTypes, setFacilityTypes] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  // UI states
  const [activeTab, setActiveTab] = useState('basic');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showSettingsOffcanvas, setShowSettingsOffcanvas] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Camera and image states
  const [capturedImages, setCapturedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Document management
  const [documents, setDocuments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([
    'Hướng dẫn sử dụng', 'Bảo hành', 'Chứng nhận', 'Hóa đơn mua hàng',
    'Báo cáo bảo trì', 'Giấy phép', 'Báo cáo kiểm định', 'Hợp đồng dịch vụ'
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
    type: 'all',
    priority: 'all',
    location: 'all'
  });

  // Analytics and reporting
  const [facilityStats, setFacilityStats] = useState({
    totalCost: 0,
    maintenanceCost: 0,
    energyCost: 0,
    downtime: 0,
    efficiency: 0,
    utilizationRate: 0
  });

  // Performance metrics
  const [performanceData, setPerformanceData] = useState({
    uptime: 0,
    mtbf: 0, // Mean Time Between Failures
    mttr: 0, // Mean Time To Repair
    availability: 0,
    reliability: 0
  });

  // Notifications and alerts
  const [notifications, setNotifications] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [upcomingMaintenances, setUpcomingMaintenances] = useState([]);
  const [expiringCertifications, setExpiringCertifications] = useState([]);

  // Print and export
  const [printOptions, setPrintOptions] = useState({
    includeImages: true,
    includeHistory: false,
    includeMaintenance: false,
    includeDocuments: false,
    includeAnalytics: false,
    format: 'a4'
  });

  // Comparison and favorites
  const [selectedFacilities, setSelectedFacilities] = useState([]);
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

  // Workflow and approval
  const [workflowStatus, setWorkflowStatus] = useState('draft');
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);

  // Integration and API
  const [externalSystems, setExternalSystems] = useState([]);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Computed values
  const facilityAge = useMemo(() => {
    if (!formData.ngayLapDat) return 0;
    const installDate = new Date(formData.ngayLapDat);
    const today = new Date();
    const diffTime = Math.abs(today - installDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 365);
  }, [formData.ngayLapDat]);

  const isMaintenanceDue = useMemo(() => {
    if (!formData.baoTriTiepTheo) return false;
    const maintenanceDate = new Date(formData.baoTriTiepTheo);
    const today = new Date();
    const diffTime = maintenanceDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  }, [formData.baoTriTiepTheo]);

  const isWarrantyExpiring = useMemo(() => {
    if (!formData.hetHanBaoHanh) return false;
    const warrantyDate = new Date(formData.hetHanBaoHanh);
    const today = new Date();
    const diffTime = warrantyDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  }, [formData.hetHanBaoHanh]);

  const totalOperatingCost = useMemo(() => {
    return (formData.installationCost || 0) + (formData.chiPhiBaoTri || 0) + (facilityStats.energyCost || 0);
  }, [formData.installationCost, formData.chiPhiBaoTri, facilityStats.energyCost]);

  const facilityQRData = useMemo(() => {
    return JSON.stringify({
      id: id,
      maTienIch: formData.maTienIch,
      tenTienIch: formData.tenTienIch,
      loaiTienIch: formData.loaiTienIch,
      viTri: formData.viTri,
      trangThai: formData.trangThai,
      nhaCungCap: formData.nhaCungCap
    });
  }, [id, formData]);

  const priorityColor = useMemo(() => {
    switch (formData.mucDoUuTien) {
      case 'Rất cao': return 'danger';
      case 'Cao': return 'warning';
      case 'Trung bình': return 'info';
      case 'Thấp': return 'secondary';
      default: return 'info';
    }
  }, [formData.mucDoUuTien]);

  const statusColor = useMemo(() => {
    switch (formData.trangThai) {
      case 'Hoạt động bình thường': return 'success';
      case 'Đang bảo trì': return 'warning';
      case 'Hỏng hóc': return 'danger';
      case 'Ngừng hoạt động': return 'secondary';
      default: return 'info';
    }
  }, [formData.trangThai]);

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
    showToastMessage(`Đã tải lên ${newImages.length} hình ảnh`);
  }, [showToastMessage]);

  const handleCapturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      const newImage = {
        preview: imageSrc,
        name: `facility-${Date.now()}.jpg`,
        type: 'image/jpeg',
        capturedAt: new Date()
      };
      setCapturedImages(prev => [...prev, newImage]);
      setImagePreview(prev => [...prev, newImage]);
      showToastMessage('Đã chụp ảnh thành công');
    }
  }, [showToastMessage]);

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
      createdAt: new Date(),
      facilityId: id
    }]);
    showToastMessage('Đã thêm bản ghi bảo trì');
  }, [id, showToastMessage]);

  const handleAddInspection = useCallback((inspection) => {
    setInspectionRecords(prev => [...prev, {
      ...inspection,
      id: Date.now(),
      createdAt: new Date(),
      facilityId: id
    }]);
    showToastMessage('Đã thêm bản ghi kiểm định');
  }, [id, showToastMessage]);

  const handleAddIncident = useCallback((incident) => {
    setIncidentReports(prev => [...prev, {
      ...incident,
      id: Date.now(),
      createdAt: new Date(),
      facilityId: id
    }]);
    showToastMessage('Đã thêm báo cáo sự cố');
  }, [id, showToastMessage]);

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
      pdf.save(`facility-${formData.maTienIch || formData.tenTienIch}.pdf`);
      showToastMessage('Đã xuất PDF thành công');
    }
  }, [formData.maTienIch, formData.tenTienIch, showToastMessage]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: `Thông tin tiện ích ${formData.tenTienIch}`,
        text: `${formData.loaiTienIch} - ${formData.tenTienIch} tại ${formData.viTri}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToastMessage('Đã sao chép liên kết');
    }
  }, [formData, showToastMessage]);

  const handleAutoSave = useCallback(async () => {
    if (autoSaveEnabled && isDirty && isEdit) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
            'Content-Type': 'application/json',
          },
        };
        await axios.put(`/api/facilities/${id}`, formData, config);
        setLastSaved(new Date());
        setIsDirty(false);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  }, [autoSaveEnabled, isDirty, isEdit, formData, id, userInfo]);

  const handleValidation = useCallback(() => {
    const errors = {};
    
    if (!formData.tenTienIch) errors.tenTienIch = 'Tên tiện ích là bắt buộc';
    if (!formData.loaiTienIch) errors.loaiTienIch = 'Loại tiện ích là bắt buộc';
    if (!formData.viTri) errors.viTri = 'Vị trí là bắt buộc';
    if (!formData.nhaCungCap) errors.nhaCungCap = 'Nhà cung cấp là bắt buộc';
    if (!formData.ngayLapDat) errors.ngayLapDat = 'Ngày lắp đặt là bắt buộc';
    
    if (formData.soDienThoaiHotro && !/^[0-9]{10,11}$/.test(formData.soDienThoaiHotro)) {
      errors.soDienThoaiHotro = 'Số điện thoại không hợp lệ';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const fetchFacilityAnalytics = useCallback(async () => {
    if (!id) return;
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const response = await axios.get(`/api/facilities/${id}/analytics`, config);
      setFacilityStats(response.data.stats);
      setPerformanceData(response.data.performance);
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
      const response = await axios.get(`/api/facilities/${id}/maintenance`, config);
      setMaintenanceRecords(response.data);
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
    }
  }, [id, userInfo]);

  const fetchFacilityHistory = useCallback(async () => {
    if (!id) return;
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const response = await axios.get(`/api/facilities/${id}/history`, config);
      setFacilityHistory(response.data);
    } catch (error) {
      console.error('Error fetching facility history:', error);
    }
  }, [id, userInfo]);

  const fetchRelatedFacilities = useCallback(async () => {
    if (!formData.loaiTienIch) return;
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const response = await axios.get(`/api/facilities?type=${formData.loaiTienIch}`, config);
      setRelatedFacilities(response.data.filter(f => f._id !== id));
    } catch (error) {
      console.error('Error fetching related facilities:', error);
    }
  }, [formData.loaiTienIch, id, userInfo]);

  // Fetch facility data for editing
  useEffect(() => {
    if (isEdit) {
      const fetchFacility = async () => {
        try {
          setLoading(true);
          const config = {
            headers: {
              Authorization: `Bearer ${userInfo.token}`,
            },
          };
          
          const { data } = await axios.get(`/api/facilities/${id}`, config);
          
          // Format dates for input fields
          const formatDateForInput = (date) => {
            if (!date) return '';
            return new Date(date).toISOString().split('T')[0];
          };
          
          setFormData({
            ...data,
            ngayLapDat: formatDateForInput(data.ngayLapDat),
            lanBaoTriCuoi: formatDateForInput(data.lanBaoTriCuoi),
            baoTriTiepTheo: formatDateForInput(data.baoTriTiepTheo),
            hetHanBaoHanh: formatDateForInput(data.hetHanBaoHanh),
            lastInspectionDate: formatDateForInput(data.lastInspectionDate),
            nextInspectionDate: formatDateForInput(data.nextInspectionDate),
            thongSoKyThuat: data.thongSoKyThuat || {
              congSuat: '',
              dienAp: '',
              donViTinh: '',
              thongSoKhac: ''
            },
            dimensions: data.dimensions || {
              length: '',
              width: '',
              height: '',
              weight: ''
            },
            contactInfo: data.contactInfo || {
              technicalSupport: '',
              emergencyContact: '',
              supplierEmail: '',
              supplierWebsite: ''
            }
          });

          // Fetch additional data for editing mode
          fetchFacilityAnalytics();
          fetchMaintenanceRecords();
          fetchFacilityHistory();
          
        } catch (error) {
          setError(
            error.response && error.response.data.message
              ? error.response.data.message
              : 'Không thể tải thông tin tiện ích'
          );
        } finally {
          setLoading(false);
        }
      };
      
      fetchFacility();
    }
  }, [id, isEdit, userInfo.token, fetchFacilityAnalytics, fetchMaintenanceRecords, fetchFacilityHistory]);

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
    if (autoRefresh && isEdit) {
      const refreshTimer = setInterval(() => {
        fetchFacilityAnalytics();
        fetchMaintenanceRecords();
        setLastRefresh(new Date());
      }, refreshInterval);

      return () => clearInterval(refreshTimer);
    }
  }, [autoRefresh, refreshInterval, isEdit, fetchFacilityAnalytics, fetchMaintenanceRecords]);

  // Check for maintenance and warranty alerts
  useEffect(() => {
    const checkAlerts = () => {
      const alerts = [];
      
      if (isMaintenanceDue) {
        alerts.push({
          type: 'warning',
          message: 'Tiện ích cần bảo trì',
          date: formData.baoTriTiepTheo,
          icon: 'tools'
        });
      }
      
      if (isWarrantyExpiring) {
        alerts.push({
          type: 'warning',
          message: 'Bảo hành sắp hết hạn',
          date: formData.hetHanBaoHanh,
          icon: 'shield'
        });
      }

      // Check for overdue maintenance
      if (formData.baoTriTiepTheo) {
        const maintenanceDate = new Date(formData.baoTriTiepTheo);
        const today = new Date();
        if (maintenanceDate < today) {
          alerts.push({
            type: 'danger',
            message: 'Bảo trì đã quá hạn',
            date: formData.baoTriTiepTheo,
            icon: 'exclamation-triangle'
          });
        }
      }
      
      setAlerts(alerts);
    };

    checkAlerts();
  }, [isMaintenanceDue, isWarrantyExpiring, formData.baoTriTiepTheo, formData.hetHanBaoHanh]);

  // Track recent views
  useEffect(() => {
    if (isEdit && id) {
      const recentItem = {
        id,
        maTienIch: formData.maTienIch,
        tenTienIch: formData.tenTienIch,
        loaiTienIch: formData.loaiTienIch,
        viTri: formData.viTri,
        viewedAt: new Date()
      };
      
      setRecentlyViewed(prev => [
        recentItem,
        ...prev.filter(item => item.id !== id).slice(0, 9)
      ]);
    }
  }, [id, isEdit, formData.maTienIch, formData.tenTienIch, formData.loaiTienIch, formData.viTri]);

  // Fetch related facilities when type changes
  useEffect(() => {
    if (formData.loaiTienIch) {
      fetchRelatedFacilities();
    }
  }, [formData.loaiTienIch, fetchRelatedFacilities]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('thongSoKyThuat.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        thongSoKyThuat: {
          ...prev.thongSoKyThuat,
          [field]: value
        }
      }));
    } else if (name.startsWith('dimensions.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [field]: value
        }
      }));
    } else if (name.startsWith('contactInfo.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    setIsDirty(true);
    
    // Real-time validation for specific fields
    if (name === 'soDienThoaiHotro' && value) {
      const isValid = /^[0-9]{10,11}$/.test(value);
      if (!isValid) {
        setValidationErrors(prev => ({
          ...prev,
          soDienThoaiHotro: 'Số điện thoại không hợp lệ (10-11 chữ số)'
        }));
      } else {
        setValidationErrors(prev => {
          const { soDienThoaiHotro, ...rest } = prev;
          return rest;
        });
      }
    }
    
    if (name === 'contactInfo.supplierEmail' && value) {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      if (!isValid) {
        setValidationErrors(prev => ({
          ...prev,
          supplierEmail: 'Email không hợp lệ'
        }));
      } else {
        setValidationErrors(prev => {
          const { supplierEmail, ...rest } = prev;
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

  const handleTagsChange = (newTags) => {
    setFormData(prev => ({
      ...prev,
      tags: newTags.map(tag => tag.value)
    }));
    setIsDirty(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      if (isEdit) {
        await axios.put(`/api/facilities/${id}`, formData, config);
        setSuccess('Tiện ích đã được cập nhật thành công');
      } else {
        await axios.post('/api/facilities', formData, config);
        setSuccess('Tiện ích đã được tạo thành công');
      }
      
      setTimeout(() => {
        navigate('/facilities');
      }, 1500);
      
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : `Không thể ${isEdit ? 'cập nhật' : 'tạo'} tiện ích`
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="facility-form-screen">
      {/* Hero Section */}
      <div className="hero-section mb-4">
        <Row className="align-items-center">
          <Col>
            <h1 className="hero-title mb-0">
              <FaCogs className="me-3" />
              {isEdit ? (
                <>
                  <FaEdit className="me-2" />
                  Chỉnh Sửa Tiện Ích
                </>
              ) : (
                <>
                  <FaPlus className="me-2" />
                  Thêm Tiện Ích Mới
                </>
              )}
            </h1>
            <p className="hero-subtitle mb-0">
              {isEdit ? 'Cập nhật thông tin tiện ích' : 'Thêm tiện ích mới vào hệ thống'}
            </p>
          </Col>
          <Col xs="auto">
            <Button
              as={Link}
              to="/facilities"
              variant="outline-secondary"
            >
              <FaArrowLeft className="me-2" />
              Quay Lại
            </Button>
          </Col>
        </Row>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Row>
          {/* Thông tin cơ bản */}
          <Col lg={8}>
            <Card className="mb-4 shadow-lg">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Thông Tin Cơ Bản</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tên tiện ích <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="tenTienIch"
                        value={formData.tenTienIch}
                        onChange={handleInputChange}
                        placeholder="VD: Thang máy tòa A"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Loại tiện ích <span className="text-danger">*</span></Form.Label>
                      <Form.Select
                        name="loaiTienIch"
                        value={formData.loaiTienIch}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Chọn loại tiện ích</option>
                        <option value="Thang máy">Thang máy</option>
                        <option value="Máy phát điện">Máy phát điện</option>
                        <option value="Máy bơm nước">Máy bơm nước</option>
                        <option value="Hệ thống PCCC">Hệ thống PCCC</option>
                        <option value="Hệ thống điều hòa">Hệ thống điều hòa</option>
                        <option value="Camera an ninh">Camera an ninh</option>
                        <option value="Cổng tự động">Cổng tự động</option>
                        <option value="Hệ thống âm thanh">Hệ thống âm thanh</option>
                        <option value="Đèn chiếu sáng">Đèn chiếu sáng</option>
                        <option value="Hệ thống internet">Hệ thống internet</option>
                        <option value="Khác">Khác</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Vị trí <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="viTri"
                        value={formData.viTri}
                        onChange={handleInputChange}
                        placeholder="VD: Tầng 1 tòa A"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Trạng thái</Form.Label>
                      <Form.Select
                        name="trangThai"
                        value={formData.trangThai}
                        onChange={handleInputChange}
                      >
                        <option value="Hoạt động bình thường">Hoạt động bình thường</option>
                        <option value="Đang bảo trì">Đang bảo trì</option>
                        <option value="Hỏng hóc">Hỏng hóc</option>
                        <option value="Ngừng hoạt động">Ngừng hoạt động</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nhà cung cấp <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="nhaCungCap"
                        value={formData.nhaCungCap}
                        onChange={handleInputChange}
                        placeholder="VD: Công ty TNHH ABC"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Số điện thoại hỗ trợ</Form.Label>
                      <Form.Control
                        type="tel"
                        name="soDienThoaiHotro"
                        value={formData.soDienThoaiHotro}
                        onChange={handleInputChange}
                        placeholder="VD: 0123456789"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mức độ ưu tiên</Form.Label>
                      <Form.Select
                        name="mucDoUuTien"
                        value={formData.mucDoUuTien}
                        onChange={handleInputChange}
                      >
                        <option value="Thấp">Thấp</option>
                        <option value="Trung bình">Trung bình</option>
                        <option value="Cao">Cao</option>
                        <option value="Rất cao">Rất cao</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tình trạng bảo hành</Form.Label>
                      <Form.Select
                        name="tinhTrangBaoHanh"
                        value={formData.tinhTrangBaoHanh}
                        onChange={handleInputChange}
                      >
                        <option value="Không có bảo hành">Không có bảo hành</option>
                        <option value="Còn bảo hành">Còn bảo hành</option>
                        <option value="Hết bảo hành">Hết bảo hành</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Ghi chú</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="ghiChu"
                    value={formData.ghiChu}
                    onChange={handleInputChange}
                    placeholder="Ghi chú thêm về tiện ích..."
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Thông số kỹ thuật */}
            <Card className="mb-4 shadow-lg">
              <Card.Header className="bg-info text-white">
                <h5 className="mb-0">Thông Số Kỹ Thuật</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Công suất</Form.Label>
                      <Form.Control
                        type="text"
                        name="thongSoKyThuat.congSuat"
                        value={formData.thongSoKyThuat.congSuat}
                        onChange={handleInputChange}
                        placeholder="VD: 10kW"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Điện áp</Form.Label>
                      <Form.Control
                        type="text"
                        name="thongSoKyThuat.dienAp"
                        value={formData.thongSoKyThuat.dienAp}
                        onChange={handleInputChange}
                        placeholder="VD: 220V"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Đơn vị tính</Form.Label>
                      <Form.Control
                        type="text"
                        name="thongSoKyThuat.donViTinh"
                        value={formData.thongSoKyThuat.donViTinh}
                        onChange={handleInputChange}
                        placeholder="VD: máy, bộ, hệ thống"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Thông số khác</Form.Label>
                      <Form.Control
                        type="text"
                        name="thongSoKyThuat.thongSoKhac"
                        value={formData.thongSoKyThuat.thongSoKhac}
                        onChange={handleInputChange}
                        placeholder="Thông số kỹ thuật khác"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>

          {/* Thông tin ngày tháng và chi phí */}
          <Col lg={4}>
            <Card className="mb-4 shadow-lg">
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0">Ngày Tháng & Chi Phí</h5>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Label>Ngày lắp đặt <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="ngayLapDat"
                    value={formData.ngayLapDat}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Lần bảo trì cuối</Form.Label>
                  <Form.Control
                    type="date"
                    name="lanBaoTriCuoi"
                    value={formData.lanBaoTriCuoi}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Bảo trì tiếp theo</Form.Label>
                  <Form.Control
                    type="date"
                    name="baoTriTiepTheo"
                    value={formData.baoTriTiepTheo}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Hết hạn bảo hành</Form.Label>
                  <Form.Control
                    type="date"
                    name="hetHanBaoHanh"
                    value={formData.hetHanBaoHanh}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Chi phí bảo trì (VND)</Form.Label>
                  <Form.Control
                    type="number"
                    name="chiPhiBaoTri"
                    value={formData.chiPhiBaoTri}
                    onChange={handleInputChange}
                    min="0"
                    placeholder="0"
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            {/* Action buttons */}
            <Card className="shadow-lg">
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={loading}
                    className="gradient-btn-primary"
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          className="me-2"
                        />
                        {isEdit ? 'Đang cập nhật...' : 'Đang lưu...'}
                      </>
                    ) : (
                      <>
                        <FaSave className="me-2" />
                        {isEdit ? 'Cập Nhật Tiện Ích' : 'Lưu Tiện Ích'}
                      </>
                    )}
                  </Button>
                  
                  <Button
                    as={Link}
                    to="/facilities"
                    variant="outline-secondary"
                    disabled={loading}
                  >
                    Hủy Bỏ
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

export default FacilityFormScreen; 