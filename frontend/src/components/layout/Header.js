import React, { useContext } from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import AuthContext from '../../context/AuthContext';

const Header = () => {
  const { userInfo, logout } = useContext(AuthContext);
  
  // Helper function to check if user is admin
  const isAdmin = () => userInfo && userInfo.role === 'admin';
  
  // Helper function to check if user is manager
  const isManager = () => userInfo && userInfo.role === 'manager';
  
  // Helper function to format user role
  const formatUserRole = (role) => {
    if (role === 'admin') {
      return 'Quản trị';
    } else if (role === 'manager') {
      return 'Quản lý';
    } else {
      return role;
    }
  };
  
  // Lấy chữ cái đầu cho avatar
  const getInitial = (name) => {
    if (!name) return 'U';
    return name.trim().charAt(0).toUpperCase();
  };
  
  return (
    <header>
      <Navbar
        expand="lg"
        className="py-2 px-0"
        style={{
          background: 'linear-gradient(90deg, #2193b0 0%, #6dd5ed 100%)',
          borderRadius: '0 0 1.5rem 1.5rem',
          boxShadow: '0 2px 16px 0 rgba(33, 147, 176, 0.13)',
        }}
      >
        <Container fluid>
          <LinkContainer to={userInfo ? '/dashboard' : '/'}>
            <Navbar.Brand className="d-flex align-items-center gap-2 fw-bold fs-4 text-white">
              <div className="d-inline-flex align-items-center justify-content-center bg-white bg-opacity-90 rounded-circle shadow-sm" style={{width: 48, height: 48, padding: '2px'}}>
                <img 
                  src="/logo.svg" 
                  alt="BlueMoon Logo" 
                  style={{
                    width: '40px', 
                    height: '40px', 
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    // Fallback to icon if logo not found
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'inline-flex';
                  }}
                />
                <i 
                  className="bi bi-building text-white" 
                  style={{
                    fontSize: 28, 
                    display: 'none'
                  }}
                ></i>
              </div>
              <div className="d-flex flex-column">
                <span className="ms-2 text-white" style={{letterSpacing: 1, fontSize: '1.3rem', lineHeight: '1.2'}}>
                  Chung Cư BlueMoon
                </span>
                <span className="ms-2 text-white-50" style={{fontSize: '0.75rem', fontWeight: 'normal'}}>
                  Apartment Management System
                </span>
              </div>
            </Navbar.Brand>
          </LinkContainer>
          
          <Navbar.Toggle aria-controls="main-navbar" />
          <Navbar.Collapse id="main-navbar">
            <Nav className="ms-auto align-items-center gap-2 gap-lg-3 fw-semibold">
              {userInfo ? (
                <>
                  <LinkContainer to="/dashboard">
                    <Nav.Link className="nav-link-custom">
                      <i className="bi bi-speedometer2 me-1"></i> Tổng quan
                    </Nav.Link>
                  </LinkContainer>
                  
                  <LinkContainer to="/households">
                    <Nav.Link className="nav-link-custom">
                      <i className="bi bi-house-door me-1"></i> Hộ gia đình
                    </Nav.Link>
                  </LinkContainer>
                  
                  <LinkContainer to="/residents">
                    <Nav.Link className="nav-link-custom">
                      <i className="bi bi-people me-1"></i> Cư dân
                    </Nav.Link>
                  </LinkContainer>
                  
                  <LinkContainer to="/vehicles">
                    <Nav.Link className="nav-link-custom">
                      <i className="bi bi-car-front me-1"></i> Phương tiện
                    </Nav.Link>
                  </LinkContainer>
                  
                  <LinkContainer to="/facilities">
                    <Nav.Link className="nav-link-custom">
                      <i className="bi bi-gear me-1"></i> Tiện ích
                    </Nav.Link>
                  </LinkContainer>
                  
                  <NavDropdown
                    title={
                      <>
                        <i className="bi bi-cash-stack me-1"></i> Phí
                      </>
                    }
                    id="fee-menu"
                    className="nav-link-custom"
                  >
                    <LinkContainer to="/fees">
                      <NavDropdown.Item>Danh sách phí</NavDropdown.Item>
                    </LinkContainer>
                    <LinkContainer to="/vehicle-fees">
                      <NavDropdown.Item>Phí xe</NavDropdown.Item>
                    </LinkContainer>
                    <LinkContainer to="/area-fees">
                      <NavDropdown.Item>Phí theo diện tích</NavDropdown.Item>
                    </LinkContainer>
                  </NavDropdown>
                  
                  <NavDropdown
                    title={
                      <>
                        <i className="bi bi-credit-card-2-front me-1"></i> Thanh toán
                      </>
                    }
                    id="payment-menu"
                    className="nav-link-custom"
                  >
                    <LinkContainer to="/payments">
                      <NavDropdown.Item >Danh sách thanh toán</NavDropdown.Item>
                    </LinkContainer>
                    <LinkContainer to="/payments/create">
                      <NavDropdown.Item>Tạo thanh toán mới</NavDropdown.Item>
                    </LinkContainer>
                    <LinkContainer to="/payments/search">
                      <NavDropdown.Item>Tìm kiếm thanh toán</NavDropdown.Item>
                    </LinkContainer>
                  </NavDropdown>
                  
                  {/* User dropdown menu */}
                  <NavDropdown
                    align="end"
                    title={
                      <span className="d-flex align-items-center gap-2 user-dropdown-toggle">
                        <span className="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-circle" style={{width: 36, height: 36, fontWeight: 700, fontSize: 18}}>
                          {getInitial(userInfo.name || userInfo.username)}
                        </span>
                        <span className="fw-bold text-white">{userInfo.name || userInfo.username}</span>
                        <span className="text-white-50 small">({formatUserRole(userInfo.role)})</span>
                      </span>
                    }
                    id="username"
                    className="nav-link-custom user-dropdown-align"
                  >
                    <LinkContainer to="/profile">
                      <NavDropdown.Item>Hồ sơ</NavDropdown.Item>
                    </LinkContainer>
                    <NavDropdown.Item onClick={logout} className="text-danger fw-bold">
                      Đăng xuất
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
              
              {/* Admin menu - only show if user is admin */}
              {isAdmin() && (
                <NavDropdown title={<span><i className="bi bi-shield-lock me-1"></i>Quản trị</span>} id="adminmenu" className="nav-link-custom">
                  <LinkContainer to="/users">
                    <NavDropdown.Item>Quản lý người dùng</NavDropdown.Item>
                  </LinkContainer>
                  <LinkContainer to="/admin/reports">
                    <NavDropdown.Item>Báo cáo</NavDropdown.Item>
                  </LinkContainer>
                </NavDropdown>
              )}
              
              {/* Manager menu - only show if user is manager */}
              {isManager() && (
                <NavDropdown title={<span><i className="bi bi-person-gear me-1"></i>Quản lý</span>} id="managermenu" className="nav-link-custom">
                  <LinkContainer to="/admin/reports">
                    <NavDropdown.Item>Báo cáo</NavDropdown.Item>
                  </LinkContainer>
                </NavDropdown>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      {/* Thêm CSS custom cho nav-link-custom vào custom-theme.css:
      .nav-link-custom { font-size: 1.08rem !important; border-radius: 1.2rem; padding: 0.5rem 1.2rem; transition: background 0.18s, color 0.18s; }
      .nav-link-custom:hover, .nav-link-custom:focus, .nav-link-custom.active { background: #e0faff !important; color: #00CCFF !important; }
      */}
    </header>
  );
};

export default Header; 