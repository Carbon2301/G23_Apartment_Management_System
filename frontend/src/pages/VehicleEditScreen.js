import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaArrowLeft, FaCar, FaUser, FaHome } from 'react-icons/fa';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const VehicleEditScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { userInfo } = useContext(AuthContext);
  const isEditing = Boolean(id);

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
    note: ''
  });

  const [households, setHouseholds] = useState([]);
  const [residents, setResidents] = useState([]);
  const [filteredResidents, setFilteredResidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (userInfo) {
      fetchHouseholds();
      if (isEditing) {
        fetchVehicle();
      }
    }
  }, [id, isEditing, userInfo]);

  useEffect(() => {
    if (userInfo && formData.household) {
      fetchResidentsByHousehold(formData.household);
    } else {
      setFilteredResidents([]);
      setFormData(prev => ({ ...prev, owner: '' }));
    }
  }, [formData.household, userInfo]);

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