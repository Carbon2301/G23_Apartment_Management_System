import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import { Row, Col, Card, Form, Button, Alert, Spinner, Badge, Modal, Tab, Tabs, Table, ProgressBar, Toast, ToastContainer, Dropdown, OverlayTrigger, Tooltip, Accordion, ListGroup, InputGroup, FloatingLabel, Offcanvas } from 'react-bootstrap';
import { FaWrench, FaSave, FaArrowLeft, FaTools, FaCalendarAlt, FaCamera, FaQrcode, FaFileUpload, FaHistory, FaTags, FaChartLine, FaSearch, FaPrint, FaShare, FaClipboard, FaMoneyBill, FaShield, FaGas, FaCog, FaBell, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaChartBar, FaFileAlt, FaImage, FaVideo, FaMapMarkerAlt, FaPhone, FaEnvelope, FaGlobe, FaUser, FaBuilding, FaIndustry, FaClock, FaUserTie, FaClipboardList, FaThermometerHalf, FaLightbulb, FaWifi, FaShoppingCart, FaReceipt, FaHandshake } from 'react-icons/fa';
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

const FacilityMaintenanceScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { userInfo } = useContext(AuthContext);
  const webcamRef = useRef(null);
  const printRef = useRef(null);

  // Core data
  const [facility, setFacility] = useState(null);
  const [formData, setFormData] = useState({
    ngayBaoTri: new Date().toISOString().split('T')[0],
    chiPhiBaoTri: '',
    baoTriTiepTheo: '',
    ghiChuBaoTri: '',
    trangThaiSauBaoTri: 'Hoạt động bình thường',
    // Extended maintenance info
    loaiBaoTri: 'Bảo trì định kỳ',
    mucDoUuTien: 'Trung bình',
    kỹThuatVien: '',
    thoiGianBatDau: '',
    thoiGianKetThuc: '',
    congViecThucHien: [],
    vatTuSuDung: [],
    phuTungThayThe: [],
    kiemTraAnToan: false,
    kiemTraChucNang: false,
    kiemTraHienTrang: false,
    danhGiaHieuSuat: '',
    khuyenNghi: '',
    images: [],
    documents: [],
    checklistItems: [],
    temperatureReading: '',
    pressureReading: '',
    vibrationLevel: '',
    noiseLevel: '',
    energyConsumption: '',
    performanceRating: 5,
    customerSatisfaction: 5,
    warrantyStatus: 'Còn bảo hành',
    nextMaintenanceType: 'Bảo trì định kỳ',
    estimatedDuration: '',
    requiredSkills: [],
    safetyPrecautions: [],
    environmentalImpact: 'Thấp'
  });
  
  // Basic states
  const [loading, setLoading] = useState(false);
  const [loadingFacility, setLoadingFacility] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Advanced states
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [spareParts, setSpareParts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [inspectionReports, setInspectionReports] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [costAnalysis, setCostAnalysis] = useState({});
  const [relatedFacilities, setRelatedFacilities] = useState([]);

  // UI states
  const [activeTab, setActiveTab] = useState('basic');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTechnicianModal, setShowTechnicianModal] = useState(false);
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showSettingsOffcanvas, setShowSettingsOffcanvas] = useState(false);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);

  // Camera and image states
  const [capturedImages, setCapturedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Document management
  const [documents, setDocuments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([
    'Báo cáo bảo trì', 'Checklist kiểm tra', 'Hóa đơn phụ tùng', 'Ảnh trước/sau bảo trì',
    'Chứng nhận an toàn', 'Báo cáo hiệu suất', 'Khuyến nghị cải tiến', 'Hợp đồng dịch vụ'
  ]);

  // Form validation and auto-save
  const [validationErrors, setValidationErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    type: 'all',
    priority: 'all',
    status: 'all',
    technician: 'all',
    dateRange: 'all'
  });

  // Analytics and reporting
  const [maintenanceStats, setMaintenanceStats] = useState({
    totalCost: 0,
    averageDuration: 0,
    completionRate: 0,
    costPerHour: 0,
    mtbf: 0, // Mean Time Between Failures
    mttr: 0, // Mean Time To Repair
    availability: 0,
    reliability: 0
  });

  // Performance tracking
  const [performanceData, setPerformanceData] = useState({
    efficiency: [],
    downtime: [],
    costs: [],
    satisfaction: []
  });

  // Notifications and alerts
  const [notifications, setNotifications] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);

  // Print and export
  const [printOptions, setPrintOptions] = useState({
    includeImages: true,
    includeHistory: false,
    includeChecklist: true,
    includeAnalytics: false,
    includeCosts: true,
    format: 'a4'
  });

  // Workflow and approval
  const [workflowStatus, setWorkflowStatus] = useState('draft');
  const [approvalHistory, setApprovalHistory] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);

  // Real-time updates
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Toast notifications
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');

  // Inventory and parts
  const [inventory, setInventory] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [partRequests, setPartRequests] = useState([]);

  // Quality control
  const [qualityChecks, setQualityChecks] = useState([]);
  const [qualityScore, setQualityScore] = useState(0);
  const [complianceStatus, setComplianceStatus] = useState('compliant');

  // Computed values
  const maintenanceDuration = useMemo(() => {
    if (!formData.thoiGianBatDau || !formData.thoiGianKetThuc) return 0;
    const start = new Date(`${formData.ngayBaoTri}T${formData.thoiGianBatDau}`);
    const end = new Date(`${formData.ngayBaoTri}T${formData.thoiGianKetThuc}`);
    return Math.abs(end - start) / (1000 * 60 * 60); // hours
  }, [formData.ngayBaoTri, formData.thoiGianBatDau, formData.thoiGianKetThuc]);

  const totalPartsCost = useMemo(() => {
    return formData.phuTungThayThe.reduce((sum, part) => sum + (part.cost || 0), 0);
  }, [formData.phuTungThayThe]);

  const totalMaterialsCost = useMemo(() => {
    return formData.vatTuSuDung.reduce((sum, material) => sum + (material.cost || 0), 0);
  }, [formData.vatTuSuDung]);

  const totalMaintenanceCost = useMemo(() => {
    return (parseFloat(formData.chiPhiBaoTri) || 0) + totalPartsCost + totalMaterialsCost;
  }, [formData.chiPhiBaoTri, totalPartsCost, totalMaterialsCost]);

  const maintenanceQRData = useMemo(() => {
    return JSON.stringify({
      facilityId: id,
      maintenanceDate: formData.ngayBaoTri,
      type: formData.loaiBaoTri,
      technician: formData.kỹThuatVien,
      cost: totalMaintenanceCost,
      status: formData.trangThaiSauBaoTri
    });
  }, [id, formData, totalMaintenanceCost]);

  const priorityColor = useMemo(() => {
    switch (formData.mucDoUuTien) {
      case 'Rất cao': return 'danger';
      case 'Cao': return 'warning';
      case 'Trung bình': return 'info';
      case 'Thấp': return 'secondary';
      default: return 'info';
    }
  }, [formData.mucDoUuTien]);

  const maintenanceTypeColor = useMemo(() => {
    switch (formData.loaiBaoTri) {
      case 'Bảo trì khẩn cấp': return 'danger';
      case 'Bảo trì sửa chữa': return 'warning';
      case 'Bảo trì định kỳ': return 'success';
      case 'Bảo trì dự phòng': return 'info';
      default: return 'primary';
    }
  }, [formData.loaiBaoTri]);

  const completionPercentage = useMemo(() => {
    const totalChecks = formData.checklistItems.length;
    if (totalChecks === 0) return 0;
    const completedChecks = formData.checklistItems.filter(item => item.completed).length;
    return Math.round((completedChecks / totalChecks) * 100);
  }, [formData.checklistItems]);

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
      uploadedAt: new Date(),
      category: 'maintenance'
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
        name: `maintenance-${Date.now()}.jpg`,
        type: 'image/jpeg',
        capturedAt: new Date(),
        category: 'maintenance'
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
      category: 'maintenance'
    };
    setDocuments(prev => [...prev, newDocument]);
    showToastMessage(`Đã tải lên tài liệu: ${file.name}`);
  }, [showToastMessage]);

  const handleAddWorkTask = useCallback((task) => {
    setFormData(prev => ({
      ...prev,
      congViecThucHien: [...prev.congViecThucHien, {
        ...task,
        id: Date.now(),
        completed: false,
        startTime: new Date(),
        duration: 0
      }]
    }));
    showToastMessage('Đã thêm công việc');
  }, [showToastMessage]);

  const handleAddSparePart = useCallback((part) => {
    setFormData(prev => ({
      ...prev,
      phuTungThayThe: [...prev.phuTungThayThe, {
        ...part,
        id: Date.now(),
        usedAt: new Date()
      }]
    }));
    showToastMessage('Đã thêm phụ tùng');
  }, [showToastMessage]);

  const handleAddMaterial = useCallback((material) => {
    setFormData(prev => ({
      ...prev,
      vatTuSuDung: [...prev.vatTuSuDung, {
        ...material,
        id: Date.now(),
        usedAt: new Date()
      }]
    }));
    showToastMessage('Đã thêm vật tư');
  }, [showToastMessage]);

  const handleChecklistUpdate = useCallback((itemId, completed) => {
    setFormData(prev => ({
      ...prev,
      checklistItems: prev.checklistItems.map(item =>
        item.id === itemId ? { ...item, completed, completedAt: completed ? new Date() : null } : item
      )
    }));
  }, []);

  const handleExportPDF = useCallback(async () => {
    const pdf = new jsPDF();
    const element = printRef.current;
    
    if (element) {
      const canvas = await toPng(element);
      const imgData = canvas;
      pdf.addImage(imgData, 'PNG', 0, 0);
      pdf.save(`maintenance-report-${formData.ngayBaoTri}.pdf`);
      showToastMessage('Đã xuất báo cáo PDF thành công');
    }
  }, [formData.ngayBaoTri, showToastMessage]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: `Báo cáo bảo trì ${facility?.tenTienIch}`,
        text: `Bảo trì ${formData.loaiBaoTri} - ${formData.ngayBaoTri}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToastMessage('Đã sao chép liên kết');
    }
  }, [facility, formData, showToastMessage]);

  const handleAutoSave = useCallback(async () => {
    if (autoSaveEnabled && isDirty) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
            'Content-Type': 'application/json',
          },
        };
        await axios.post(`/api/facilities/${id}/maintenance/draft`, formData, config);
        setLastSaved(new Date());
        setIsDirty(false);
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  }, [autoSaveEnabled, isDirty, formData, id, userInfo]);

  const handleValidation = useCallback(() => {
    const errors = {};
    
    if (!formData.ngayBaoTri) errors.ngayBaoTri = 'Ngày bảo trì là bắt buộc';
    if (!formData.loaiBaoTri) errors.loaiBaoTri = 'Loại bảo trì là bắt buộc';
    if (!formData.kỹThuatVien) errors.kỹThuatVien = 'Kỹ thuật viên là bắt buộc';
    if (!formData.ghiChuBaoTri) errors.ghiChuBaoTri = 'Ghi chú bảo trì là bắt buộc';
    
    if (formData.thoiGianBatDau && formData.thoiGianKetThuc) {
      if (formData.thoiGianBatDau >= formData.thoiGianKetThuc) {
        errors.thoiGianKetThuc = 'Thời gian kết thúc phải sau thời gian bắt đầu';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const fetchMaintenanceHistory = useCallback(async () => {
    if (!id) return;
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const response = await axios.get(`/api/facilities/${id}/maintenance/history`, config);
      setMaintenanceHistory(response.data);
    } catch (error) {
      console.error('Error fetching maintenance history:', error);
    }
  }, [id, userInfo]);

  const fetchMaintenanceAnalytics = useCallback(async () => {
    if (!id) return;
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const response = await axios.get(`/api/facilities/${id}/maintenance/analytics`, config);
      setMaintenanceStats(response.data.stats);
      setPerformanceData(response.data.performance);
      setCostAnalysis(response.data.costs);
    } catch (error) {
      console.error('Error fetching maintenance analytics:', error);
    }
  }, [id, userInfo]);

  const fetchTechnicians = useCallback(async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const response = await axios.get('/api/technicians', config);
      setTechnicians(response.data);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    }
  }, [userInfo]);

  const fetchSpareParts = useCallback(async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      const response = await axios.get('/api/spare-parts', config);
      setSpareParts(response.data);
    } catch (error) {
      console.error('Error fetching spare parts:', error);
    }
  }, [userInfo]);

  // Fetch facility data
  useEffect(() => {
    const fetchFacility = async () => {
      try {
        setLoadingFacility(true);
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        
        const { data } = await axios.get(`/api/facilities/${id}`, config);
        setFacility(data);
        
        // Set suggested next maintenance date (3 months from now)
        const nextMaintenanceDate = new Date();
        nextMaintenanceDate.setMonth(nextMaintenanceDate.getMonth() + 3);
        setFormData(prev => ({
          ...prev,
          baoTriTiepTheo: nextMaintenanceDate.toISOString().split('T')[0],
          // Initialize checklist based on facility type
          checklistItems: getDefaultChecklist(data.loaiTienIch)
        }));

        // Fetch additional data
        fetchMaintenanceHistory();
        fetchMaintenanceAnalytics();
        fetchTechnicians();
        fetchSpareParts();
        
      } catch (error) {
        setError(
          error.response && error.response.data.message
            ? error.response.data.message
            : 'Không thể tải thông tin tiện ích'
        );
      } finally {
        setLoadingFacility(false);
      }
    };
    
    fetchFacility();
  }, [id, userInfo.token, fetchMaintenanceHistory, fetchMaintenanceAnalytics, fetchTechnicians, fetchSpareParts]);

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
    if (autoRefresh) {
      const refreshTimer = setInterval(() => {
        fetchMaintenanceAnalytics();
        setLastRefresh(new Date());
      }, refreshInterval);

      return () => clearInterval(refreshTimer);
    }
  }, [autoRefresh, refreshInterval, fetchMaintenanceAnalytics]);

  // Check for alerts and notifications
  useEffect(() => {
    const checkAlerts = () => {
      const alerts = [];
      
      if (formData.mucDoUuTien === 'Rất cao') {
        alerts.push({
          type: 'danger',
          message: 'Bảo trì ưu tiên cao',
          icon: 'exclamation-triangle'
        });
      }
      
      if (totalMaintenanceCost > 10000000) { // 10 million VND
        alerts.push({
          type: 'warning',
          message: 'Chi phí bảo trì cao',
          icon: 'money-bill'
        });
      }

      if (maintenanceDuration > 8) { // More than 8 hours
        alerts.push({
          type: 'info',
          message: 'Thời gian bảo trì dài',
          icon: 'clock'
        });
      }
      
      setAlerts(alerts);
    };

    checkAlerts();
  }, [formData.mucDoUuTien, totalMaintenanceCost, maintenanceDuration]);

  // Helper function to get default checklist
  const getDefaultChecklist = useCallback((facilityType) => {
    const commonChecks = [
      { id: 1, name: 'Kiểm tra an toàn', completed: false, required: true },
      { id: 2, name: 'Kiểm tra chức năng', completed: false, required: true },
      { id: 3, name: 'Kiểm tra hiện trạng', completed: false, required: true },
      { id: 4, name: 'Vệ sinh thiết bị', completed: false, required: false },
      { id: 5, name: 'Kiểm tra kết nối', completed: false, required: false }
    ];

    const specificChecks = {
      'Thang máy': [
        { id: 6, name: 'Kiểm tra cáp thang máy', completed: false, required: true },
        { id: 7, name: 'Kiểm tra hệ thống phanh', completed: false, required: true },
        { id: 8, name: 'Kiểm tra cửa thang máy', completed: false, required: true }
      ],
      'Máy phát điện': [
        { id: 6, name: 'Kiểm tra mức dầu', completed: false, required: true },
        { id: 7, name: 'Kiểm tra hệ thống làm mát', completed: false, required: true },
        { id: 8, name: 'Kiểm tra ắc quy', completed: false, required: true }
      ],
      'Máy bơm nước': [
        { id: 6, name: 'Kiểm tra áp suất', completed: false, required: true },
        { id: 7, name: 'Kiểm tra đường ống', completed: false, required: true },
        { id: 8, name: 'Kiểm tra van an toàn', completed: false, required: true }
      ]
    };

    return [...commonChecks, ...(specificChecks[facilityType] || [])];
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name.includes('.')) {
      // Handle nested object properties
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
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
    if (name === 'chiPhiBaoTri' && value) {
      const cost = parseFloat(value);
      if (cost < 0) {
        setValidationErrors(prev => ({
          ...prev,
          chiPhiBaoTri: 'Chi phí không thể âm'
        }));
      } else {
        setValidationErrors(prev => {
          const { chiPhiBaoTri, ...rest } = prev;
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

  const handleArrayChange = (newArray, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: newArray
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

      await axios.put(`/api/facilities/${id}/maintenance`, formData, config);
      setSuccess('Thông tin bảo trì đã được ghi nhận thành công');
      
      setTimeout(() => {
        navigate('/facilities');
      }, 1500);
      
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể ghi nhận thông tin bảo trì'
      );
    } finally {
      setLoading(false);
    }
  };

  const getBadgeVariant = (trangThai) => {
    switch (trangThai) {
      case 'Hoạt động bình thường':
        return 'success';
      case 'Đang bảo trì':
        return 'warning';
      case 'Hỏng hóc':
        return 'danger';
      case 'Ngừng hoạt động':
        return 'secondary';
      default:
        return 'primary';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString('vi-VN') : '';
  };

  if (loadingFacility) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!facility) {
    return (
      <Alert variant="danger">
        Không tìm thấy thông tin tiện ích
      </Alert>
    );
  }

  return (
    <div className="facility-maintenance-screen">
      {/* Hero Section */}
      <div className="hero-section mb-4">
        <Row className="align-items-center">
          <Col>
            <h1 className="hero-title mb-0">
              <FaWrench className="me-3" />
              <FaTools className="me-2" />
              Ghi Nhận Bảo Trì Tiện Ích
            </h1>
            <p className="hero-subtitle mb-0">
              Cập nhật thông tin bảo trì cho tiện ích: <strong>{facility.tenTienIch}</strong>
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

      <Row>
        {/* Thông tin tiện ích hiện tại */}
        <Col lg={4}>
          <Card className="mb-4 shadow-lg border-info">
            <Card.Header className="bg-info text-white">
              <h5 className="mb-0">Thông Tin Tiện Ích</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <strong>Tên tiện ích:</strong>
                <div>{facility.tenTienIch}</div>
              </div>
              
              <div className="mb-3">
                <strong>Loại:</strong>
                <div>
                  <Badge bg="secondary" className="mt-1">{facility.loaiTienIch}</Badge>
                </div>
              </div>
              
              <div className="mb-3">
                <strong>Vị trí:</strong>
                <div>{facility.viTri}</div>
              </div>
              
              <div className="mb-3">
                <strong>Trạng thái hiện tại:</strong>
                <div>
                  <Badge bg={getBadgeVariant(facility.trangThai)} className="mt-1">
                    {facility.trangThai}
                  </Badge>
                </div>
              </div>
              
              <div className="mb-3">
                <strong>Nhà cung cấp:</strong>
                <div>{facility.nhaCungCap}</div>
              </div>
              
              {facility.soDienThoaiHotro && (
                <div className="mb-3">
                  <strong>SĐT hỗ trợ:</strong>
                  <div>{facility.soDienThoaiHotro}</div>
                </div>
              )}
              
              <hr />
              
              <div className="mb-3">
                <strong>Lần bảo trì cuối:</strong>
                <div className="text-muted">
                  {facility.lanBaoTriCuoi ? formatDate(facility.lanBaoTriCuoi) : 'Chưa có'}
                </div>
              </div>
              
              <div className="mb-3">
                <strong>Bảo trì tiếp theo:</strong>
                <div className="text-muted">
                  {facility.baoTriTiepTheo ? formatDate(facility.baoTriTiepTheo) : 'Chưa lên lịch'}
                </div>
              </div>
              
              <div className="mb-3">
                <strong>Tổng chi phí bảo trì:</strong>
                <div className="fw-bold text-primary">
                  {formatCurrency(facility.chiPhiBaoTri || 0)}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Form ghi nhận bảo trì */}
        <Col lg={8}>
          <Form onSubmit={handleSubmit}>
            <Card className="shadow-lg">
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0">
                  <FaCalendarAlt className="me-2" />
                  Ghi Nhận Hoạt Động Bảo Trì
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Ngày bảo trì <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="date"
                        name="ngayBaoTri"
                        value={formData.ngayBaoTri}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Chi phí bảo trì (VND)</Form.Label>
                      <Form.Control
                        type="number"
                        name="chiPhiBaoTri"
                        value={formData.chiPhiBaoTri}
                        onChange={handleInputChange}
                        min="0"
                        placeholder="Nhập chi phí bảo trì..."
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Lịch bảo trì tiếp theo</Form.Label>
                      <Form.Control
                        type="date"
                        name="baoTriTiepTheo"
                        value={formData.baoTriTiepTheo}
                        onChange={handleInputChange}
                      />
                      <Form.Text className="text-muted">
                        Gợi ý: 3 tháng từ hôm nay
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Trạng thái sau bảo trì</Form.Label>
                      <Form.Select
                        name="trangThaiSauBaoTri"
                        value={formData.trangThaiSauBaoTri}
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

                <Form.Group className="mb-4">
                  <Form.Label>Ghi chú bảo trì</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="ghiChuBaoTri"
                    value={formData.ghiChuBaoTri}
                    onChange={handleInputChange}
                    placeholder="Mô tả công việc bảo trì đã thực hiện, tình trạng sau bảo trì, các vấn đề phát hiện..."
                  />
                  <Form.Text className="text-muted">
                    Ghi chú này sẽ được thêm vào lịch sử bảo trì của tiện ích
                  </Form.Text>
                </Form.Group>

                <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                  <Button
                    as={Link}
                    to="/facilities"
                    variant="outline-secondary"
                    disabled={loading}
                    className="me-md-2"
                  >
                    Hủy Bỏ
                  </Button>
                  <Button
                    type="submit"
                    variant="success"
                    disabled={loading}
                    className="gradient-btn-success"
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
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <FaSave className="me-2" />
                        Ghi Nhận Bảo Trì
                      </>
                    )}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Form>
        </Col>
      </Row>

      {/* Lịch sử bảo trì (nếu có) */}
      {facility.ghiChu && (
        <Card className="mt-4 shadow-lg">
          <Card.Header className="bg-warning text-dark">
            <h5 className="mb-0">Lịch Sử Ghi Chú</h5>
          </Card.Header>
          <Card.Body>
            <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.9em' }}>
              {facility.ghiChu}
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default FacilityMaintenanceScreen; 