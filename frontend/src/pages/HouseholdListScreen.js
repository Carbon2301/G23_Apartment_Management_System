import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Table, Button, Row, Col, Form, InputGroup, Card, Modal, ProgressBar, Badge, Alert } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate } from 'react-router-dom';
import Message from '../components/common/Message';
import Loader from '../components/common/Loader';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';

const HouseholdListScreen = () => {
  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  
  // Advanced filtering and sorting states
  const [advancedFilters, setAdvancedFilters] = useState({
    building: '',
    floor: '',
    status: 'all',
    residents: 'all',
    dateRange: { start: '', end: '' },
    sortBy: 'apartmentNumber',
    sortOrder: 'asc',
    showInactive: false
  });
  
  // Pagination and view states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [viewMode, setViewMode] = useState('table'); // table, card, grid
  const [selectedHouseholds, setSelectedHouseholds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  
  // Statistics and analytics states
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byBuilding: {},
    byFloor: {},
    monthlyTrends: []
  });
  
  // Export and import states
  const [exportFormat, setExportFormat] = useState('excel');
  const [exportProgress, setExportProgress] = useState(0);
  const [importData, setImportData] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // UI interaction states
  const [showStatistics, setShowStatistics] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext);
  
  useEffect(() => {
    fetchHouseholds();
    fetchStatistics();
    loadUserPreferences();
    trackPageView();
  }, [userInfo]);

  // Advanced useEffect for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchHouseholds(true); // silent refresh
        updateRecentActivities();
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Filter and sort effect
  useEffect(() => {
    applyFiltersAndSort();
    calculateStatistics();
  }, [households, advancedFilters, searchTerm]);

  // Keyboard shortcuts effect
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            e.preventDefault();
            navigate('/households/create');
            break;
          case 'f':
            e.preventDefault();
            setShowAdvancedSearch(!showAdvancedSearch);
            break;
          case 'e':
            e.preventDefault();
            handleExportData();
            break;
          case 'r':
            e.preventDefault();
            fetchHouseholds();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [showAdvancedSearch, navigate]);
  
  const fetchHouseholds = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      // Add query parameters for advanced filtering
      const queryParams = new URLSearchParams();
      if (advancedFilters.building) queryParams.append('building', advancedFilters.building);
      if (advancedFilters.floor) queryParams.append('floor', advancedFilters.floor);
      if (advancedFilters.status !== 'all') queryParams.append('status', advancedFilters.status);
      if (advancedFilters.dateRange.start) queryParams.append('startDate', advancedFilters.dateRange.start);
      if (advancedFilters.dateRange.end) queryParams.append('endDate', advancedFilters.dateRange.end);
      
      const url = `/api/households${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const { data } = await axios.get(url, config);
      
      setHouseholds(data.households || data);
      
      // Update statistics if data includes them
      if (data.statistics) {
        setStatistics(data.statistics);
      }
      
      // Show success notification for refresh
      if (silent) {
        addNotification('Dữ liệu đã được cập nhật', 'success', 2000);
      }
      
      setLoading(false);
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Không thể tải danh sách hộ gia đình';
      
      setError(errorMessage);
      addNotification(errorMessage, 'error');
      setLoading(false);
      
      // Log error for debugging
      console.error('Fetch households error:', error);
    }
  };

  // Advanced statistics fetching
  const fetchStatistics = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const { data } = await axios.get('/api/households/statistics', config);
      setStatistics(data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  // User preferences management
  const loadUserPreferences = () => {
    const savedPrefs = localStorage.getItem('householdListPreferences');
    if (savedPrefs) {
      const prefs = JSON.parse(savedPrefs);
      setViewMode(prefs.viewMode || 'table');
      setItemsPerPage(prefs.itemsPerPage || 20);
      setAdvancedFilters(prev => ({ ...prev, ...prefs.filters }));
    }
  };

  const saveUserPreferences = () => {
    const prefs = {
      viewMode,
      itemsPerPage,
      filters: advancedFilters
    };
    localStorage.setItem('householdListPreferences', JSON.stringify(prefs));
  };

  // Page tracking for analytics
  const trackPageView = () => {
    // Analytics tracking code would go here
    console.log('Household list page viewed at:', new Date().toISOString());
  };

  // Recent activities management
  const updateRecentActivities = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const { data } = await axios.get('/api/households/recent-activities', config);
      setRecentActivities(data.slice(0, 10)); // Keep only latest 10
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
    }
  };

  // Notification system
  const addNotification = (message, type = 'info', duration = 5000) => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(notification.id);
      }, duration);
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  
  const deleteHandler = async (id) => {
    setDeleteId(id);
    setShowConfirm(true);
  };
  
  const handleConfirmDelete = async () => {
    setShowConfirm(false);
    if (!deleteId) return;
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      // Get household info before deletion for logging
      const householdToDelete = households.find(h => h._id === deleteId);
      
      await axios.delete(`/api/households/${deleteId}`, config);
      
      // Log the deletion activity
      logActivity('DELETE_HOUSEHOLD', {
        householdId: deleteId,
        apartmentNumber: householdToDelete?.apartmentNumber,
        timestamp: new Date().toISOString()
      });
      
      // Show success notification
      addNotification(
        `Đã xóa hộ gia đình ${householdToDelete?.apartmentNumber || 'thành công'}`, 
        'success'
      );
      
      fetchHouseholds();
    } catch (error) {
      const errorMessage = error.response && error.response.data.message
        ? error.response.data.message
        : 'Không thể xóa hộ gia đình';
      
      setError(errorMessage);
      addNotification(errorMessage, 'error');
      setLoading(false);
    }
    setDeleteId(null);
  };

  // Advanced filtering and sorting logic
  const applyFiltersAndSort = () => {
    let filtered = [...households];
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(household =>
        household.apartmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        household.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        household.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        household.phone?.includes(searchTerm)
      );
    }
    
    // Apply advanced filters
    if (advancedFilters.building) {
      filtered = filtered.filter(h => h.building === advancedFilters.building);
    }
    
    if (advancedFilters.floor) {
      filtered = filtered.filter(h => h.floor === advancedFilters.floor);
    }
    
    if (advancedFilters.status !== 'all') {
      const isActive = advancedFilters.status === 'active';
      filtered = filtered.filter(h => h.active === isActive);
    }
    
    if (advancedFilters.residents !== 'all') {
      const residentCount = parseInt(advancedFilters.residents);
      filtered = filtered.filter(h => {
        const count = h.residents?.length || 0;
        switch (advancedFilters.residents) {
          case '1': return count === 1;
          case '2-3': return count >= 2 && count <= 3;
          case '4-5': return count >= 4 && count <= 5;
          case '6+': return count >= 6;
          default: return true;
        }
      });
    }
    
    // Apply date range filter
    if (advancedFilters.dateRange.start || advancedFilters.dateRange.end) {
      filtered = filtered.filter(h => {
        const createdDate = new Date(h.createdAt);
        const startDate = advancedFilters.dateRange.start ? new Date(advancedFilters.dateRange.start) : null;
        const endDate = advancedFilters.dateRange.end ? new Date(advancedFilters.dateRange.end) : null;
        
        if (startDate && createdDate < startDate) return false;
        if (endDate && createdDate > endDate) return false;
        return true;
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (advancedFilters.sortBy) {
        case 'apartmentNumber':
          aValue = a.apartmentNumber || '';
          bValue = b.apartmentNumber || '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'residentsCount':
          aValue = a.residents?.length || 0;
          bValue = b.residents?.length || 0;
          break;
        case 'building':
          aValue = a.building || '';
          bValue = b.building || '';
          break;
        default:
          aValue = a.apartmentNumber || '';
          bValue = b.apartmentNumber || '';
      }
      
      if (advancedFilters.sortOrder === 'desc') {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });
    
    setFilteredHouseholds(filtered);
  };

  // Calculate comprehensive statistics
  const calculateStatistics = () => {
    const stats = {
      total: households.length,
      active: households.filter(h => h.active).length,
      inactive: households.filter(h => !h.active).length,
      byBuilding: {},
      byFloor: {},
      monthlyTrends: []
    };
    
    // Building distribution
    households.forEach(h => {
      const building = h.building || 'Unknown';
      stats.byBuilding[building] = (stats.byBuilding[building] || 0) + 1;
    });
    
    // Floor distribution
    households.forEach(h => {
      const floor = h.floor || 'Unknown';
      stats.byFloor[floor] = (stats.byFloor[floor] || 0) + 1;
    });
    
    // Monthly trends (last 12 months)
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthlyCount = households.filter(h => {
        const createdDate = new Date(h.createdAt);
        const createdMonthKey = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
        return createdMonthKey === monthKey;
      }).length;
      
      stats.monthlyTrends.push({
        month: date.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' }),
        count: monthlyCount
      });
    }
    
    setStatistics(stats);
  };

  // Activity logging
  const logActivity = (action, details) => {
    const activity = {
      id: Date.now(),
      action,
      details,
      user: userInfo?.name || 'Unknown',
      timestamp: new Date().toISOString()
    };
    
    setRecentActivities(prev => [activity, ...prev.slice(0, 9)]);
    
    // Also save to localStorage for persistence
    const savedActivities = JSON.parse(localStorage.getItem('householdActivities') || '[]');
    savedActivities.unshift(activity);
    localStorage.setItem('householdActivities', JSON.stringify(savedActivities.slice(0, 50)));
  };
  
  // Enhanced filtering with caching and performance optimization
  const [filteredHouseholds, setFilteredHouseholds] = useState([]);
  const [filterCache, setFilterCache] = useState(new Map());
  
  // Bulk operations handling
  const handleSelectHousehold = (householdId) => {
    setSelectedHouseholds(prev => {
      if (prev.includes(householdId)) {
        return prev.filter(id => id !== householdId);
      } else {
        return [...prev, householdId];
      }
    });
  };

  const handleSelectAllHouseholds = () => {
    if (selectedHouseholds.length === filteredHouseholds.length) {
      setSelectedHouseholds([]);
    } else {
      setSelectedHouseholds(filteredHouseholds.map(h => h._id));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedHouseholds.length === 0) return;
    
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          'Content-Type': 'application/json'
        },
      };

      switch (bulkAction) {
        case 'activate':
          await axios.patch('/api/households/bulk-update', {
            householdIds: selectedHouseholds,
            updates: { active: true }
          }, config);
          addNotification(`Đã kích hoạt ${selectedHouseholds.length} hộ gia đình`, 'success');
          break;
          
        case 'deactivate':
          await axios.patch('/api/households/bulk-update', {
            householdIds: selectedHouseholds,
            updates: { active: false }
          }, config);
          addNotification(`Đã vô hiệu hóa ${selectedHouseholds.length} hộ gia đình`, 'success');
          break;
          
        case 'export':
          await handleExportSelected();
          break;
          
        case 'delete':
          if (window.confirm(`Bạn có chắc muốn xóa ${selectedHouseholds.length} hộ gia đình?`)) {
            await axios.delete('/api/households/bulk-delete', {
              data: { householdIds: selectedHouseholds },
              ...config
            });
            addNotification(`Đã xóa ${selectedHouseholds.length} hộ gia đình`, 'success');
          }
          break;
      }
      
      fetchHouseholds();
      setSelectedHouseholds([]);
      setBulkAction('');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi thực hiện thao tác';
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Export functionality
  const handleExportData = async (format = 'excel') => {
    try {
      setExportProgress(0);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setExportProgress(progress);
        }
      };

      const { data } = await axios.get(`/api/households/export?format=${format}`, config);
      
      const blob = new Blob([data], {
        type: format === 'excel' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `households_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      link.click();
      
      window.URL.revokeObjectURL(url);
      addNotification('Xuất dữ liệu thành công', 'success');
      
      setExportProgress(0);
    } catch (error) {
      addNotification('Lỗi khi xuất dữ liệu', 'error');
      setExportProgress(0);
    }
  };

  const handleExportSelected = async () => {
    if (selectedHouseholds.length === 0) return;
    
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          'Content-Type': 'application/json'
        },
        responseType: 'blob'
      };

      const { data } = await axios.post('/api/households/export-selected', {
        householdIds: selectedHouseholds,
        format: exportFormat
      }, config);
      
      const blob = new Blob([data], {
        type: exportFormat === 'excel' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `selected_households_${new Date().toISOString().split('T')[0]}.${exportFormat === 'excel' ? 'xlsx' : 'csv'}`;
      link.click();
      
      window.URL.revokeObjectURL(url);
      addNotification(`Đã xuất ${selectedHouseholds.length} hộ gia đình`, 'success');
    } catch (error) {
      addNotification('Lỗi khi xuất dữ liệu đã chọn', 'error');
    }
  };

  // Import functionality
  const handleImportData = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      const { data } = await axios.post('/api/households/import', formData, config);
      
      setImportData(data.preview || []);
      setShowImportModal(true);
      addNotification(`Đã đọc ${data.preview?.length || 0} bản ghi từ file`, 'info');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Lỗi khi đọc file import';
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmImport = async () => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          'Content-Type': 'application/json'
        }
      };

      const { data } = await axios.post('/api/households/import/confirm', {
        data: importData
      }, config);
      
      addNotification(`Đã import thành công ${data.imported} hộ gia đình`, 'success');
      setShowImportModal(false);
      setImportData([]);
      fetchHouseholds();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Lỗi khi import dữ liệu';
      addNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredHouseholds.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredHouseholds.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    saveUserPreferences();
  };

  // Performance optimization - debounced search
  const debouncedSearch = useCallback(
    debounce((term) => {
      // This would trigger the search
      applyFiltersAndSort();
    }, 300),
    [households, advancedFilters]
  );

  // Utility function for debouncing
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      minHeight: '100vh',
      padding: '20px'
    }}>
      {/* Hero Section */}
      <div className="mb-5">
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(15px)',
          borderRadius: '25px',
          padding: '30px',
          border: '1px solid rgba(255,255,255,0.25)',
          boxShadow: '0 8px 32px rgba(255,255,255,0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background Pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '150px',
            height: '150px',
            background: 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
            borderRadius: '50%',
            transform: 'translate(30%, -30%)'
          }}></div>
          
          <Row className="align-items-center">
            <Col lg={8}>
              <div className="d-flex align-items-center mb-3">
                <div style={{
                  background: 'linear-gradient(135deg,rgb(11, 11, 11) 0%, #00f2fe 100%)',
                  borderRadius: '20px',
                  padding: '20px',
                  marginRight: '20px',
                  boxShadow: '0 10px 30px rgba(79, 172, 254, 0.3)'
                }}>
                  <i className="bi bi-buildings" style={{ fontSize: '2.5rem', color: 'white' }}></i>
                </div>
                <div>
                  <h1 className="mb-2 fw-bold text-white" style={{ fontSize: '2.5rem', textShadow: '2px 2px 8px rgba(0,0,0,0.3)' }}>
                    Quản Lý Hộ Gia Đình
                  </h1>
                  <p className="mb-0 text-white" style={{ fontSize: '16px', opacity: '0.9' }}>
                    <i className="bi bi-house-door me-2"></i>
                    Tổng cộng {filteredHouseholds.length} hộ gia đình
                    {selectedHouseholds.length > 0 && (
                      <span className="ms-3">
                        <i className="bi bi-check-square me-1"></i>
                        Đã chọn {selectedHouseholds.length}
                      </span>
                    )}
                  </p>
                  
                  {/* Real-time status indicators */}
                  <div className="d-flex gap-3 mt-2">
                    <div className="status-indicator">
                      <span className="badge bg-success bg-opacity-80">
                        <i className="bi bi-circle-fill me-1" style={{ fontSize: '8px' }}></i>
                        {statistics.active} Hoạt động
                      </span>
                    </div>
                    <div className="status-indicator">
                      <span className="badge bg-warning bg-opacity-80">
                        <i className="bi bi-circle-fill me-1" style={{ fontSize: '8px' }}></i>
                        {statistics.inactive} Không hoạt động
                      </span>
                    </div>
                    <div className="status-indicator">
                      <span className="badge bg-info bg-opacity-80">
                        <i className="bi bi-clock me-1"></i>
                        Cập nhật {new Date().toLocaleTimeString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
            
            <Col lg={4} className="text-end">
              <div className="d-flex flex-column align-items-end gap-2">
                {/* Main action button */}
                <Button 
                  className="btn-lg rounded-pill px-4 py-3 shadow-sm"
                  onClick={() => navigate('/households/create')}
                  style={{
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                    border: 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <i className="bi bi-plus-circle me-2"></i> Thêm Hộ Gia Đình
                </Button>
                
                {/* Quick action buttons */}
                <div className="d-flex gap-2">
                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={() => setShowStatistics(!showStatistics)}
                    title="Xem thống kê"
                  >
                    <i className="bi bi-graph-up"></i>
                  </Button>
                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={() => handleExportData(exportFormat)}
                    title="Xuất dữ liệu"
                    disabled={loading || exportProgress > 0}
                  >
                    {exportProgress > 0 ? (
                      <span>{exportProgress}%</span>
                    ) : (
                      <i className="bi bi-download"></i>
                    )}
                  </Button>
                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={() => document.getElementById('importFile').click()}
                    title="Import dữ liệu"
                  >
                    <i className="bi bi-upload"></i>
                  </Button>
                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={() => fetchHouseholds()}
                    title="Làm mới (Ctrl+R)"
                    disabled={loading}
                  >
                    <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i>
                  </Button>
                </div>
                
                {/* Hidden file input for import */}
                <input
                  id="importFile"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      handleImportData(e.target.files[0]);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </Col>
          </Row>
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-4">
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(15px)',
          borderRadius: '20px',
          padding: '25px',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}>
          <Row className="align-items-center">
            <Col md={8}>
              <div className="position-relative">
                <Form.Control
                  type="text"
                  placeholder="🔍 Tìm kiếm theo số căn hộ hoặc địa chỉ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    borderRadius: '15px',
                    border: '2px solid rgba(102, 126, 234, 0.2)',
                    padding: '12px 20px',
                    fontSize: '16px',
                    boxShadow: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(102, 126, 234, 0.2)'}
                />
                {searchTerm && (
                  <Button 
                    variant="light"
                    className="position-absolute end-0 top-50 translate-middle-y me-2 rounded-circle"
                    style={{ 
                      width: '35px', 
                      height: '35px',
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    onClick={() => setSearchTerm('')}
                  >
                    <i className="bi bi-x"></i>
                  </Button>
                )}
              </div>
            </Col>
            <Col md={4} className="text-md-end mt-3 mt-md-0">
              <div className="d-flex align-items-center justify-content-md-end">
                <span className="text-muted me-3">
                  <i className="bi bi-funnel me-1"></i>
                  Kết quả: <strong>{filteredHouseholds.length}</strong>
                </span>
              </div>
            </Col>
          </Row>
        </div>
      </div>
      
      {/* Notifications Toast Container */}
      <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1055 }}>
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`toast show mb-2 border-0 shadow-lg`}
            style={{
              background: notification.type === 'success' ? '#d4edda' : 
                        notification.type === 'error' ? '#f8d7da' : '#d1ecf1',
              color: notification.type === 'success' ? '#155724' : 
                     notification.type === 'error' ? '#721c24' : '#0c5460'
            }}
          >
            <div className="toast-header border-0 bg-transparent">
              <i className={`bi bi-${notification.type === 'success' ? 'check-circle' : 
                                  notification.type === 'error' ? 'exclamation-triangle' : 'info-circle'} me-2`}></i>
              <strong className="me-auto">
                {notification.type === 'success' ? 'Thành công' : 
                 notification.type === 'error' ? 'Lỗi' : 'Thông báo'}
              </strong>
              <small>{notification.timestamp.toLocaleTimeString('vi-VN')}</small>
              <button
                type="button"
                className="btn-close"
                onClick={() => removeNotification(notification.id)}
              ></button>
            </div>
            <div className="toast-body">
              {notification.message}
            </div>
          </div>
        ))}
      </div>

      {/* Statistics Dashboard - Collapsible */}
      {showStatistics && (
        <div className="statistics-dashboard mb-4">
          <Card className="shadow-lg border-0">
            <Card.Header className="bg-primary text-white">
              <Row className="align-items-center">
                <Col>
                  <h5 className="mb-0">
                    <i className="bi bi-graph-up me-2"></i>
                    Dashboard Thống Kê
                  </h5>
                </Col>
                <Col xs="auto">
                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={() => setShowStatistics(false)}
                  >
                    <i className="bi bi-x"></i>
                  </Button>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              <Row className="mb-4">
                {Object.entries(statistics.byBuilding).map(([building, count]) => (
                  <Col md={3} key={building} className="mb-3">
                    <div className="stat-card bg-light p-3 rounded">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h4 className="mb-0">{count}</h4>
                          <small className="text-muted">Tòa {building}</small>
                        </div>
                        <i className="bi bi-building text-primary" style={{ fontSize: '2rem', opacity: 0.7 }}></i>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
              
              {/* Monthly trends chart */}
              <Row>
                <Col>
                  <h6>Xu hướng 12 tháng gần nhất</h6>
                  <div className="trend-chart d-flex justify-content-between align-items-end" style={{ height: '200px' }}>
                    {statistics.monthlyTrends.map((trend, index) => (
                      <div key={index} className="trend-bar-container text-center" style={{ flex: 1 }}>
                        <div
                          className="trend-bar bg-primary rounded-top"
                          style={{
                            height: `${Math.max(trend.count * 10, 5)}px`,
                            width: '80%',
                            margin: '0 auto',
                            marginBottom: '8px'
                          }}
                          title={`${trend.month}: ${trend.count} hộ gia đình`}
                        ></div>
                        <small className="text-muted">{trend.month}</small>
                        <br />
                        <small className="fw-bold">{trend.count}</small>
                      </div>
                    ))}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Advanced Search Panel */}
      {showAdvancedSearch && (
        <div className="advanced-search-panel mb-4">
          <Card className="border-info">
            <Card.Header className="bg-info text-white">
              <Row className="align-items-center">
                <Col>
                  <h6 className="mb-0">
                    <i className="bi bi-search me-2"></i>
                    Tìm kiếm nâng cao
                  </h6>
                </Col>
                <Col xs="auto">
                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={() => setShowAdvancedSearch(false)}
                  >
                    <i className="bi bi-x"></i>
                  </Button>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col lg={3} md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tòa nhà</Form.Label>
                    <Form.Select
                      value={advancedFilters.building}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, building: e.target.value }))}
                    >
                      <option value="">Tất cả tòa</option>
                      {Object.keys(statistics.byBuilding).map(building => (
                        <option key={building} value={building}>Tòa {building}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col lg={3} md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Trạng thái</Form.Label>
                    <Form.Select
                      value={advancedFilters.status}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="all">Tất cả</option>
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Không hoạt động</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col lg={3} md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Số cư dân</Form.Label>
                    <Form.Select
                      value={advancedFilters.residents}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, residents: e.target.value }))}
                    >
                      <option value="all">Tất cả</option>
                      <option value="1">1 người</option>
                      <option value="2-3">2-3 người</option>
                      <option value="4-5">4-5 người</option>
                      <option value="6+">6+ người</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                
                <Col lg={3} md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Sắp xếp theo</Form.Label>
                    <Form.Select
                      value={advancedFilters.sortBy}
                      onChange={(e) => setAdvancedFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                    >
                      <option value="apartmentNumber">Số căn hộ</option>
                      <option value="createdAt">Ngày tạo</option>
                      <option value="residentsCount">Số cư dân</option>
                      <option value="building">Tòa nhà</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              
              <div className="d-flex justify-content-end gap-2">
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    setAdvancedFilters({
                      building: '',
                      floor: '',
                      status: 'all',
                      residents: 'all',
                      dateRange: { start: '', end: '' },
                      sortBy: 'apartmentNumber',
                      sortOrder: 'asc',
                      showInactive: false
                    });
                  }}
                >
                  Đặt lại
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    applyFiltersAndSort();
                    saveUserPreferences();
                  }}
                >
                  Áp dụng bộ lọc
                </Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedHouseholds.length > 0 && (
        <div className="bulk-actions-bar mb-4">
          <Card className="border-warning">
            <Card.Body className="py-2">
              <Row className="align-items-center">
                <Col>
                  <span className="fw-medium">
                    <i className="bi bi-check-square me-2"></i>
                    Đã chọn {selectedHouseholds.length} hộ gia đình
                  </span>
                </Col>
                <Col xs="auto">
                  <div className="d-flex gap-2 align-items-center">
                    <Form.Select
                      size="sm"
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                      style={{ width: 'auto' }}
                    >
                      <option value="">Chọn thao tác...</option>
                      <option value="activate">Kích hoạt</option>
                      <option value="deactivate">Vô hiệu hóa</option>
                      <option value="export">Xuất dữ liệu</option>
                      <option value="delete">Xóa</option>
                    </Form.Select>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleBulkAction}
                      disabled={!bulkAction || loading}
                    >
                      Thực hiện
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => setSelectedHouseholds([])}
                    >
                      Bỏ chọn
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Main Content */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <div className="mt-3">
            <p className="text-muted">Đang tải dữ liệu hộ gia đình...</p>
            {exportProgress > 0 && (
              <div className="mt-2">
                <div className="progress mx-auto" style={{ width: '200px' }}>
                  <div 
                    className="progress-bar" 
                    style={{ width: `${exportProgress}%` }}
                  >
                    {exportProgress}%
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : error ? (
        <div className="error-container">
          <Message variant="danger">
            <div className="d-flex align-items-center">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
            <div className="mt-2">
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => {
                  setError('');
                  fetchHouseholds();
                }}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Thử lại
              </Button>
            </div>
          </Message>
        </div>
      ) : (
        <div style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(15px)',
          borderRadius: '20px',
          padding: '0',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          {/* Table Header */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px 30px',
            color: 'white'
          }}>
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0 fw-bold d-flex align-items-center">
                <i className="bi bi-table me-3" style={{ fontSize: '1.5rem' }}></i>
                Danh Sách Hộ Gia Đình
              </h4>
              <span className="badge bg-white text-dark px-3 py-2">
                {filteredHouseholds.length} hộ
              </span>
            </div>
          </div>

          {/* Table Content */}
          <div className="p-0">
            {filteredHouseholds.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-house-x display-1 text-muted opacity-50"></i>
                <h5 className="mt-3 text-muted">Không tìm thấy hộ gia đình nào</h5>
                <p className="text-muted">Thử điều chỉnh bộ lọc tìm kiếm của bạn</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead style={{ background: 'rgba(102, 126, 234, 0.1)' }}>
                    <tr>
                      <th className="fw-bold text-center py-3 border-0" style={{ color: '#2d3748', width: '50px' }}>
                        <Form.Check
                          type="checkbox"
                          checked={selectedHouseholds.length === filteredHouseholds.length && filteredHouseholds.length > 0}
                          onChange={handleSelectAllHouseholds}
                        />
                      </th>
                      <th className="fw-bold text-center py-3 border-0" style={{ color: '#2d3748' }}>
                        <i className="bi bi-building me-2"></i>Căn Hộ
                      </th>
                      <th className="fw-bold py-3 border-0" style={{ color: '#2d3748' }}>
                        <i className="bi bi-geo-alt me-2"></i>Địa Chỉ
                      </th>
                      <th className="fw-bold text-center py-3 border-0" style={{ color: '#2d3748' }}>
                        <i className="bi bi-ruler-combined me-2"></i>Diện Tích
                      </th>
                      <th className="fw-bold py-3 border-0" style={{ color: '#2d3748' }}>
                        <i className="bi bi-person-badge me-2"></i>Chủ Hộ
                      </th>
                      <th className="fw-bold text-center py-3 border-0" style={{ color: '#2d3748', minWidth: '130px' }}>
                        <i className="bi bi-activity me-2"></i>Trạng Thái
                      </th>
                      <th className="fw-bold text-center py-3 border-0" style={{ color: '#2d3748' }}>
                        <i className="bi bi-gear me-2"></i>Thao Tác
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPaginatedData().map((household, index) => (
                      <tr 
                        key={household._id} 
                        style={{
                          transition: 'all 0.3s ease',
                          borderBottom: '1px solid rgba(0,0,0,0.05)',
                          background: selectedHouseholds.includes(household._id) ? 'rgba(102, 126, 234, 0.1)' : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedHouseholds.includes(household._id)) {
                            e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedHouseholds.includes(household._id)) {
                            e.currentTarget.style.background = 'transparent';
                          } else {
                            e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                          }
                        }}
                      >
                        <td className="text-center align-middle py-3">
                          <Form.Check
                            type="checkbox"
                            checked={selectedHouseholds.includes(household._id)}
                            onChange={() => handleSelectHousehold(household._id)}
                          />
                        </td>
                        <td className="text-center align-middle py-3">
                          <div style={{
                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            borderRadius: '12px',
                            padding: '8px 16px',
                            display: 'inline-block',
                            color: 'white',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)'
                          }}>
                            <i className="bi bi-house-door me-2"></i>
                            {household.apartmentNumber}
                          </div>
                        </td>
                        <td className="align-middle py-3">
                          <div className="d-flex align-items-center">
                            <i className="bi bi-geo-alt text-muted me-2"></i>
                            <span className="fw-medium">{household.address}</span>
                          </div>
                        </td>
                        <td className="text-center align-middle py-3">
                          <div style={{
                            background: 'linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%)',
                            borderRadius: '10px',
                            padding: '6px 12px',
                            display: 'inline-block',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            boxShadow: '0 3px 10px rgba(255, 154, 86, 0.3)'
                          }}>
                            <i className="bi bi-aspect-ratio me-1"></i>
                            {household.area ? `${household.area} m²` : 'N/A'}
                          </div>
                        </td>
                        <td className="align-middle py-3">
                          {household.householdHead ? (
                            <div className="d-flex align-items-center">
                              <div style={{
                                width: '40px',
                                height: '40px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '12px',
                                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                                position: 'relative'
                              }}>
                                <i className="bi bi-person-fill text-white" style={{ fontSize: '1.1rem' }}></i>
                                <div style={{
                                  position: 'absolute',
                                  top: '-2px',
                                  right: '-2px',
                                  width: '16px',
                                  height: '16px',
                                  background: 'linear-gradient(135deg, #ffd700 0%, #ffb347 100%)',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '2px solid white'
                                }}>
                                  <i className="bi bi-crown-fill" style={{ fontSize: '8px', color: '#fff' }}></i>
                                </div>
                              </div>
                              <div>
                                <div className="fw-semibold text-dark">{household.householdHead.fullName}</div>
                                <small className="text-muted">
                                  <i className="bi bi-shield-check me-1"></i>Chủ hộ
                                </small>
                              </div>
                            </div>
                          ) : (
                            <div className="d-flex align-items-center">
                              <div style={{
                                width: '40px',
                                height: '40px',
                                background: 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '12px',
                                boxShadow: '0 3px 8px rgba(149, 165, 166, 0.3)'
                              }}>
                                <i className="bi bi-person-dash text-white" style={{ fontSize: '1.1rem' }}></i>
                              </div>
                              <div>
                                <div className="text-muted fw-medium">Chưa có chủ hộ</div>
                                <small className="text-warning">
                                  <i className="bi bi-exclamation-triangle me-1"></i>Cần chỉ định
                                </small>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="text-center align-middle py-3">
                          {household.active ? (
                            <span style={{
                              background: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)',
                              color: 'white',
                              padding: '8px 20px',
                              borderRadius: '25px',
                              fontSize: '13px',
                              fontWeight: '600',
                              boxShadow: '0 3px 10px rgba(0, 184, 148, 0.3)',
                              display: 'inline-block',
                              minWidth: '110px',
                              whiteSpace: 'nowrap'
                            }}>
                              <i className="bi bi-check-circle me-1"></i>Hoạt Động
                            </span>
                          ) : (
                            <span style={{
                              background: 'linear-gradient(135deg, #e17055 0%, #d63031 100%)',
                              color: 'white',
                              padding: '8px 20px',
                              borderRadius: '25px',
                              fontSize: '13px',
                              fontWeight: '600',
                              boxShadow: '0 3px 10px rgba(225, 112, 85, 0.3)',
                              display: 'inline-block',
                              minWidth: '110px',
                              whiteSpace: 'nowrap'
                            }}>
                              <i className="bi bi-x-circle me-1"></i>Tạm Ngưng
                            </span>
                          )}
                        </td>
                        <td className="text-center align-middle py-3">
                          <div className="d-flex justify-content-center gap-2">
                            <LinkContainer to={`/households/${household._id}`}>
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                className="rounded-pill px-3"
                                style={{ 
                                  borderWidth: '2px',
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                <i className="bi bi-eye me-1"></i>Xem
                              </Button>
                            </LinkContainer>
                            <LinkContainer to={`/households/${household._id}/edit`}>
                              <Button 
                                variant="outline-success" 
                                size="sm"
                                className="rounded-pill px-3"
                                style={{ 
                                  borderWidth: '2px',
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                <i className="bi bi-pencil me-1"></i>Sửa
                              </Button>
                            </LinkContainer>
                            {userInfo.role === 'admin' && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="rounded-pill px-3"
                                onClick={() => deleteHandler(household._id)}
                                style={{ 
                                  borderWidth: '2px',
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                <i className="bi bi-trash me-1"></i>Xóa
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Pagination Component */}
      {filteredHouseholds.length > itemsPerPage && (
        <div className="pagination-container mt-4">
          <Card className="border-0 shadow-sm">
            <Card.Body className="py-3">
              <Row className="align-items-center">
                <Col md={6}>
                  <div className="d-flex align-items-center gap-3">
                    <span className="text-muted">Hiển thị:</span>
                    <Form.Select
                      size="sm"
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(parseInt(e.target.value));
                        setCurrentPage(1);
                        saveUserPreferences();
                      }}
                      style={{ width: 'auto' }}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </Form.Select>
                    <span className="text-muted">
                      Trang {currentPage} / {totalPages} 
                      ({((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredHouseholds.length)} của {filteredHouseholds.length})
                    </span>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="d-flex justify-content-end">
                    <div className="pagination-controls d-flex align-items-center gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(1)}
                      >
                        <i className="bi bi-chevron-double-left"></i>
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                      >
                        <i className="bi bi-chevron-left"></i>
                      </Button>
                      
                      {/* Page numbers */}
                      {(() => {
                        const pages = [];
                        const startPage = Math.max(1, currentPage - 2);
                        const endPage = Math.min(totalPages, currentPage + 2);
                        
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <Button
                              key={i}
                              variant={i === currentPage ? "primary" : "outline-primary"}
                              size="sm"
                              onClick={() => handlePageChange(i)}
                              style={{ minWidth: '35px' }}
                            >
                              {i}
                            </Button>
                          );
                        }
                        return pages;
                      })()}
                      
                      <Button
                        variant="outline-primary"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        <i className="bi bi-chevron-right"></i>
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(totalPages)}
                      >
                        <i className="bi bi-chevron-double-right"></i>
                      </Button>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Import Data Modal */}
      <Modal
        show={showImportModal}
        onHide={() => setShowImportModal(false)}
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-upload me-2"></i>
            Xem trước dữ liệu Import
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <i className="bi bi-info-circle me-2"></i>
            Kiểm tra dữ liệu bên dưới trước khi xác nhận import. Dữ liệu không hợp lệ sẽ được bỏ qua.
          </Alert>
          
          {importData.length > 0 ? (
            <>
              <div className="mb-3">
                <h6>Tổng quan:</h6>
                <div className="d-flex gap-3">
                  <Badge bg="primary">Tổng cộng: {importData.length}</Badge>
                  <Badge bg="success">Hợp lệ: {importData.filter(item => item.valid).length}</Badge>
                  <Badge bg="warning">Không hợp lệ: {importData.filter(item => !item.valid).length}</Badge>
                </div>
              </div>
              
              <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table striped bordered hover size="sm">
                  <thead className="table-dark sticky-top">
                    <tr>
                      <th>#</th>
                      <th>Căn hộ</th>
                      <th>Địa chỉ</th>
                      <th>Diện tích</th>
                      <th>Trạng thái</th>
                      <th>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importData.map((item, index) => (
                      <tr key={index} className={!item.valid ? 'table-danger' : ''}>
                        <td>{index + 1}</td>
                        <td>{item.apartmentNumber}</td>
                        <td>{item.address}</td>
                        <td>{item.area ? `${item.area} m²` : 'N/A'}</td>
                        <td>
                          {item.valid ? (
                            <Badge bg="success">Hợp lệ</Badge>
                          ) : (
                            <Badge bg="danger">Lỗi</Badge>
                          )}
                        </td>
                        <td>
                          {item.errors ? (
                            <small className="text-danger">{item.errors.join(', ')}</small>
                          ) : (
                            <small className="text-success">OK</small>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <i className="bi bi-file-earmark-x display-4 text-muted"></i>
              <p className="mt-2 text-muted">Không có dữ liệu để hiển thị</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowImportModal(false)}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={confirmImport}
            disabled={importData.filter(item => item.valid).length === 0 || loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Đang import...
              </>
            ) : (
              <>
                <i className="bi bi-check me-2"></i>
                Xác nhận Import ({importData.filter(item => item.valid).length} bản ghi)
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Recent Activities Sidebar */}
      {recentActivities.length > 0 && (
        <div 
          className="position-fixed"
          style={{
            top: '100px',
            right: '20px',
            width: '300px',
            zIndex: 1000,
            maxHeight: '70vh',
            overflowY: 'auto'
          }}
        >
          <Card className="shadow-lg border-0">
            <Card.Header className="bg-info text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <i className="bi bi-clock-history me-2"></i>
                  Hoạt động gần đây
                </h6>
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={() => setRecentActivities([])}
                >
                  <i className="bi bi-x"></i>
                </Button>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {recentActivities.map((activity, index) => (
                <div 
                  key={activity.id}
                  className={`p-3 border-bottom ${index === recentActivities.length - 1 ? 'border-0' : ''}`}
                >
                  <div className="d-flex align-items-start">
                    <div 
                      className="rounded-circle me-3 d-flex align-items-center justify-content-center"
                      style={{
                        width: '32px',
                        height: '32px',
                        background: activity.action === 'DELETE_HOUSEHOLD' ? '#dc3545' : '#28a745',
                        color: 'white',
                        fontSize: '12px'
                      }}
                    >
                      <i className={`bi bi-${activity.action === 'DELETE_HOUSEHOLD' ? 'trash' : 'plus'}`}></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="fw-medium" style={{ fontSize: '14px' }}>
                        {activity.action === 'DELETE_HOUSEHOLD' ? 'Xóa hộ gia đình' : 'Thêm hộ gia đình'}
                      </div>
                      <div className="text-muted" style={{ fontSize: '12px' }}>
                        {activity.user} • {new Date(activity.timestamp).toLocaleString('vi-VN')}
                      </div>
                      {activity.details.apartmentNumber && (
                        <div className="text-info" style={{ fontSize: '12px' }}>
                          Căn hộ: {activity.details.apartmentNumber}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Advanced Table Features */}
      <div className="advanced-table-controls mt-4">
        <Card className="border-0 shadow-sm">
          <Card.Body className="py-2">
            <Row className="align-items-center">
              <Col md={4}>
                <div className="d-flex align-items-center gap-2">
                  <Form.Check
                    type="checkbox"
                    id="selectAll"
                    checked={selectedHouseholds.length === filteredHouseholds.length && filteredHouseholds.length > 0}
                    onChange={handleSelectAllHouseholds}
                  />
                  <label htmlFor="selectAll" className="form-label mb-0">
                    Chọn tất cả
                  </label>
                </div>
              </Col>
              <Col md={4} className="text-center">
                <div className="d-flex align-items-center justify-content-center gap-3">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}
                  >
                    <i className={`bi bi-${viewMode === 'table' ? 'grid' : 'table'} me-1`}></i>
                    {viewMode === 'table' ? 'Dạng thẻ' : 'Dạng bảng'}
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                  >
                    <i className="bi bi-search me-1"></i>
                    Tìm kiếm nâng cao
                  </Button>
                </div>
              </Col>
              <Col md={4} className="text-end">
                <div className="d-flex align-items-center justify-content-end gap-2">
                  <Form.Select
                    size="sm"
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    style={{ width: 'auto' }}
                  >
                    <option value="excel">Excel</option>
                    <option value="csv">CSV</option>
                  </Form.Select>
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => handleExportData(exportFormat)}
                    disabled={loading}
                  >
                    <i className="bi bi-download me-1"></i>
                    Xuất
                  </Button>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>

      <ConfirmDeleteModal
        show={showConfirm}
        onHide={() => setShowConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa hộ gia đình"
        message="Bạn có chắc chắn muốn xóa hộ gia đình này? Hộ gia đình sẽ được ẩn khỏi danh sách nhưng dữ liệu vẫn được bảo toàn."
        confirmText="Xóa"
        cancelText="Hủy"
        loading={loading}
      />

      {/* Custom CSS Styles */}
      <style jsx>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .fade-in {
          animation: fadeIn 0.5s ease-in;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .slide-in-left {
          animation: slideInLeft 0.3s ease-out;
        }
        
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .bounce-in {
          animation: bounceIn 0.6s ease;
        }
        
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.3); }
          50% { opacity: 1; transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        .table-hover tbody tr:hover {
          background-color: rgba(102, 126, 234, 0.08) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.15);
          transition: all 0.3s ease;
        }
        
        .trend-bar:hover {
          transform: scale(1.1);
          transition: all 0.2s ease;
        }
        
        .pagination-controls .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 3px 6px rgba(0,0,0,0.15);
        }
        
        .status-indicator .badge {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        
        .toast {
          animation: slideInRight 0.3s ease-out;
        }
        
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .card-hover {
          transition: all 0.3s ease;
        }
        
        .card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 35px rgba(0,0,0,0.1);
        }
        
        .btn-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          transition: all 0.3s ease;
        }
        
        .btn-gradient:hover {
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }
        
        .search-input:focus {
          border-color: #667eea !important;
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25) !important;
        }
        
        .loading-spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        
        .progress-bar-animated {
          background: linear-gradient(45deg, #667eea, #764ba2, #667eea);
          background-size: 200% 100%;
          animation: progress-animation 2s linear infinite;
        }
        
        @keyframes progress-animation {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        .notification-enter {
          opacity: 0;
          transform: translateX(100%);
        }
        
        .notification-enter-active {
          opacity: 1;
          transform: translateX(0);
          transition: all 0.3s ease-out;
        }
        
        .notification-exit {
          opacity: 1;
          transform: translateX(0);
        }
        
        .notification-exit-active {
          opacity: 0;
          transform: translateX(100%);
          transition: all 0.3s ease-in;
        }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .button-float {
          position: fixed;
          bottom: 30px;
          right: 30px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
          font-size: 24px;
          transition: all 0.3s ease;
          z-index: 1000;
        }
        
        .button-float:hover {
          transform: scale(1.1) rotate(90deg);
          box-shadow: 0 12px 35px rgba(102, 126, 234, 0.6);
        }
        
        .table-row-selected {
          background: linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%) !important;
          border-left: 4px solid #667eea;
        }
        
        .modal-backdrop {
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(5px);
        }
        
        .modal-content {
          border: none;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        .badge-pulse {
          animation: badge-pulse 2s infinite;
        }
        
        @keyframes badge-pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        .data-visualization {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          border-radius: 15px;
          padding: 20px;
          color: white;
          margin: 10px 0;
        }
        
        .chart-container {
          position: relative;
          height: 300px;
          margin: 20px 0;
        }
        
        .chart-bar {
          background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
          border-radius: 5px 5px 0 0;
          transition: all 0.3s ease;
        }
        
        .chart-bar:hover {
          background: linear-gradient(180deg, #764ba2 0%, #667eea 100%);
          transform: scale(1.05);
        }
        
        .filter-chip {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 12px;
          margin: 2px;
          display: inline-block;
          transition: all 0.3s ease;
        }
        
        .filter-chip:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .activity-timeline {
          position: relative;
          padding-left: 30px;
        }
        
        .activity-timeline::before {
          content: '';
          position: absolute;
          left: 15px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
        }
        
        .timeline-item {
          position: relative;
          margin-bottom: 20px;
        }
        
        .timeline-item::before {
          content: '';
          position: absolute;
          left: -23px;
          top: 5px;
          width: 12px;
          height: 12px;
          background: #667eea;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        .export-progress {
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
          padding: 10px;
          color: white;
          margin: 10px 0;
        }
        
        .import-preview {
          max-height: 400px;
          overflow-y: auto;
          border: 2px dashed #667eea;
          border-radius: 10px;
          padding: 20px;
          background: rgba(102, 126, 234, 0.05);
        }
        
        .statistics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }
        
        .statistic-card {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
          border-radius: 15px;
          padding: 25px;
          text-align: center;
          transition: all 0.3s ease;
          border: 1px solid rgba(102, 126, 234, 0.2);
        }
        
        .statistic-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(102, 126, 234, 0.2);
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
        }
        
        .advanced-search-form {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 30px;
          margin: 20px 0;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .bulk-actions-panel {
          background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
          border-radius: 15px;
          padding: 15px;
          margin: 20px 0;
          border: 2px solid rgba(255, 183, 77, 0.3);
        }
        
        .recent-activities-panel {
          position: fixed;
          top: 20%;
          right: 20px;
          width: 320px;
          max-height: 60vh;
          overflow-y: auto;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(15px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          z-index: 1000;
        }
        
        .table-responsive-custom {
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        
        .table-header-custom {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 20px 30px;
        }
        
        .pagination-custom {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 15px;
          padding: 15px;
          margin: 20px 0;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .view-mode-toggle {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          padding: 10px 20px;
          border-radius: 25px;
          transition: all 0.3s ease;
        }
        
        .view-mode-toggle:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
          background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        }
        
        .search-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ddd;
          border-radius: 10px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
          z-index: 1000;
          max-height: 200px;
          overflow-y: auto;
        }
        
        .search-suggestion-item {
          padding: 10px 15px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .search-suggestion-item:hover {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
        }
      `}</style>
    </div>
  );
};

export default HouseholdListScreen; 