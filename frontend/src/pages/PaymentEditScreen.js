import React, { useState, useEffect, useContext } from 'react';
import { Form, Button, Row, Col, Card } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import Message from '../components/common/Message';
import Loader from '../components/common/Loader';
import AuthContext from '../context/AuthContext';
import axios from 'axios';

const PaymentEditScreen = () => {
  const [payment, setPayment] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    paymentDate: '',
    payerName: '',
    payerId: '',
    payerPhone: '',
    receiptNumber: '',
    method: 'cash',
    note: '',
    status: 'paid'
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { id } = useParams();
  const { userInfo } = useContext(AuthContext);
  
  useEffect(() => {
    fetchPayment();
  }, [id]);
  
  const fetchPayment = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const { data } = await axios.get(`/api/payments/${id}`, config);
      setPayment(data);
      
      // Pre-fill form with existing data
      setFormData({
        amount: data.amount || '',
        paymentDate: data.paymentDate ? new Date(data.paymentDate).toISOString().split('T')[0] : '',
        payerName: data.payerName || '',
        payerId: data.payerId || '',
        payerPhone: data.payerPhone || '',
        receiptNumber: data.receiptNumber || '',
        method: data.method || 'cash',
        note: data.note || '',
        status: data.status || 'paid'
      });
      
      setLoading(false);
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể tải thông tin thanh toán'
      );
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      await axios.put(`/api/payments/${id}`, formData, config);
      
      navigate('/payments');
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể cập nhật thanh toán'
      );
      setUpdating(false);
    }
  };
  
  if (loading) return <Loader />;
  if (error && !payment) return <Message variant="danger">{error}</Message>;
  
  return (
    <>
      <Row className="mb-3">
        <Col>
          <Button variant="outline-secondary" onClick={() => navigate('/payments')}>
            <i className="bi bi-arrow-left"></i> Quay lại
          </Button>
        </Col>
      </Row>

      <Row>
        <Col md={8}>
          <Card className="shadow-lg border-0 rounded-4">
            <Card.Header className="bg-white border-0 rounded-top-4 pb-2">
              <h3 className="fw-bold text-primary mb-0">
                <i className="bi bi-pencil-square me-2"></i>
                Chỉnh Sửa Thanh Toán
              </h3>
            </Card.Header>
            <Card.Body>
              {error && <Message variant="danger">{error}</Message>}
              
              {payment && (
                <div className="mb-4 p-3 bg-light rounded">
                  <h5>Thông tin cơ bản</h5>
                  <p><strong>Loại phí:</strong> {payment.fee?.name}</p>
                  <p><strong>Căn hộ:</strong> {payment.household?.apartmentNumber}</p>
                  <p><strong>Kỳ thanh toán:</strong> {payment.period ? new Date(payment.period).toLocaleDateString('vi-VN') : 'N/A'}</p>
                </div>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Số tiền</Form.Label>
                      <Form.Control
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        required
                        min="0"
                        step="1000"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Ngày thanh toán</Form.Label>
                      <Form.Control
                        type="date"
                        name="paymentDate"
                        value={formData.paymentDate}
                        onChange={handleChange}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Số biên lai</Form.Label>
                      <Form.Control
                        type="text"
                        name="receiptNumber"
                        value={formData.receiptNumber}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Phương thức thanh toán</Form.Label>
                      <Form.Select
                        name="method"
                        value={formData.method}
                        onChange={handleChange}
                      >
                        <option value="cash">Tiền mặt</option>
                        <option value="bank_transfer">Chuyển khoản</option>
                        <option value="card">Thẻ</option>
                        <option value="other">Khác</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Trạng thái</Form.Label>
                      <Form.Select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                      >
                        <option value="paid">Đã thanh toán</option>
                        <option value="pending">Chưa thanh toán</option>
                        <option value="overdue">Quá hạn</option>
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
                    onChange={handleChange}
                  />
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button 
                    type="submit" 
                    variant="primary"
                    disabled={updating}
                    className="px-4"
                  >
                    {updating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Đang cập nhật...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Cập nhật
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={() => navigate('/payments')}
                    disabled={updating}
                  >
                    Hủy
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default PaymentEditScreen; 