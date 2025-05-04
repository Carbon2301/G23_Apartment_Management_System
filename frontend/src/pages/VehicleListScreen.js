import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Table, Button, Form, Card, Badge, Modal, Alert, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaCar, FaMotorcycle, FaBicycle, FaBolt } from 'react-icons/fa';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const VehicleListScreen = () => {
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVehicles, setTotalVehicles] = useState(0);

  useEffect(() => {
    fetchVehicles();
  }, [currentPage, searchKeyword, statusFilter, typeFilter]);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10
      });

      if (searchKeyword) params.append('keyword', searchKeyword);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('vehicleType', typeFilter);

      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const response = await axios.get(`/api/vehicles?${params}`, config);
      const data = response.data;

      setVehicles(data.vehicles);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
      setTotalVehicles(data.totalVehicles);
      setError('');
    } catch (error) {
      setError('Có lỗi xảy ra khi tải danh sách xe');
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchVehicles();
  };

  const handleDelete = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      await axios.delete(`/api/vehicles/${vehicleToDelete._id}`, config);
      setShowDeleteModal(false);
      setVehicleToDelete(null);
      fetchVehicles();
    } catch (error) {
      setError('Có lỗi xảy ra khi xóa xe');
      console.error('Error deleting vehicle:', error);
    }
  };

  const getVehicleIcon = (type) => {
    switch (type) {
      case 'Ô tô':
        return <FaCar className="me-1" />;
      case 'Xe máy':
        return <FaMotorcycle className="me-1" />;
      case 'Xe đạp':
        return <FaBicycle className="me-1" />;
      case 'Xe điện':
        return <FaBolt className="me-1" />;
      default:
        return <FaCar className="me-1" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'Đang sử dụng': 'success',
      'Tạm ngưng': 'warning',
      'Đã bán': 'danger'
    };
    return <Badge bg={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="vehicle-list-screen">
      {/* Hero Section */}
      <div className="hero-section mb-4">
        <Row className="align-items-center">
          <Col md={8}>
            <h1 className="hero-title mb-0">
              <FaCar className="me-3" />
              Quản Lý Xe
            </h1>
            <p className="hero-subtitle mb-0">
              Quản lý thông tin xe theo hộ gia đình
            </p>
          </Col>
          <Col md={4} className="text-end">
            <div className="stats-card">
              <h3 className="stats-number text-white">{totalVehicles}</h3>
              <p className="stats-label">Tổng số xe</p>
            </div>
          </Col>
        </Row>
      </div>

      {/* Search and Filter Section */}
      <Card className="search-card mb-4">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row className="align-items-end">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Tìm kiếm</Form.Label>
                  <div className="search-input-wrapper">
                    <FaSearch className="search-icon" />
                    <Form.Control
                      type="text"
                      placeholder="Tìm theo biển số, hãng, mẫu xe..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="search-input"
                    />
                  </div>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Loại xe</Form.Label>
                  <Form.Select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="">Tất cả loại xe</option>
                    <option value="Xe máy">Xe máy</option>
                    <option value="Ô tô">Ô tô</option>
                    <option value="Xe đạp">Xe đạp</option>
                    <option value="Xe điện">Xe điện</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">Tất cả trạng thái</option>
                    <option value="Đang sử dụng">Đang sử dụng</option>
                    <option value="Tạm ngưng">Tạm ngưng</option>
                    <option value="Đã bán">Đã bán</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <div className="d-grid gap-2">
                  <Button type="submit" variant="primary">
                    <FaSearch className="me-1" />
                    Tìm kiếm
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Action Buttons */}
      <div className="action-buttons mb-3">
        <Button
          variant="primary"
          onClick={() => navigate('/vehicles/create')}
          className="gradient-btn"
        >
          <FaPlus className="me-2" />
          Thêm xe mới
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      {/* Vehicles Table */}
      <Card className="table-card">
        <Card.Header className="table-header">
          <h5 className="mb-0">Danh sách xe ({totalVehicles})</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center p-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-muted">Không có xe nào được tìm thấy</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="table-header-gradient">
                <tr>
                  <th>Biển số</th>
                  <th>Loại xe</th>
                  <th>Hãng & Mẫu</th>
                  <th>Màu sắc</th>
                  <th>Chủ sở hữu</th>
                  <th>Hộ gia đình</th>
                  <th>Trạng thái</th>
                  <th>Ngày đăng ký</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle._id} className="table-row-hover">
                    <td>
                      <strong className="license-plate">{vehicle.licensePlate}</strong>
                    </td>
                    <td>
                      {getVehicleIcon(vehicle.vehicleType)}
                      {vehicle.vehicleType}
                    </td>
                    <td>
                      <div>
                        <strong>{vehicle.brand}</strong>
                        {vehicle.model && <div className="text-muted small">{vehicle.model}</div>}
                      </div>
                    </td>
                    <td>{vehicle.color}</td>
                    <td>
                      <div>
                        <strong>{vehicle.owner?.fullName}</strong>
                        {vehicle.owner?.identityCard && (
                          <div className="text-muted small">{vehicle.owner.identityCard}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <Badge bg="info" className="apartment-badge">
                        {vehicle.household?.apartmentNumber}
                      </Badge>
                    </td>
                    <td>{getStatusBadge(vehicle.status)}</td>
                    <td>{formatDate(vehicle.registrationDate)}</td>
                    <td>
                      <div className="action-buttons-group">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => navigate(`/vehicles/${vehicle._id}/edit`)}
                          className="me-1"
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => {
                            setVehicleToDelete(vehicle);
                            setShowDeleteModal(true);
                          }}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4">
          <Pagination>
            <Pagination.Prev
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            />
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Pagination.Item
                key={page}
                active={page === currentPage}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Pagination.Item>
            ))}
            <Pagination.Next
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            />
          </Pagination>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa xe</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Bạn có chắc chắn muốn xóa xe <strong>{vehicleToDelete?.licensePlate}</strong>?
          <br />
          Hành động này không thể hoàn tác.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default VehicleListScreen; 