import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Card, Table, Button, Form, Badge, Alert, Spinner, InputGroup } from 'react-bootstrap';
import { FaCogs, FaPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaWrench, FaExclamationTriangle } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';

const FacilityListScreen = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [search, setSearch] = useState('');
  const [loaiTienIch, setLoaiTienIch] = useState('');
  const [trangThai, setTrangThai] = useState('');
  const [mucDoUuTien, setMucDoUuTien] = useState('');
  const [canBaoTri, setCanBaoTri] = useState('');
  
  // Delete modal
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  
  const { userInfo } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchFacilities = async (page = 1) => {
    try {
      setLoading(true);
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const params = {
        page,
        limit: 10,
        search,
        loaiTienIch,
        trangThai,
        mucDoUuTien,
        canBaoTri
      };

      const { data } = await axios.get('/api/facilities', { ...config, params });
      
      setFacilities(data.facilities);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setError('');
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể tải danh sách tiện ích'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, [search, loaiTienIch, trangThai, mucDoUuTien, canBaoTri]);

  const handleDelete = (id) => {
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
      
      await axios.delete(`/api/facilities/${deleteId}`, config);
      setSuccess('Tiện ích đã được xóa thành công');
      fetchFacilities(currentPage);
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể xóa tiện ích'
      );
      setLoading(false);
    }
    setDeleteId(null);
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

  const getPriorityBadge = (mucDoUuTien) => {
    switch (mucDoUuTien) {
      case 'Rất cao':
        return 'danger';
      case 'Cao':
        return 'warning';
      case 'Trung bình':
        return 'info';
      case 'Thấp':
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

  const isMaintenanceDue = (facility) => {
    if (!facility.baoTriTiepTheo) return false;
    return new Date() >= new Date(facility.baoTriTiepTheo);
  };

  return (
    <div className="facility-list-screen">
      {/* Hero Section */}
      <div className="hero-section mb-4">
        <Row className="align-items-center">
          <Col>
            <h1 className="hero-title mb-0">
              <FaCogs className="me-3" />
              Quản Lý Tiện Ích
            </h1>
            <p className="hero-subtitle mb-0">
              Theo dõi tình trạng và bảo trì các tiện ích chung cư
            </p>
          </Col>
          <Col xs="auto">
            {(userInfo.role === 'admin' || userInfo.role === 'manager') && (
              <Button
                as={Link}
                to="/facilities/new"
                variant="success"
                className="gradient-btn-success"
              >
                <FaPlus className="me-2" />
                Thêm Tiện Ích Mới
              </Button>
            )}
          </Col>
        </Row>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Filters */}
      <Card className="mb-4 shadow-lg border-info">
        <Card.Header className="bg-info text-white d-flex align-items-center">
          <FaFilter className="me-2" />
          <span className="fw-bold">Bộ lọc tìm kiếm</span>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label><FaSearch className="me-1" /> Tìm kiếm</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Tên tiện ích, vị trí, nhà cung cấp..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group className="mb-3">
                <Form.Label>Loại tiện ích</Form.Label>
                <Form.Select
                  value={loaiTienIch}
                  onChange={(e) => setLoaiTienIch(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="Thang máy">Thang máy</option>
                  <option value="Máy phát điện">Máy phát điện</option>
                  <option value="Máy bơm nước">Máy bơm nước</option>
                  <option value="Hệ thống PCCC">Hệ thống PCCC</option>
                  <option value="Hệ thống điều hòa">Điều hòa</option>
                  <option value="Camera an ninh">Camera an ninh</option>
                  <option value="Cổng tự động">Cổng tự động</option>
                  <option value="Khác">Khác</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group className="mb-3">
                <Form.Label>Trạng thái</Form.Label>
                <Form.Select
                  value={trangThai}
                  onChange={(e) => setTrangThai(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="Hoạt động bình thường">Hoạt động bình thường</option>
                  <option value="Đang bảo trì">Đang bảo trì</option>
                  <option value="Hỏng hóc">Hỏng hóc</option>
                  <option value="Ngừng hoạt động">Ngừng hoạt động</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group className="mb-3">
                <Form.Label>Mức độ ưu tiên</Form.Label>
                <Form.Select
                  value={mucDoUuTien}
                  onChange={(e) => setMucDoUuTien(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="Rất cao">Rất cao</option>
                  <option value="Cao">Cao</option>
                  <option value="Trung bình">Trung bình</option>
                  <option value="Thấp">Thấp</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group className="mb-3">
                <Form.Label>Cần bảo trì</Form.Label>
                <Form.Select
                  value={canBaoTri}
                  onChange={(e) => setCanBaoTri(e.target.value)}
                >
                  <option value="">Tất cả</option>
                  <option value="true">Cần bảo trì</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Results Summary */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="text-muted">
          Tìm thấy <strong>{total}</strong> tiện ích
        </span>
      </div>

      {/* Facilities Table */}
      <Card className="shadow-lg">
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Đang tải dữ liệu...</p>
            </div>
          ) : facilities.length === 0 ? (
            <div className="text-center py-4">
              <FaCogs size={48} className="text-muted mb-3" />
              <p className="text-muted">Không có tiện ích nào</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="table-dark">
                <tr>
                  <th>Tên Tiện Ích</th>
                  <th>Loại</th>
                  <th>Vị Trí</th>
                  <th>Trạng Thái</th>
                  <th>Ưu Tiên</th>
                  <th>Bảo Trì Tiếp Theo</th>
                  <th>Chi Phí Bảo Trì</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {facilities.map((facility) => (
                  <tr key={facility._id}>
                    <td>
                      <div>
                        <strong>{facility.tenTienIch}</strong>
                        {isMaintenanceDue(facility) && (
                          <FaExclamationTriangle className="text-warning ms-2" title="Cần bảo trì" />
                        )}
                      </div>
                      <small className="text-muted">{facility.nhaCungCap}</small>
                    </td>
                    <td>
                      <Badge bg="secondary">{facility.loaiTienIch}</Badge>
                    </td>
                    <td>{facility.viTri}</td>
                    <td>
                      <Badge bg={getBadgeVariant(facility.trangThai)}>
                        {facility.trangThai}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={getPriorityBadge(facility.mucDoUuTien)}>
                        {facility.mucDoUuTien}
                      </Badge>
                    </td>
                    <td>
                      {facility.baoTriTiepTheo ? (
                        <span className={isMaintenanceDue(facility) ? 'text-danger fw-bold' : ''}>
                          {formatDate(facility.baoTriTiepTheo)}
                        </span>
                      ) : (
                        <span className="text-muted">Chưa lên lịch</span>
                      )}
                    </td>
                    <td>{formatCurrency(facility.chiPhiBaoTri)}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          as={Link}
                          to={`/facilities/${facility._id}`}
                          variant="outline-info"
                          size="sm"
                        >
                          <FaEdit />
                        </Button>
                        {(userInfo.role === 'admin' || userInfo.role === 'manager') && (
                          <Button
                            variant="outline-success"
                            size="sm"
                            as={Link}
                            to={`/facilities/${facility._id}/maintenance`}
                          >
                            <FaWrench />
                          </Button>
                        )}
                        {userInfo.role === 'admin' && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(facility._id)}
                          >
                            <FaTrash />
                          </Button>
                        )}
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
          <Button
            variant="outline-primary"
            disabled={currentPage === 1}
            onClick={() => fetchFacilities(currentPage - 1)}
            className="me-2"
          >
            Trước
          </Button>
          <span className="align-self-center mx-3">
            Trang {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline-primary"
            disabled={currentPage === totalPages}
            onClick={() => fetchFacilities(currentPage + 1)}
            className="ms-2"
          >
            Sau
          </Button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        show={showConfirm}
        onHide={() => setShowConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa tiện ích"
        message="Bạn có chắc chắn muốn xóa tiện ích này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        loading={loading}
      />
    </div>
  );
};

export default FacilityListScreen; 