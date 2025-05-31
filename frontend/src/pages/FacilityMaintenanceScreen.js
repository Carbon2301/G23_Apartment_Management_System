import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaWrench, FaSave, FaArrowLeft, FaTools, FaCalendarAlt } from 'react-icons/fa';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const FacilityMaintenanceScreen = () => {
  const [facility, setFacility] = useState(null);
  const [formData, setFormData] = useState({
    ngayBaoTri: new Date().toISOString().split('T')[0],
    chiPhiBaoTri: '',
    baoTriTiepTheo: '',
    ghiChuBaoTri: '',
    trangThaiSauBaoTri: 'Hoạt động bình thường'
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingFacility, setLoadingFacility] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { userInfo } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();

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
          baoTriTiepTheo: nextMaintenanceDate.toISOString().split('T')[0]
        }));
        
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
  }, [id, userInfo.token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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