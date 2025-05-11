import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Row, Col, ListGroup, Badge, Container, Card, Button } from 'react-bootstrap';
import axios from 'axios';
import Loader from '../components/common/Loader';
import Message from '../components/common/Message';
import AuthContext from '../context/AuthContext';

const PaymentDetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { userInfo } = useContext(AuthContext);
  
  // Check if user is admin
  const isAdmin = userInfo && (userInfo.role === 'admin' || userInfo.role === 'accountant');
  
  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa khoản thanh toán này? Hành động này không thể hoàn tác.')) {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        
        await axios.delete(`/api/payments/${id}`, config);
        navigate('/payments');
      } catch (error) {
        setError(
          error.response && error.response.data.message
            ? error.response.data.message
            : 'Không thể xóa khoản thanh toán'
        );
      }
    }
  };
  
  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };

        const { data } = await axios.get(`/api/payments/${id}`, config);
        setPayment(data);
        setLoading(false);
      } catch (error) {
        setError(
          error.response && error.response.data.message
            ? error.response.data.message
            : error.message
        );
        setLoading(false);
      }
    };

    if (userInfo) {
      fetchPayment();
    } else {
      navigate('/login');
    }
  }, [id, navigate, userInfo]);
  
  return (
    <Container>
      <Row className="align-items-center my-3">
        <Col>
          <Link to="/payments" className="btn btn-light">
        <i className="fas fa-arrow-left"></i> Quay lại
      </Link>
        </Col>
        <Col className="text-end">
          {isAdmin && (
            <div className="d-flex gap-2 justify-content-end">
              <Button 
                variant="outline-primary"
                onClick={() => navigate(`/payments/${id}/edit`)}
              >
                <i className="bi bi-pencil me-1"></i>Sửa
              </Button>
              <Button 
                variant="outline-danger"
                onClick={handleDelete}
              >
                <i className="bi bi-trash me-1"></i>Xóa
              </Button>
            </div>
          )}
        </Col>
      </Row>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <Card className="shadow-lg border-success mb-4">
          <Card.Header className="bg-success text-white d-flex align-items-center">
            <i className="fas fa-file-invoice-dollar fa-lg me-2"></i>
            <h2 className="mb-0" style={{ fontSize: '1.3rem' }}>Chi tiết thanh toán</h2>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6} className="mb-3">
                <h5 className="mb-3"><i className="fas fa-info-circle me-2 text-primary"></i>Thông tin cơ bản</h5>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <strong><i className="fas fa-hashtag me-1"></i> Mã thanh toán:</strong> <span className="text-success fw-bold">{payment._id}</span>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong><i className="fas fa-coins me-1 text-warning"></i> Tên phí:</strong> {payment.fee?.name}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong><i className="fas fa-home me-1 text-info"></i> Căn hộ:</strong> {payment.household?.apartmentNumber}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong><i className="fas fa-money-bill-wave me-1 text-success"></i> Số tiền:</strong> <span className="fs-5 text-primary fw-bold">{payment.amount?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</span>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong><i className="fas fa-receipt me-1 text-secondary"></i> Mã biên lai:</strong> <span className="text-dark">{payment.receiptNumber || 'N/A'}</span>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong><i className="fas fa-user me-1 text-primary"></i> Người thanh toán:</strong> {payment.payerName || 'N/A'}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong><i className="fas fa-phone me-1 text-success"></i> SĐT:</strong> {payment.payerPhone || 'N/A'}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong><i className="fas fa-id-card me-1 text-info"></i> CMND/CCCD:</strong> {payment.payerId || 'N/A'}
                  </ListGroup.Item>
                </ListGroup>
              </Col>
              <Col md={6} className="mb-3">
                <h5 className="mb-3"><i className="fas fa-calendar-alt me-2 text-secondary"></i> Thông tin thời gian & trạng thái</h5>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <strong><i className="fas fa-calendar-day me-1"></i> Ngày thanh toán:</strong> {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('vi-VN') : 'N/A'}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong><i className="fas fa-calendar-plus me-1"></i> Ngày tạo:</strong> {new Date(payment.createdAt).toLocaleDateString('vi-VN')}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong><i className="fas fa-calendar-check me-1"></i> Cập nhật lần cuối:</strong> {new Date(payment.updatedAt).toLocaleDateString('vi-VN')}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong><i className="fas fa-calendar me-1"></i> Kỳ thanh toán:</strong> {payment.period ? new Date(payment.period).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) : 'N/A'}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong><i className="fas fa-info-circle me-1"></i> Trạng thái:</strong> <Badge bg={payment.status === 'paid' ? 'success' : payment.status === 'overdue' ? 'danger' : 'warning'} className="fs-6">
                      {payment.status === 'paid' ? 'Đã thanh toán' : payment.status === 'overdue' ? 'Quá hạn' : 'Chưa thanh toán'}
                    </Badge>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong><i className="fas fa-sticky-note me-1 text-secondary"></i> Ghi chú:</strong> <span className="fst-italic text-muted">{payment.note || 'Không có ghi chú'}</span>
                  </ListGroup.Item>
                </ListGroup>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default PaymentDetailScreen; 