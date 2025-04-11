import React, { useContext, useState, useEffect } from 'react';
import { Navbar, Nav, Container, NavDropdown, Badge, Form, Button, Modal, Alert, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import AuthContext from '../../context/AuthContext';

const Header = () => {
  const { userInfo, logout } = useContext(AuthContext);
  
  // State management for new features
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'warning', message: 'Phí quản lý tháng 12 sắp đến hạn thanh toán', time: '5 phút trước', unread: true },
    { id: 2, type: 'info', message: 'Bảo trì thang máy Block A vào 15/12', time: '1 giờ trước', unread: true },
    { id: 3, type: 'success', message: 'Thanh toán phí xe tháng 11 thành công', time: '2 giờ trước', unread: false }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('vi');
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [weather, setWeather] = useState({ temp: '28°C', condition: 'Nắng', icon: 'bi-sun' });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [quickStats, setQuickStats] = useState({
    totalHouseholds: 156,
    totalResidents: 423,
    pendingPayments: 23,
    maintenanceRequests: 7
  });

  // Helper functions
  const isAdmin = () => userInfo && userInfo.role === 'admin';
  const isManager = () => userInfo && userInfo.role === 'manager';
  
  const formatUserRole = (role) => {
    const roles = {
      'admin': 'Quản trị viên',
      'manager': 'Quản lý',
      'resident': 'Cư dân',
      'accountant': 'Kế toán',
      'security': 'Bảo vệ',
      'maintenance': 'Bảo trì'
    };
    return roles[role] || role;
  };
  
  const getInitial = (name) => {
    if (!name) return 'U';
    return name.trim().charAt(0).toUpperCase();
  };

  const getStatusColor = () => {
    if (userInfo?.status === 'online') return '#28a745';
    if (userInfo?.status === 'busy') return '#ffc107';
    return '#6c757d';
  };

  const unreadNotifications = notifications.filter(n => n.unread).length;

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Language options
  const languages = {
    'vi': { name: 'Tiếng Việt', flag: '🇻🇳' },
    'en': { name: 'English', flag: '🇺🇸' },
    'ko': { name: '한국어', flag: '🇰🇷' }
  };

  // Quick actions based on user role
  const getQuickActions = () => {
    const baseActions = [
      { icon: 'bi-plus-circle', label: 'Thêm cư dân mới', action: () => window.location.href = '/residents/create' },
      { icon: 'bi-credit-card', label: 'Tạo thanh toán', action: () => window.location.href = '/payments/create' },
      { icon: 'bi-search', label: 'Tìm kiếm nhanh', action: () => setShowSearch(true) }
    ];

    if (isAdmin()) {
      baseActions.push(
        { icon: 'bi-person-plus', label: 'Thêm người dùng', action: () => window.location.href = '/users/create' },
        { icon: 'bi-graph-up', label: 'Xem báo cáo', action: () => window.location.href = '/admin/reports' }
      );
    }

    return baseActions;
  };

  // Emergency contacts
  const emergencyContacts = [
    { name: 'Ban Quản Lý', phone: '0123-456-789', icon: 'bi-building' },
    { name: 'Bảo Vệ', phone: '0987-654-321', icon: 'bi-shield-check' },
    { name: 'Kỹ Thuật', phone: '0456-789-123', icon: 'bi-tools' },
    { name: 'Y Tế', phone: '115', icon: 'bi-hospital', emergency: true }
  ];

  const handleNotificationClick = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, unread: false } : n)
    );
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-theme');
  };

  return (
    <>
      {/* Emergency Alert Banner */}
      <Alert variant="warning" className="mb-0 text-center py-1 rounded-0" dismissible>
        <small>
          <i className="bi bi-exclamation-triangle me-1"></i>
          <strong>Thông báo:</strong> Bảo trì hệ thống điện Block B từ 14:00-16:00 ngày 20/12. 
          Hotline khẩn cấp: <a href="tel:0123456789" className="text-decoration-none fw-bold">0123-456-789</a>
        </small>
      </Alert>

      <header>
        <Navbar
          expand="lg"
          className="py-2 px-0"
          style={{
            background: darkMode 
              ? 'linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)'
              : 'linear-gradient(90deg, #2193b0 0%, #6dd5ed 100%)',
            borderRadius: '0 0 1.5rem 1.5rem',
            boxShadow: '0 4px 20px 0 rgba(33, 147, 176, 0.15)',
            transition: 'all 0.3s ease'
          }}
        >
          <Container fluid>
            {/* Logo and Brand */}
            <LinkContainer to={userInfo ? '/dashboard' : '/'}>
              <Navbar.Brand className="d-flex align-items-center gap-3 fw-bold fs-4 text-white">
                <div className="d-inline-flex align-items-center justify-content-center bg-white bg-opacity-90 rounded-circle shadow-sm" style={{width: 50, height: 50, padding: '2px'}}>
                  <img 
                    src="/logo.svg" 
                    alt="BlueMoon Logo" 
                    style={{
                      width: '42px', 
                      height: '42px', 
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextElementSibling.style.display = 'inline-flex';
                    }}
                  />
                  <i 
                    className="bi bi-building text-primary" 
                    style={{
                      fontSize: 30, 
                      display: 'none'
                    }}
                  ></i>
                </div>
                <div className="d-flex flex-column">
                  <span className="text-white" style={{letterSpacing: 1, fontSize: '1.4rem', lineHeight: '1.2'}}>
                    Chung Cư BlueMoon
                  </span>
                  <span className="text-white-50" style={{fontSize: '0.75rem', fontWeight: 'normal'}}>
                    Apartment Management System
                  </span>
                </div>
                {/* Online Status Indicator */}
                <div className="position-relative">
                  <div 
                    className="rounded-circle position-absolute"
                    style={{
                      width: 8,
                      height: 8,
                      backgroundColor: '#28a745',
                      top: -2,
                      right: -2,
                      boxShadow: '0 0 0 2px white'
                    }}
                  ></div>
                </div>
              </Navbar.Brand>
            </LinkContainer>

            {/* Weather and Time Widget */}
            {userInfo && (
              <div className="d-none d-lg-flex text-white text-center mx-3">
                <div className="border-end border-white-50 pe-3">
                  <div className="d-flex align-items-center gap-1">
                    <i className={`${weather.icon} text-warning`}></i>
                    <span className="fw-semibold">{weather.temp}</span>
                  </div>
                  <small className="text-white-50">{weather.condition}</small>
                </div>
                <div className="ps-3">
                  <div className="fw-semibold">{currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                  <small className="text-white-50">{currentTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</small>
                </div>
              </div>
            )}
            
            <Navbar.Toggle aria-controls="main-navbar" />
            <Navbar.Collapse id="main-navbar">
              <Nav className="ms-auto align-items-center gap-1 gap-lg-2 fw-semibold">
                {userInfo ? (
                  <>
                    {/* Main Navigation */}
                    <LinkContainer to="/dashboard">
                      <Nav.Link className="nav-link-custom position-relative">
                        <i className="bi bi-speedometer2 me-1"></i> Tổng quan
                        <Badge bg="primary" className="position-absolute top-0 start-100 translate-middle badge-sm rounded-pill">
                          {quickStats.pendingPayments}
                        </Badge>
                      </Nav.Link>
                    </LinkContainer>
                    
                    <LinkContainer to="/households">
                      <Nav.Link className="nav-link-custom">
                        <i className="bi bi-house-door me-1"></i> Hộ gia đình
                        <small className="text-white-50 ms-1">({quickStats.totalHouseholds})</small>
                      </Nav.Link>
                    </LinkContainer>
                    
                    <LinkContainer to="/residents">
                      <Nav.Link className="nav-link-custom">
                        <i className="bi bi-people me-1"></i> Cư dân
                        <small className="text-white-50 ms-1">({quickStats.totalResidents})</small>
                      </Nav.Link>
                    </LinkContainer>
                    
                    <LinkContainer to="/vehicles">
                      <Nav.Link className="nav-link-custom">
                        <i className="bi bi-car-front me-1"></i> Phương tiện
                      </Nav.Link>
                    </LinkContainer>
                    
                    <LinkContainer to="/facilities">
                      <Nav.Link className="nav-link-custom position-relative">
                        <i className="bi bi-gear me-1"></i> Tiện ích
                        {quickStats.maintenanceRequests > 0 && (
                          <Badge bg="warning" className="position-absolute top-0 start-100 translate-middle badge-sm rounded-pill">
                            {quickStats.maintenanceRequests}
                          </Badge>
                        )}
                      </Nav.Link>
                    </LinkContainer>
                    
                    {/* Fee Management Dropdown */}
                    <NavDropdown
                                             title={
                         <span>
                           <i className="bi bi-cash-stack me-1"></i> Phí & Thanh toán
                         </span>
                       }
                      id="fee-menu"
                      className="nav-link-custom"
                    >
                      <NavDropdown.Header>Quản lý phí</NavDropdown.Header>
                      <LinkContainer to="/fees">
                        <NavDropdown.Item><i className="bi bi-list-ul me-2"></i>Danh sách phí</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/vehicle-fees">
                        <NavDropdown.Item><i className="bi bi-car-front me-2"></i>Phí xe</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/area-fees">
                        <NavDropdown.Item><i className="bi bi-house me-2"></i>Phí theo diện tích</NavDropdown.Item>
                      </LinkContainer>
                      <NavDropdown.Divider />
                      <NavDropdown.Header>Thanh toán</NavDropdown.Header>
                      <LinkContainer to="/payments">
                        <NavDropdown.Item><i className="bi bi-credit-card me-2"></i>Danh sách thanh toán</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/payments/create">
                        <NavDropdown.Item><i className="bi bi-plus-circle me-2"></i>Tạo thanh toán mới</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/payments/search">
                        <NavDropdown.Item><i className="bi bi-search me-2"></i>Tìm kiếm thanh toán</NavDropdown.Item>
                      </LinkContainer>
                      <LinkContainer to="/payments/statistics">
                        <NavDropdown.Item><i className="bi bi-graph-up me-2"></i>Thống kê thanh toán</NavDropdown.Item>
                      </LinkContainer>
                    </NavDropdown>

                    {/* Quick Search */}
                    <OverlayTrigger
                      placement="bottom"
                      overlay={<Tooltip>Tìm kiếm nhanh (Ctrl+K)</Tooltip>}
                    >
                      <Nav.Link 
                        className="nav-link-custom"
                        onClick={() => setShowSearch(true)}
                      >
                        <i className="bi bi-search"></i>
                      </Nav.Link>
                    </OverlayTrigger>

                    {/* Notifications */}
                    <NavDropdown
                      align="end"
                      title={
                        <span className="position-relative">
                          <i className="bi bi-bell fs-5"></i>
                          {unreadNotifications > 0 && (
                            <Badge 
                              bg="danger" 
                              className="position-absolute top-0 start-100 translate-middle rounded-pill"
                              style={{fontSize: '0.6rem'}}
                            >
                              {unreadNotifications}
                            </Badge>
                          )}
                        </span>
                      }
                      id="notifications-menu"
                      className="nav-link-custom"
                      onToggle={(isOpen) => setShowNotifications(isOpen)}
                    >
                      <div className="px-3 py-2 border-bottom">
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">Thông báo</h6>
                          <Button variant="link" size="sm" className="p-0 text-decoration-none">
                            Đánh dấu đã đọc
                          </Button>
                        </div>
                      </div>
                      <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                        {notifications.map(notification => (
                          <NavDropdown.Item
                            key={notification.id}
                            className={`py-2 ${notification.unread ? 'bg-light' : ''}`}
                            onClick={() => handleNotificationClick(notification.id)}
                          >
                            <div className="d-flex align-items-start gap-2">
                              <i className={`bi ${
                                notification.type === 'warning' ? 'bi-exclamation-triangle text-warning' :
                                notification.type === 'success' ? 'bi-check-circle text-success' :
                                'bi-info-circle text-info'
                              }`}></i>
                              <div className="flex-grow-1">
                                <div className="fw-semibold small">{notification.message}</div>
                                <small className="text-muted">{notification.time}</small>
                              </div>
                              {notification.unread && <div className="bg-primary rounded-circle" style={{width: 8, height: 8}}></div>}
                            </div>
                          </NavDropdown.Item>
                        ))}
                      </div>
                      <NavDropdown.Divider />
                      <LinkContainer to="/notifications">
                        <NavDropdown.Item className="text-center text-primary fw-semibold">
                          Xem tất cả thông báo
                        </NavDropdown.Item>
                      </LinkContainer>
                    </NavDropdown>

                    {/* Quick Actions */}
                    <NavDropdown
                      align="end"
                      title={<i className="bi bi-lightning fs-5"></i>}
                      id="quick-actions"
                      className="nav-link-custom"
                    >
                      <NavDropdown.Header>Thao tác nhanh</NavDropdown.Header>
                      {getQuickActions().map((action, index) => (
                        <NavDropdown.Item key={index} onClick={action.action}>
                          <i className={`${action.icon} me-2`}></i>
                          {action.label}
                        </NavDropdown.Item>
                      ))}
                      <NavDropdown.Divider />
                      <NavDropdown.Header>Liên hệ khẩn cấp</NavDropdown.Header>
                      {emergencyContacts.map((contact, index) => (
                        <NavDropdown.Item 
                          key={index} 
                          href={`tel:${contact.phone}`}
                          className={contact.emergency ? 'text-danger fw-bold' : ''}
                        >
                          <i className={`${contact.icon} me-2`}></i>
                          {contact.name}: {contact.phone}
                        </NavDropdown.Item>
                      ))}
                    </NavDropdown>

                    {/* Settings and Tools */}
                    <NavDropdown
                      align="end"
                      title={<i className="bi bi-gear-fill fs-5"></i>}
                      id="settings-menu"
                      className="nav-link-custom"
                    >
                      <NavDropdown.Header>Cài đặt</NavDropdown.Header>
                      <NavDropdown.Item onClick={toggleTheme}>
                        <i className={`bi ${darkMode ? 'bi-sun' : 'bi-moon'} me-2`}></i>
                        {darkMode ? 'Chế độ sáng' : 'Chế độ tối'}
                      </NavDropdown.Item>
                      
                      <NavDropdown.Item>
                        <div className="d-flex justify-content-between align-items-center">
                          <span><i className="bi bi-translate me-2"></i>Ngôn ngữ</span>
                          <select 
                            className="form-select form-select-sm" 
                            style={{width: 'auto'}}
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                          >
                            {Object.entries(languages).map(([code, lang]) => (
                              <option key={code} value={code}>
                                {lang.flag} {lang.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </NavDropdown.Item>
                      
                      <LinkContainer to="/settings/preferences">
                        <NavDropdown.Item>
                          <i className="bi bi-sliders me-2"></i>Tùy chỉnh giao diện
                        </NavDropdown.Item>
                      </LinkContainer>
                      
                      <LinkContainer to="/settings/notifications">
                        <NavDropdown.Item>
                          <i className="bi bi-bell me-2"></i>Cài đặt thông báo
                        </NavDropdown.Item>
                      </LinkContainer>
                      
                      <NavDropdown.Divider />
                      <NavDropdown.Header>Trợ giúp</NavDropdown.Header>
                      <LinkContainer to="/help">
                        <NavDropdown.Item>
                          <i className="bi bi-question-circle me-2"></i>Hướng dẫn sử dụng
                        </NavDropdown.Item>
                      </LinkContainer>
                      
                      <LinkContainer to="/support">
                        <NavDropdown.Item>
                          <i className="bi bi-headset me-2"></i>Hỗ trợ kỹ thuật
                        </NavDropdown.Item>
                      </LinkContainer>
                      
                      <LinkContainer to="/feedback">
                        <NavDropdown.Item>
                          <i className="bi bi-chat-square-text me-2"></i>Góp ý & Phản hồi
                        </NavDropdown.Item>
                      </LinkContainer>
                    </NavDropdown>

                    {/* User Profile Menu */}
                    <NavDropdown
                      align="end"
                      title={
                        <span className="d-flex align-items-center gap-2 user-dropdown-toggle">
                          <div className="position-relative">
                            <span className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle" style={{width: 38, height: 38, fontWeight: 700, fontSize: 16}}>
                              {getInitial(userInfo.name || userInfo.username)}
                            </span>
                            <div 
                              className="position-absolute rounded-circle border border-2 border-white"
                              style={{
                                width: 12,
                                height: 12,
                                backgroundColor: getStatusColor(),
                                bottom: -1,
                                right: -1
                              }}
                            ></div>
                          </div>
                          <div className="d-none d-lg-block text-start">
                            <div className="fw-bold text-white" style={{fontSize: '0.9rem'}}>
                              {userInfo.name || userInfo.username}
                            </div>
                            <div className="text-white-50 small">
                              {formatUserRole(userInfo.role)}
                            </div>
                          </div>
                        </span>
                      }
                      id="user-menu"
                      className="nav-link-custom user-dropdown-align"
                    >
                      <div className="px-3 py-2 border-bottom">
                        <div className="d-flex align-items-center gap-2">
                          <div className="position-relative">
                            <span className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle" style={{width: 32, height: 32, fontWeight: 700, fontSize: 14}}>
                              {getInitial(userInfo.name || userInfo.username)}
                            </span>
                            <div 
                              className="position-absolute rounded-circle border border-2 border-white"
                              style={{
                                width: 10,
                                height: 10,
                                backgroundColor: getStatusColor(),
                                bottom: -1,
                                right: -1
                              }}
                            ></div>
                          </div>
                          <div>
                            <div className="fw-bold">{userInfo.name || userInfo.username}</div>
                            <small className="text-muted">{userInfo.email}</small>
                          </div>
                        </div>
                      </div>
                      
                      <LinkContainer to="/profile">
                        <NavDropdown.Item><i className="bi bi-person me-2"></i>Hồ sơ cá nhân</NavDropdown.Item>
                      </LinkContainer>
                      
                      <LinkContainer to="/profile/security">
                        <NavDropdown.Item><i className="bi bi-shield-lock me-2"></i>Bảo mật tài khoản</NavDropdown.Item>
                      </LinkContainer>
                      
                      <LinkContainer to="/profile/activity">
                        <NavDropdown.Item><i className="bi bi-clock-history me-2"></i>Lịch sử hoạt động</NavDropdown.Item>
                      </LinkContainer>
                      
                      <NavDropdown.Divider />
                      
                      <NavDropdown.Item>
                        <div className="d-flex justify-content-between align-items-center">
                          <span><i className="bi bi-circle me-2" style={{color: getStatusColor()}}></i>Trạng thái</span>
                          <select 
                            className="form-select form-select-sm" 
                            style={{width: 'auto'}}
                            value={userInfo.status || 'online'}
                            onChange={(e) => {/* Handle status change */}}
                          >
                            <option value="online">Trực tuyến</option>
                            <option value="busy">Bận</option>
                            <option value="away">Vắng mặt</option>
                            <option value="offline">Ngoại tuyến</option>
                          </select>
                        </div>
                      </NavDropdown.Item>
                      
                      <NavDropdown.Divider />
                      
                      <NavDropdown.Item onClick={logout} className="text-danger fw-bold">
                        <i className="bi bi-box-arrow-right me-2"></i>Đăng xuất
                      </NavDropdown.Item>
                    </NavDropdown>
                </>
              ) : (
                <LinkContainer to="/login">
                  <Nav.Link className="nav-link-custom px-4 py-2 rounded-pill bg-white text-primary fw-bold shadow-sm" style={{fontSize: '1.08rem', border: '1.5px solid #00CCFF'}}>
                    <i className="bi bi-person-circle me-1"></i> Đăng nhập
                  </Nav.Link>
                </LinkContainer>
              )}
              
              {/* Admin Menu */}
              {isAdmin() && (
                <NavDropdown 
                  title={<span><i className="bi bi-shield-lock me-1"></i>Quản trị hệ thống</span>} 
                  id="adminmenu" 
                  className="nav-link-custom"
                  align="end"
                >
                  <NavDropdown.Header>Quản lý người dùng</NavDropdown.Header>
                  <LinkContainer to="/users">
                    <NavDropdown.Item><i className="bi bi-people me-2"></i>Danh sách người dùng</NavDropdown.Item>
                  </LinkContainer>
                  <LinkContainer to="/users/roles">
                    <NavDropdown.Item><i className="bi bi-person-badge me-2"></i>Phân quyền</NavDropdown.Item>
                  </LinkContainer>
                  <LinkContainer to="/users/activity-log">
                    <NavDropdown.Item><i className="bi bi-journal-text me-2"></i>Nhật ký hoạt động</NavDropdown.Item>
                  </LinkContainer>
                  
                  <NavDropdown.Divider />
                  <NavDropdown.Header>Hệ thống</NavDropdown.Header>
                  <LinkContainer to="/admin/system-config">
                    <NavDropdown.Item><i className="bi bi-gear me-2"></i>Cấu hình hệ thống</NavDropdown.Item>
                  </LinkContainer>
                  <LinkContainer to="/admin/backup">
                    <NavDropdown.Item><i className="bi bi-cloud-upload me-2"></i>Sao lưu dữ liệu</NavDropdown.Item>
                  </LinkContainer>
                  <LinkContainer to="/admin/maintenance">
                    <NavDropdown.Item><i className="bi bi-tools me-2"></i>Bảo trì hệ thống</NavDropdown.Item>
                  </LinkContainer>
                  
                  <NavDropdown.Divider />
                  <NavDropdown.Header>Báo cáo & Thống kê</NavDropdown.Header>
                  <LinkContainer to="/admin/reports">
                    <NavDropdown.Item><i className="bi bi-graph-up me-2"></i>Báo cáo tổng hợp</NavDropdown.Item>
                  </LinkContainer>
                  <LinkContainer to="/admin/analytics">
                    <NavDropdown.Item><i className="bi bi-bar-chart me-2"></i>Phân tích dữ liệu</NavDropdown.Item>
                  </LinkContainer>
                  <LinkContainer to="/admin/audit-trail">
                    <NavDropdown.Item><i className="bi bi-file-text me-2"></i>Kiểm toán hệ thống</NavDropdown.Item>
                  </LinkContainer>
                </NavDropdown>
              )}
              
              {/* Manager Menu */}
              {isManager() && (
                <NavDropdown 
                  title={<span><i className="bi bi-person-gear me-1"></i>Quản lý</span>} 
                  id="managermenu" 
                  className="nav-link-custom"
                  align="end"
                >
                  <NavDropdown.Header>Báo cáo</NavDropdown.Header>
                  <LinkContainer to="/manager/reports/monthly">
                    <NavDropdown.Item><i className="bi bi-calendar-month me-2"></i>Báo cáo tháng</NavDropdown.Item>
                  </LinkContainer>
                  <LinkContainer to="/manager/reports/financial">
                    <NavDropdown.Item><i className="bi bi-currency-dollar me-2"></i>Báo cáo tài chính</NavDropdown.Item>
                  </LinkContainer>
                  <LinkContainer to="/manager/reports/occupancy">
                    <NavDropdown.Item><i className="bi bi-house-check me-2"></i>Báo cáo lưu trú</NavDropdown.Item>
                  </LinkContainer>
                  
                  <NavDropdown.Divider />
                  <NavDropdown.Header>Quản lý vận hành</NavDropdown.Header>
                  <LinkContainer to="/manager/maintenance-schedule">
                    <NavDropdown.Item><i className="bi bi-calendar-check me-2"></i>Kế hoạch bảo trì</NavDropdown.Item>
                  </LinkContainer>
                  <LinkContainer to="/manager/service-requests">
                    <NavDropdown.Item><i className="bi bi-clipboard-check me-2"></i>Yêu cầu dịch vụ</NavDropdown.Item>
                  </LinkContainer>
                </NavDropdown>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Quick Search Modal */}
      <Modal show={showSearch} onHide={() => setShowSearch(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title><i className="bi bi-search me-2"></i>Tìm kiếm nhanh</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSearchSubmit}>
            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                placeholder="Tìm kiếm cư dân, căn hộ, phương tiện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                size="lg"
              />
            </Form.Group>
            <div className="d-flex gap-2">
              <Button variant="primary" type="submit" disabled={!searchQuery.trim()}>
                <i className="bi bi-search me-1"></i>Tìm kiếm
              </Button>
              <Button variant="outline-secondary" onClick={() => setShowSearch(false)}>
                Hủy
              </Button>
            </div>
          </Form>
          
          <hr />
          <div>
            <h6>Tìm kiếm gần đây:</h6>
            <div className="d-flex flex-wrap gap-1">
              {['Căn hộ A101', 'Nguyễn Văn A', 'Phí tháng 11'].map((term, index) => (
                <Button 
                  key={index}
                  variant="outline-secondary" 
                  size="sm"
                  onClick={() => setSearchQuery(term)}
                >
                  {term}
                </Button>
              ))}
            </div>
          </div>
        </Modal.Body>
      </Modal>

      
    </>
  );
};

export default Header; 