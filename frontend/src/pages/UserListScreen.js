import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Row, Col, Form, InputGroup, Card } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate } from 'react-router-dom';
import Message from '../components/common/Message';
import Loader from '../components/common/Loader';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';

const UserListScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext);
  
  useEffect(() => {
    // Chỉ admin mới được truy cập trang này
    if (!userInfo || userInfo.role !== 'admin') {
      navigate('/');
      return;
    }
    
    fetchUsers();
  }, [userInfo, navigate]);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const { data } = await axios.get('/api/users', config);
      
      setUsers(data);
      setLoading(false);
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể tải danh sách người dùng'
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
      await axios.delete(`/api/users/${deleteId}`, config);
      setSuccess('Đã xóa người dùng thành công');
      fetchUsers();
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể xóa người dùng'
      );
      setLoading(false);
    }
    setDeleteId(null);
  };
  
  // Lọc danh sách người dùng theo từ khóa tìm kiếm
  const filteredUsers = users.filter(
    (user) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.username?.toLowerCase().includes(searchLower) ||
        user.fullName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.role?.toLowerCase().includes(searchLower)
      );
    }
  );
  
  // Hàm định dạng tên vai trò
  const formatRole = (role) => {
    switch (role) {
      case 'admin':
        return 'Quản trị viên';
      case 'manager':
        return 'Quản lý';
      case 'accountant':
        return 'Kế toán';
      default:
        return role;
    }
  };
  
  return (
    <>
      <Row className="align-items-center mb-3">
        <Col>
          <h1>Quản Lý Người Dùng</h1>
        </Col>
        <Col className="text-end">
          <Button 
            className="btn-sm"
            onClick={() => navigate('/users/create')}
          >
            <i className="fas fa-plus"></i> Thêm Người Dùng
          </Button>
        </Col>
      </Row>

      {success && <Message variant="success">{success}</Message>}
      {error && <Message variant="danger">{error}</Message>}

      <Row className="mb-3">
        <Col md={6}>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Tìm kiếm người dùng..."
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
      ) : (
        <Card className="shadow-lg border-0 rounded-4">
          <Card.Header className="bg-white border-0 rounded-top-4 pb-2 d-flex align-items-center justify-content-between">
            <span className="fw-bold fs-5 text-primary"><i className="bi bi-people me-2"></i>Danh sách người dùng</span>
            <span className="text-muted small">Tổng: {filteredUsers.length}</span>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 household-table">
                <thead className="table-light">
                  <tr>
                    <th className="fw-bold">Mã</th>
                    <th className="fw-bold">Tên đăng nhập</th>
                    <th className="fw-bold">Họ và tên</th>
                    <th className="fw-bold">Email</th>
                    <th className="fw-bold">Vai trò</th>
                    <th className="fw-bold text-center">Trạng thái</th>
                    <th className="fw-bold text-center col-action" style={{width: '1%', whiteSpace: 'nowrap'}}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="table-row-hover">
                      <td className="align-middle">{user._id}</td>
                      <td className="align-middle"><i className="bi bi-person-badge me-1 text-primary"></i>{user.username}</td>
                      <td className="align-middle">{user.fullName}</td>
                      <td className="align-middle">{user.email || 'Chưa cung cấp'}</td>
                      <td className="align-middle">{formatRole(user.role)}</td>
                      <td className="text-center align-middle">
                        {user.active ? (
                          <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill">
                            <i className="bi bi-check-circle me-1"></i>Hoạt động
                          </span>
                        ) : (
                          <span className="badge bg-danger bg-opacity-10 text-danger px-3 py-2 rounded-pill">
                            <i className="bi bi-x-circle me-1"></i>Đã vô hiệu hóa
                          </span>
                        )}
                      </td>
                      <td className="text-center align-middle col-action" style={{width: '1%', whiteSpace: 'nowrap'}}>
                        <div className="d-flex justify-content-center gap-1">
                          <LinkContainer to={`/users/${user._id}/edit`}>
                            <Button variant="light" className="mx-1 small" title="Chỉnh sửa" style={{fontSize: '0.85rem', borderRadius: '1rem'}}>
                              Chỉnh sửa
                            </Button>
                          </LinkContainer>
                          <Button
                            variant="danger"
                            className="mx-1 small"
                            onClick={() => deleteHandler(user._id)}
                            disabled={user._id === userInfo._id}
                            title="Xóa"
                            style={{fontSize: '0.85rem', borderRadius: '1rem'}}
                          >
                            Xóa
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && (
              <Message>Không tìm thấy người dùng nào</Message>
            )}
          </Card.Body>
        </Card>
      )}
      <ConfirmDeleteModal
        show={showConfirm}
        onHide={() => setShowConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa người dùng"
        message="Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        loading={loading}
      />
    </>
  );
};

export default UserListScreen; 