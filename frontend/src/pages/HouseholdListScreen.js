import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Row, Col, Form, InputGroup, Card } from 'react-bootstrap';
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
  
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext);
  
  useEffect(() => {
    fetchHouseholds();
  }, [userInfo]);
  
  const fetchHouseholds = async () => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const { data } = await axios.get('/api/households', config);
      
      setHouseholds(data);
      setLoading(false);
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể tải danh sách hộ gia đình'
      );
      setLoading(false);
    }
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
      await axios.delete(`/api/households/${deleteId}`, config);
      fetchHouseholds();
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể xóa hộ gia đình'
      );
      setLoading(false);
    }
    setDeleteId(null);
  };
  
  const filteredHouseholds = households.filter(
    (household) =>
      household.apartmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      household.address.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
                  </p>
                </div>
              </div>
            </Col>
            
            <Col lg={4} className="text-end">
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
      
      {/* Main Content */}
      {loading ? (
        <div className="text-center py-5">
          <Loader />
        </div>
      ) : error ? (
        <Message variant="danger">{error}</Message>
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
                    {filteredHouseholds.map((household, index) => (
                      <tr 
                        key={household._id} 
                        style={{
                          transition: 'all 0.3s ease',
                          borderBottom: '1px solid rgba(0,0,0,0.05)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
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
    </div>
  );
};

export default HouseholdListScreen; 