import React, { useState, useEffect, useContext, useRef, useMemo, useCallback } from 'react';
import { Table, Button, Row, Col, Form, InputGroup, Card, Modal, Badge, Dropdown, OverlayTrigger, Tooltip, ProgressBar, Alert, Toast, ToastContainer, Offcanvas, Accordion, ListGroup, Pagination, FloatingLabel, Spinner, Container } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Message from '../components/common/Message';
import Loader from '../components/common/Loader';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';
import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ResidentListScreen = () => {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  
  // Advanced state management
  const [selectedResidents, setSelectedResidents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [residentsPerPage, setResidentsPerPage] = useState(10);
  const [sortField, setSortField] = useState('fullName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterAge, setFilterAge] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showResidentDetails, setShowResidentDetails] = useState(false);
  const [selectedResident, setSelectedResident] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [exportFormat, setExportFormat] = useState('csv');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');
  const [recentActivities, setRecentActivities] = useState([]);
  const [quickStats, setQuickStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    male: 0,
    female: 0,
    newThisMonth: 0
  });
  const [viewMode, setViewMode] = useState('table'); // table, grid, card
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [searchHistory, setSearchHistory] = useState([]);
  const [savedFilters, setSavedFilters] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    fullName: true,
    idCard: true,
    dateOfBirth: true,
    gender: true,
    phone: true,
    household: true,
    status: true,
    actions: true
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userInfo } = useContext(AuthContext);
  
  // Refs for advanced features
  const searchInputRef = useRef(null);
  const tableRef = useRef(null);
  const importInputRef = useRef(null);
  const websocketRef = useRef(null);
  const refreshIntervalRef = useRef(null);
  
  // Computed values
  const filteredAndSortedResidents = useMemo(() => {
    let filtered = residents.filter((resident) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = resident.fullName?.toLowerCase().includes(searchLower) ||
                          resident.idCard?.toLowerCase().includes(searchLower) ||
                          resident.phone?.toLowerCase().includes(searchLower) ||
                          resident.household?.apartmentNumber?.toLowerCase().includes(searchLower);
      
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'active' && resident.active) ||
                           (filterStatus === 'inactive' && !resident.active);
      
      const matchesGender = filterGender === 'all' || resident.gender === filterGender;
      
      let matchesAge = true;
      if (filterAge !== 'all' && resident.dateOfBirth) {
        const age = new Date().getFullYear() - new Date(resident.dateOfBirth).getFullYear();
        switch (filterAge) {
          case 'under18': matchesAge = age < 18; break;
          case '18-30': matchesAge = age >= 18 && age <= 30; break;
          case '31-50': matchesAge = age >= 31 && age <= 50; break;
          case 'over50': matchesAge = age > 50; break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesGender && matchesAge;
    });

    // Sort residents
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'household') {
        aVal = a.household?.apartmentNumber || '';
        bVal = b.household?.apartmentNumber || '';
      }
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [residents, searchTerm, filterStatus, filterGender, filterAge, sortField, sortOrder]);

  const paginatedResidents = useMemo(() => {
    const startIndex = (currentPage - 1) * residentsPerPage;
    return filteredAndSortedResidents.slice(startIndex, startIndex + residentsPerPage);
  }, [filteredAndSortedResidents, currentPage, residentsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedResidents.length / residentsPerPage);
  
  const csvData = useMemo(() => {
    return filteredAndSortedResidents.map(resident => ({
      'Họ Tên': resident.fullName,
      'CMND/CCCD': resident.idCard || '',
      'Ngày Sinh': resident.dateOfBirth ? new Date(resident.dateOfBirth).toLocaleDateString('vi-VN') : '',
      'Giới Tính': resident.gender === 'male' ? 'Nam' : resident.gender === 'female' ? 'Nữ' : '',
      'Điện Thoại': resident.phone || '',
      'Hộ Gia Đình': resident.household?.apartmentNumber || '',
      'Trạng Thái': resident.active ? 'Hoạt động' : 'Không hoạt động'
    }));
  }, [filteredAndSortedResidents]);

  useEffect(() => {
    fetchResidents();
    fetchQuickStats();
    fetchRecentActivities();
    loadSavedFilters();
    loadSearchHistory();
  }, [userInfo]);

  // Auto refresh effect
  useEffect(() => {
    if (autoRefresh && userInfo) {
      refreshIntervalRef.current = setInterval(() => {
        fetchResidents();
        setLastUpdated(new Date());
      }, refreshInterval);
      
      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, userInfo]);

  // URL parameter effects
  useEffect(() => {
    const page = parseInt(searchParams.get('page')) || 1;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    
    setCurrentPage(page);
    setSearchTerm(search);
    setFilterStatus(status);
  }, [searchParams]);

  // WebSocket for real-time updates
  useEffect(() => {
    if (userInfo) {
      const ws = new WebSocket(`ws://localhost:8000/residents`);
      websocketRef.current = ws;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'resident_added':
            setResidents(prev => [...prev, data.resident]);
            showToastMessage('Có cư dân mới được thêm', 'info');
            break;
          case 'resident_updated':
            setResidents(prev => prev.map(r => r._id === data.resident._id ? data.resident : r));
            showToastMessage('Thông tin cư dân đã được cập nhật', 'info');
            break;
          case 'resident_deleted':
            setResidents(prev => prev.filter(r => r._id !== data.residentId));
            showToastMessage('Cư dân đã được xóa', 'warning');
            break;
        }
      };

      return () => {
        if (websocketRef.current) {
          websocketRef.current.close();
        }
      };
    }
  }, [userInfo]);
  
  const fetchResidents = async () => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const { data } = await axios.get('/api/residents', config);
      
      setResidents(data);
      setLoading(false);
      setLastUpdated(new Date());
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể tải danh sách cư dân'
      );
      setLoading(false);
    }
  };

  const fetchQuickStats = useCallback(async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo?.token}`,
        },
      };
      
      const { data } = await axios.get('/api/residents/stats', config);
      setQuickStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, [userInfo]);

  const fetchRecentActivities = useCallback(async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo?.token}`,
        },
      };
      
      const { data } = await axios.get('/api/residents/activities', config);
      setRecentActivities(data);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  }, [userInfo]);

  const loadSavedFilters = useCallback(() => {
    const saved = localStorage.getItem('residentFilters');
    if (saved) {
      setSavedFilters(JSON.parse(saved));
    }
  }, []);

  const loadSearchHistory = useCallback(() => {
    const history = localStorage.getItem('residentSearchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  const saveSearchToHistory = useCallback((term) => {
    if (term.trim() && !searchHistory.includes(term)) {
      const newHistory = [term, ...searchHistory.slice(0, 9)];
      setSearchHistory(newHistory);
      localStorage.setItem('residentSearchHistory', JSON.stringify(newHistory));
    }
  }, [searchHistory]);

  const showToastMessage = useCallback((message, variant = 'success') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, []);

  const handleBulkAction = useCallback(async (action) => {
    if (selectedResidents.length === 0) {
      showToastMessage('Vui lòng chọn ít nhất một cư dân', 'warning');
      return;
    }

    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      switch (action) {
        case 'activate':
          await axios.put('/api/residents/bulk-activate', 
            { residentIds: selectedResidents }, config);
          showToastMessage(`Đã kích hoạt ${selectedResidents.length} cư dân`);
          break;
        case 'deactivate':
          await axios.put('/api/residents/bulk-deactivate', 
            { residentIds: selectedResidents }, config);
          showToastMessage(`Đã vô hiệu hóa ${selectedResidents.length} cư dân`);
          break;
        case 'delete':
          if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedResidents.length} cư dân?`)) {
            await axios.delete('/api/residents/bulk-delete', 
              { data: { residentIds: selectedResidents }, ...config });
            showToastMessage(`Đã xóa ${selectedResidents.length} cư dân`);
          }
          break;
      }

      fetchResidents();
      setSelectedResidents([]);
      setShowBulkActions(false);
    } catch (error) {
      showToastMessage('Thao tác thất bại', 'danger');
    } finally {
      setLoading(false);
    }
  }, [selectedResidents, userInfo, showToastMessage, fetchResidents]);

  const handleExport = useCallback(async () => {
    try {
      const dataToExport = filteredAndSortedResidents;
      
      switch (exportFormat) {
        case 'csv':
          // CSV export handled by CSVLink component
          break;
        case 'excel':
          const ws = XLSX.utils.json_to_sheet(csvData);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Residents');
          XLSX.writeFile(wb, `residents_${new Date().toISOString().split('T')[0]}.xlsx`);
          break;
        case 'pdf':
          const doc = new jsPDF();
          doc.text('Danh Sách Cư Dân', 20, 20);
          
          const tableData = dataToExport.map(resident => [
            resident.fullName,
            resident.idCard || '',
            resident.dateOfBirth ? new Date(resident.dateOfBirth).toLocaleDateString('vi-VN') : '',
            resident.gender === 'male' ? 'Nam' : 'Nữ',
            resident.phone || '',
            resident.household?.apartmentNumber || '',
            resident.active ? 'Hoạt động' : 'Không hoạt động'
          ]);
          
          doc.autoTable({
            head: [['Họ Tên', 'CMND/CCCD', 'Ngày Sinh', 'Giới Tính', 'Điện Thoại', 'Hộ Gia Đình', 'Trạng Thái']],
            body: tableData,
            startY: 30
          });
          
          doc.save(`residents_${new Date().toISOString().split('T')[0]}.pdf`);
          break;
      }
      
      showToastMessage('Xuất dữ liệu thành công');
      setShowExportModal(false);
    } catch (error) {
      showToastMessage('Xuất dữ liệu thất bại', 'danger');
    }
  }, [filteredAndSortedResidents, csvData, exportFormat, showToastMessage]);

  const handleImport = useCallback(async () => {
    if (!importFile) {
      showToastMessage('Vui lòng chọn file để import', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      setLoading(true);
      setImportProgress(0);
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setImportProgress(percentCompleted);
        },
      };

      const { data } = await axios.post('/api/residents/import', formData, config);
      
      showToastMessage(`Import thành công ${data.imported} cư dân, bỏ qua ${data.skipped} bản ghi`);
      fetchResidents();
      setShowImportModal(false);
      setImportFile(null);
      setImportProgress(0);
    } catch (error) {
      showToastMessage('Import thất bại', 'danger');
    } finally {
      setLoading(false);
    }
  }, [importFile, userInfo, showToastMessage, fetchResidents]);

  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }, [sortField, sortOrder]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    setSearchParams(prev => {
      prev.set('page', page.toString());
      return prev;
    });
  }, [setSearchParams]);

  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    setCurrentPage(1);
    saveSearchToHistory(term);
    setSearchParams(prev => {
      if (term) {
        prev.set('search', term);
      } else {
        prev.delete('search');
      }
      prev.delete('page');
      return prev;
    });
  }, [saveSearchToHistory, setSearchParams]);

  const handleResidentSelect = useCallback((residentId, isSelected) => {
    if (isSelected) {
      setSelectedResidents(prev => [...prev, residentId]);
    } else {
      setSelectedResidents(prev => prev.filter(id => id !== residentId));
    }
  }, []);

  const handleSelectAll = useCallback((isSelected) => {
    if (isSelected) {
      setSelectedResidents(paginatedResidents.map(r => r._id));
    } else {
      setSelectedResidents([]);
    }
  }, [paginatedResidents]);

  const toggleColumnVisibility = useCallback((column) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  }, []);

  const saveCurrentFilter = useCallback(() => {
    const filterName = prompt('Nhập tên bộ lọc:');
    if (filterName) {
      const newFilter = {
        name: filterName,
        searchTerm,
        filterStatus,
        filterGender,
        filterAge,
        sortField,
        sortOrder
      };
      const newSavedFilters = [...savedFilters, newFilter];
      setSavedFilters(newSavedFilters);
      localStorage.setItem('residentFilters', JSON.stringify(newSavedFilters));
      showToastMessage('Đã lưu bộ lọc');
    }
  }, [searchTerm, filterStatus, filterGender, filterAge, sortField, sortOrder, savedFilters, showToastMessage]);

  const applyFilter = useCallback((filter) => {
    setSearchTerm(filter.searchTerm);
    setFilterStatus(filter.filterStatus);
    setFilterGender(filter.filterGender);
    setFilterAge(filter.filterAge);
    setSortField(filter.sortField);
    setSortOrder(filter.sortOrder);
    setCurrentPage(1);
  }, []);
  
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
      await axios.delete(`/api/residents/${deleteId}`, config);
      fetchResidents();
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể xóa cư dân'
      );
      setLoading(false);
    }
    setDeleteId(null);
  };
  
  // Statistics component
  const StatsCards = () => (
    <Row className="mb-4">
      <Col md={2}>
        <Card className="text-center border-0 shadow-sm bg-primary text-white">
          <Card.Body>
            <h3>{quickStats.total}</h3>
            <small>Tổng cư dân</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={2}>
        <Card className="text-center border-0 shadow-sm bg-success text-white">
          <Card.Body>
            <h3>{quickStats.active}</h3>
            <small>Đang hoạt động</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={2}>
        <Card className="text-center border-0 shadow-sm bg-warning text-white">
          <Card.Body>
            <h3>{quickStats.inactive}</h3>
            <small>Không hoạt động</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={2}>
        <Card className="text-center border-0 shadow-sm bg-info text-white">
          <Card.Body>
            <h3>{quickStats.male}</h3>
            <small>Nam</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={2}>
        <Card className="text-center border-0 shadow-sm bg-secondary text-white">
          <Card.Body>
            <h3>{quickStats.female}</h3>
            <small>Nữ</small>
          </Card.Body>
        </Card>
      </Col>
      <Col md={2}>
        <Card className="text-center border-0 shadow-sm bg-dark text-white">
          <Card.Body>
            <h3>{quickStats.newThisMonth}</h3>
            <small>Mới tháng này</small>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  // Advanced search component
  const AdvancedSearch = () => (
    <Card className="mb-3">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <span><i className="bi bi-funnel me-2"></i>Bộ lọc nâng cao</span>
          <Button 
            variant="link" 
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            {showAdvancedFilters ? 'Thu gọn' : 'Mở rộng'}
          </Button>
        </div>
      </Card.Header>
      <Card.Body className={showAdvancedFilters ? '' : 'd-none'}>
        <Row>
          <Col md={3}>
            <FloatingLabel label="Trạng thái">
              <Form.Select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="active">Hoạt động</option>
                <option value="inactive">Không hoạt động</option>
              </Form.Select>
            </FloatingLabel>
          </Col>
          <Col md={3}>
            <FloatingLabel label="Giới tính">
              <Form.Select 
                value={filterGender} 
                onChange={(e) => setFilterGender(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
              </Form.Select>
            </FloatingLabel>
          </Col>
          <Col md={3}>
            <FloatingLabel label="Độ tuổi">
              <Form.Select 
                value={filterAge} 
                onChange={(e) => setFilterAge(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="under18">Dưới 18</option>
                <option value="18-30">18-30</option>
                <option value="31-50">31-50</option>
                <option value="over50">Trên 50</option>
              </Form.Select>
            </FloatingLabel>
          </Col>
          <Col md={3}>
            <div className="d-flex gap-2">
              <Button variant="outline-primary" onClick={saveCurrentFilter}>
                <i className="bi bi-bookmark me-1"></i>Lưu bộ lọc
              </Button>
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" size="sm">
                  Bộ lọc đã lưu
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {savedFilters.map((filter, index) => (
                    <Dropdown.Item key={index} onClick={() => applyFilter(filter)}>
                      {filter.name}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );

  // Toolbar component
  const Toolbar = () => (
    <Card className="mb-3">
      <Card.Body>
        <Row className="align-items-center">
          <Col md={4}>
            <InputGroup>
              <Form.Control
                ref={searchInputRef}
                type="text"
                placeholder="Tìm kiếm cư dân..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <Button variant="outline-secondary" onClick={() => handleSearch('')}>
                <i className="bi bi-x"></i>
              </Button>
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary">
                  <i className="bi bi-clock-history"></i>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Header>Tìm kiếm gần đây</Dropdown.Header>
                  {searchHistory.map((term, index) => (
                    <Dropdown.Item key={index} onClick={() => handleSearch(term)}>
                      {term}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </InputGroup>
          </Col>
          <Col md={8} className="text-end">
            <div className="d-flex justify-content-end gap-2">
              {selectedResidents.length > 0 && (
                <Dropdown>
                  <Dropdown.Toggle variant="warning">
                    <i className="bi bi-gear me-1"></i>
                    Thao tác hàng loạt ({selectedResidents.length})
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => handleBulkAction('activate')}>
                      <i className="bi bi-check-circle me-2"></i>Kích hoạt
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => handleBulkAction('deactivate')}>
                      <i className="bi bi-x-circle me-2"></i>Vô hiệu hóa
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item 
                      onClick={() => handleBulkAction('delete')}
                      className="text-danger"
                    >
                      <i className="bi bi-trash me-2"></i>Xóa
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}
              
              <Dropdown>
                <Dropdown.Toggle variant="success">
                  <i className="bi bi-download me-1"></i>Xuất dữ liệu
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => setShowExportModal(true)}>
                    <i className="bi bi-file-earmark-spreadsheet me-2"></i>Excel
                  </Dropdown.Item>
                  <CSVLink 
                    data={csvData} 
                    filename={`residents_${new Date().toISOString().split('T')[0]}.csv`}
                    className="dropdown-item"
                  >
                    <i className="bi bi-file-earmark-text me-2"></i>CSV
                  </CSVLink>
                  <Dropdown.Item onClick={() => { setExportFormat('pdf'); handleExport(); }}>
                    <i className="bi bi-file-earmark-pdf me-2"></i>PDF
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>

              <Button variant="info" onClick={() => setShowImportModal(true)}>
                <i className="bi bi-upload me-1"></i>Nhập dữ liệu
              </Button>

              <Button variant="primary" onClick={() => navigate('/residents/create')}>
                <i className="bi bi-plus-circle me-1"></i>Thêm cư dân
              </Button>

              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary">
                  <i className="bi bi-three-dots-vertical"></i>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => setShowColumnCustomizer(true)}>
                    <i className="bi bi-table me-2"></i>Tùy chỉnh cột
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => setShowStatistics(true)}>
                    <i className="bi bi-graph-up me-2"></i>Thống kê
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item 
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={autoRefresh ? 'text-success' : ''}
                  >
                    <i className={`bi ${autoRefresh ? 'bi-pause' : 'bi-play'} me-2`}></i>
                    {autoRefresh ? 'Tắt tự động làm mới' : 'Bật tự động làm mới'}
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </Col>
        </Row>
        
        {/* View mode selector */}
        <Row className="mt-2">
          <Col>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <Badge variant="secondary" className="me-2">
                  Hiển thị {paginatedResidents.length} / {filteredAndSortedResidents.length} cư dân
                </Badge>
                <small className="text-muted">
                  Cập nhật lần cuối: {lastUpdated.toLocaleTimeString('vi-VN')}
                </small>
              </div>
              <div>
                <Form.Select 
                  size="sm" 
                  style={{width: 'auto', display: 'inline'}}
                  value={residentsPerPage}
                  onChange={(e) => setResidentsPerPage(Number(e.target.value))}
                >
                  <option value={5}>5 mỗi trang</option>
                  <option value={10}>10 mỗi trang</option>
                  <option value={25}>25 mỗi trang</option>
                  <option value={50}>50 mỗi trang</option>
                </Form.Select>
              </div>
            </div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
  
  return (
    <>
      <Row className="align-items-center mb-3">
        <Col>
          <h1>Cư Dân</h1>
        </Col>
        <Col className="text-end">
          <Button 
            className="btn-sm"
            onClick={() => navigate('/residents/create')}
          >
            <i className="fas fa-plus"></i> Thêm Cư Dân
          </Button>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Tìm kiếm cư dân..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button
              variant="outline-secondary"
              onClick={() => setSearchTerm('')}
            >
              Xóa
            </Button>
          </InputGroup>
        </Col>
      </Row>

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <Card className="shadow-lg border-0 rounded-4">
          <Card.Header className="bg-white border-0 rounded-top-4 pb-2 d-flex align-items-center justify-content-between">
            <span className="fw-bold fs-5 text-primary"><i className="bi bi-people-fill me-2"></i>Danh sách cư dân</span>
            <span className="text-muted small">Tổng: {filteredResidents.length}</span>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 household-table">
                <thead className="table-light">
                  <tr>
                    <th className="fw-bold">Họ Tên</th>
                    <th className="fw-bold">CMND/CCCD</th>
                    <th className="fw-bold">Ngày Sinh</th>
                    <th className="fw-bold">Giới Tính</th>
                    <th className="fw-bold">Điện Thoại</th>
                    <th className="fw-bold">Hộ Gia Đình</th>
                    <th className="fw-bold text-center">Trạng Thái</th>
                    <th className="fw-bold text-center col-action" style={{width: '1%', whiteSpace: 'nowrap'}}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResidents.map((resident) => (
                    <tr key={resident._id} className="table-row-hover">
                      <td className="align-middle"><i className="bi bi-person me-1 text-primary"></i>{resident.fullName}</td>
                      <td className="align-middle">{resident.idCard || 'N/A'}</td>
                      <td className="align-middle">{resident.dateOfBirth ? new Date(resident.dateOfBirth).toLocaleDateString('vi-VN') : 'N/A'}</td>
                      <td className="align-middle">{resident.gender === 'male' ? 'Nam' : resident.gender === 'female' ? 'Nữ' : 'N/A'}</td>
                      <td className="align-middle">{resident.phone || 'N/A'}</td>
                      <td className="align-middle">{resident.household ? resident.household.apartmentNumber : <span className="text-muted fst-italic">Chưa gán</span>}</td>
                      <td className="text-center align-middle">
                        {resident.active ? (
                          <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill">
                            <i className="bi bi-check-circle me-1"></i>Hoạt động
                          </span>
                        ) : (
                          <span className="badge bg-danger bg-opacity-10 text-danger px-3 py-2 rounded-pill">
                            <i className="bi bi-x-circle me-1"></i>Không hoạt động
                          </span>
                        )}
                      </td>
                      <td className="text-center align-middle col-action" style={{width: '1%', whiteSpace: 'nowrap'}}>
                        <div className="d-flex justify-content-center gap-1">
                          <LinkContainer to={`/residents/${resident._id}`}>
                            <Button variant="light" className="mx-1 small" title="Xem chi tiết" style={{fontSize: '0.85rem', borderRadius: '1rem'}}>
                              Xem
                            </Button>
                          </LinkContainer>
                          <LinkContainer to={`/residents/${resident._id}/edit`}>
                            <Button variant="light" className="mx-1 small" title="Chỉnh sửa" style={{fontSize: '0.85rem', borderRadius: '1rem'}}>
                              Chỉnh sửa
                            </Button>
                          </LinkContainer>
                          {userInfo.role === 'admin' && (
                            <Button
                              variant="danger"
                              className="mx-1 small"
                              onClick={() => deleteHandler(resident._id)}
                              title="Xóa"
                              style={{fontSize: '0.85rem', borderRadius: '1rem'}}
                            >
                              Xóa
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredResidents.length === 0 && (
              <Message>Không tìm thấy cư dân nào</Message>
            )}
          </Card.Body>
        </Card>
      )}
      <ConfirmDeleteModal
        show={showConfirm}
        onHide={() => setShowConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa cư dân"
        message="Bạn có chắc chắn muốn xóa cư dân này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        loading={loading}
      />
    </>
  );
};

export default ResidentListScreen; 