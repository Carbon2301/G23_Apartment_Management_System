import React, { useState, useEffect, useContext } from 'react';
import { Table, Button, Row, Col, Form, InputGroup, Card } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate } from 'react-router-dom';
import Message from '../components/common/Message';
import Loader from '../components/common/Loader';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Badge } from 'react-bootstrap';

const PaymentListScreen = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext);
  
  // Check if user is admin
  const isAdmin = userInfo && (userInfo.role === 'admin' || userInfo.role === 'accountant');
  
  // Debug log to check user role
  console.log('User role:', userInfo?.role, 'isAdmin:', isAdmin);
  
  useEffect(() => {
    fetchPayments();
  }, [userInfo]);
  
  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const { data } = await axios.get('/api/payments', config);
      setPayments(data);
      setLoading(false);
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể tải danh sách thanh toán'
      );
      setLoading(false);
    }
  };
  
  const handleRefund = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn hoàn tiền khoản thanh toán này? Hành động này không thể hoàn tác.')) {
      try {
        setLoading(true);
        
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        
        await axios.put(`/api/payments/${id}/refund`, {}, config);
        
        fetchPayments();
      } catch (error) {
        setError(
          error.response && error.response.data.message
            ? error.response.data.message
            : 'Không thể hoàn tiền khoản thanh toán'
        );
        setLoading(false);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khoản thanh toán này? Hành động này không thể hoàn tác.')) {
      try {
        setLoading(true);
        
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        
        await axios.delete(`/api/payments/${id}`, config);
        
        // Remove the deleted payment from local state
        setPayments(payments.filter(payment => payment._id !== id));
        setLoading(false);
      } catch (error) {
        setError(
          error.response && error.response.data.message
            ? error.response.data.message
            : 'Không thể xóa khoản thanh toán'
        );
        setLoading(false);
      }
    }
  };
  
  const filteredPayments = payments.filter(
    (payment) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        payment.household?.apartmentNumber?.toLowerCase().includes(searchLower) ||
        payment.fee?.name?.toLowerCase().includes(searchLower) ||
        payment.receiptNumber?.toLowerCase().includes(searchLower) ||
        (payment.payerName && payment.payerName.toLowerCase().includes(searchLower))
      );
      
      const matchesStatus = statusFilter === '' || payment.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    }
  );
  
  const handleSearch = (e) => {
    e.preventDefault();
    fetchPayments();
  };
  
  return (
    <>
      <Row className="align-items-center mb-3">
        <Col>
          <h1>Thanh Toán</h1>
        </Col>
        <Col className="text-end">
          <Button 
            className="btn-sm"
            onClick={() => navigate('/payments/create')}
          >
            <i className="fas fa-plus"></i> Tạo Thanh Toán
          </Button>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={4}>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Tìm kiếm thanh toán..."
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
        <Col md={3}>
          <Form.Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="paid">Đã thanh toán</option>
            <option value="pending">Chưa thanh toán</option>
            <option value="overdue">Quá hạn</option>
          </Form.Select>
        </Col>
        <Col md={2}>
          <Button
            variant="outline-secondary"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
            }}
          >
            Xóa tất cả
          </Button>
        </Col>
      </Row>

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <Card className="shadow-lg border-0 rounded-4">
          <Card.Header className="bg-white border-0 rounded-top-4 pb-2 d-flex align-items-center justify-content-between">
            <span className="fw-bold fs-5 text-primary"><i className="bi bi-cash-coin me-2"></i>Danh sách thanh toán</span>
            <span className="text-muted small">Tổng: {filteredPayments.length}</span>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 household-table">
                <thead className="table-light">
                  <tr>
                    <th className="fw-bold">Loại Phí</th>
                    <th className="fw-bold">Căn Hộ</th>
                    <th className="fw-bold">Số Tiền</th>
                    <th className="fw-bold">Phương thức</th>
                    <th className="fw-bold text-center">Trạng thái</th>
                    <th className="fw-bold">Ngày thanh toán</th>
                    <th className="fw-bold">Ghi chú</th>
                    <th className="fw-bold text-center col-action" style={{width: '1%', whiteSpace: 'nowrap'}}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment._id} className="table-row-hover">
                      <td>
                        <Link to={`/payments/${payment._id}`}>{payment.fee ? payment.fee.name : 'N/A'}</Link>
                      </td>
                      <td>{payment.household ? payment.household.apartmentNumber : 'N/A'}</td>
                      <td>{payment.amount?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</td>
                      <td>{payment.method}</td>
                      <td className="text-center align-middle">
                        <span className={`badge px-3 py-2 rounded-pill bg-opacity-10 ${payment.status === 'paid' ? 'bg-success text-success' : payment.status === 'overdue' ? 'bg-danger text-danger' : 'bg-warning text-warning'}`}>
                          <i className={`bi ${payment.status === 'paid' ? 'bi-check-circle' : payment.status === 'overdue' ? 'bi-x-circle' : 'bi-clock'} me-1`}></i>
                          {payment.status === 'paid' ? 'Đã thanh toán' : payment.status === 'overdue' ? 'Quá hạn' : 'Chưa thanh toán'}
                        </span>
                      </td>
                      <td>{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('vi-VN') : 'N/A'}</td>
                      <td>{payment.note || 'N/A'}</td>
                      <td className="text-center align-middle col-action" style={{width: '1%', whiteSpace: 'nowrap'}}>
                        <div className="d-flex justify-content-center gap-1">
                          <Button
                            variant="light"
                            className="mx-1 small"
                            onClick={() => navigate(`/payments/${payment._id}`)}
                            title="Xem chi tiết"
                            style={{fontSize: '0.85rem', borderRadius: '1rem'}}
                          >
                            Xem
                          </Button>
                          {isAdmin && (
                            <>
                              <Button
                                variant="outline-primary"
                                className="mx-1 small"
                                onClick={() => navigate(`/payments/${payment._id}/edit`)}
                                title="Chỉnh sửa"
                                style={{fontSize: '0.85rem', borderRadius: '1rem'}}
                              >
                                <i className="bi bi-pencil me-1"></i>Sửa
                              </Button>
                              <Button
                                variant="outline-danger"
                                className="mx-1 small"
                                onClick={() => handleDelete(payment._id)}
                                title="Xóa"
                                style={{fontSize: '0.85rem', borderRadius: '1rem'}}
                              >
                                <i className="bi bi-trash me-1"></i>Xóa
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredPayments.length === 0 && (
              <Message>Không tìm thấy khoản thanh toán nào</Message>
            )}
          </Card.Body>
        </Card>
      )}
    </>
  );
};

export default PaymentListScreen; 