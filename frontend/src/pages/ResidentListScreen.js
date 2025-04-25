import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Row, Col, Form, InputGroup, Card } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate } from 'react-router-dom';
import Message from '../components/common/Message';
import Loader from '../components/common/Loader';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';

const ResidentListScreen = () => {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext);
  
  useEffect(() => {
    fetchResidents();
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
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể tải danh sách cư dân'
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
  
  const filteredResidents = residents.filter(
    (resident) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        resident.fullName?.toLowerCase().includes(searchLower) ||
        resident.idCard?.toLowerCase().includes(searchLower) ||
        resident.phone?.toLowerCase().includes(searchLower) ||
        resident.household?.apartmentNumber?.toLowerCase().includes(searchLower)
      );
    }
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