import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { FaCogs, FaSave, FaArrowLeft, FaPlus, FaEdit } from 'react-icons/fa';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const FacilityFormScreen = () => {
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
    tinhTrangBaoHanh: 'Không có bảo hành'
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { userInfo } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

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
            thongSoKyThuat: data.thongSoKyThuat || {
              congSuat: '',
              dienAp: '',
              donViTinh: '',
              thongSoKhac: ''
            }
          });
          
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
  }, [id, isEdit, userInfo.token]);

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
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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