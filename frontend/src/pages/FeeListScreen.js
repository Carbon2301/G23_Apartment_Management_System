import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Row, Col, Card } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { Link } from 'react-router-dom';
import Message from '../components/common/Message';
import Loader from '../components/common/Loader';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import ConfirmDeleteModal from '../components/common/ConfirmDeleteModal';

const FeeListScreen = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  
  const { userInfo } = useContext(AuthContext);
  
  // Check if user is admin
  const isAdmin = userInfo && userInfo.role === 'admin';
  
  useEffect(() => {
    fetchFees();
  }, []);
  
  const fetchFees = async () => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const { data } = await axios.get('/api/fees', config);
      
      setFees(data);
      setLoading(false);
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể tải danh sách phí'
      );
      setLoading(false);
    }
  };
  
  const deleteFeeHandler = async (id) => {
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
      await axios.delete(`/api/fees/${deleteId}`, config);
      fetchFees();
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể xóa khoản phí'
      );
      setLoading(false);
    }
    setDeleteId(null);
  };
  
  // Function to translate fee type into Vietnamese
  const translateFeeType = (feeType) => {
    const translations = {
      'mandatory': 'Bắt buộc',
      'service': 'Dịch vụ',
      'maintenance': 'Bảo trì',
      'voluntary': 'Tự nguyện',
      'contribution': 'Đóng góp',
      'parking': 'Đỗ xe',
      'utilities': 'Tiện ích'
    };
    
    return translations[feeType] || feeType;
  };
  
  return (
    <>
      <Row className="align-items-center mb-3">
        <Col>
          <h1>Danh Sách Phí</h1>
        </Col>
        <Col className="text-right">
          <Link to="/fees/create" className="btn btn-primary">
            <i className="fas fa-plus"></i> Thêm Phí Mới
          </Link>
        </Col>
      </Row>
      
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <Card className="shadow-lg border-0 rounded-4">
          <Card.Header className="bg-white border-0 rounded-top-4 pb-2 d-flex align-items-center justify-content-between">
            <span className="fw-bold fs-5 text-primary"><i className="bi bi-cash-stack me-2"></i>Danh sách phí</span>
            <span className="text-muted small">Tổng: {fees.length}</span>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 household-table">
                <thead className="table-light">
                  <tr>
                    <th className="fw-bold">Mã Phí</th>
                    <th className="fw-bold">Tên</th>
                    <th className="fw-bold">Loại</th>
                    <th className="fw-bold">Số Tiền</th>
                    <th className="fw-bold">Ngày Bắt Đầu</th>
                    <th className="fw-bold">Ngày Kết Thúc</th>
                    <th className="fw-bold text-center">Trạng Thái</th>
                    <th className="fw-bold text-center col-action" style={{width: '1%', whiteSpace: 'nowrap'}}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((fee) => (
                    <tr key={fee._id} className="table-row-hover">
                      <td className="align-middle">{fee.feeCode}</td>
                      <td className="align-middle"><i className="bi bi-receipt me-1 text-primary"></i>{fee.name}</td>
                      <td className="align-middle">{translateFeeType(fee.feeType)}</td>
                      <td className="align-middle">{fee.amount.toLocaleString()} VND</td>
                      <td className="align-middle">{fee.startDate ? new Date(fee.startDate).toLocaleDateString('vi-VN') : 'N/A'}</td>
                      <td className="align-middle">{fee.endDate ? new Date(fee.endDate).toLocaleDateString('vi-VN') : 'N/A'}</td>
                      <td className="text-center align-middle">
                        {fee.active ? (
                          <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill">
                            <i className="bi bi-check-circle me-1"></i>Đang kích hoạt
                          </span>
                        ) : (
                          <span className="badge bg-danger bg-opacity-10 text-danger px-3 py-2 rounded-pill">
                            <i className="bi bi-x-circle me-1"></i>Vô hiệu hóa
                          </span>
                        )}
                      </td>
                      <td className="text-center align-middle col-action" style={{width: '1%', whiteSpace: 'nowrap'}}>
                        <div className="d-flex justify-content-center gap-1">
                          <LinkContainer to={`/fees/${fee._id}`}>
                            <Button variant="light" className="mx-1 small" title="Chỉnh sửa" style={{fontSize: '0.85rem', borderRadius: '1rem'}}>
                              Chỉnh sửa
                            </Button>
                          </LinkContainer>
                          {isAdmin && (
                            <Button
                              variant="danger"
                              className="mx-1 small"
                              onClick={() => deleteFeeHandler(fee._id)}
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
            {fees.length === 0 && (
              <Message>Không tìm thấy khoản phí nào</Message>
            )}
          </Card.Body>
        </Card>
      )}
      <ConfirmDeleteModal
        show={showConfirm}
        onHide={() => setShowConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa khoản phí"
        message="Bạn có chắc chắn muốn xóa khoản phí này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        loading={loading}
      />
    </>
  );
};

export default FeeListScreen; 