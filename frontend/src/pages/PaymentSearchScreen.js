import React, { useState, useEffect, useContext } from 'react';
import { Form, Button, Row, Col, Card, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Message from '../components/common/Message';
import Loader from '../components/common/Loader';
import AuthContext from '../context/AuthContext';

const PaymentSearchScreen = () => {
  const { userInfo } = useContext(AuthContext);
  
  // Search form states
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [feeName, setFeeName] = useState('');
  const [feeType, setFeeType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [payerName, setPayerName] = useState('');
  
  // Results and UI states
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  
  const searchPayments = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      // Build query params
      const params = new URLSearchParams();
      if (apartmentNumber) params.append('apartmentNumber', apartmentNumber);
      if (feeName) params.append('feeName', feeName);
      if (feeType) params.append('feeType', feeType);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (minAmount) params.append('minAmount', minAmount);
      if (maxAmount) params.append('maxAmount', maxAmount);
      if (payerName) params.append('payerName', payerName);
      
      const { data } = await axios.get(`/api/payments/search?${params.toString()}`, config);
      
      setPayments(data);
      setSearched(true);
      setLoading(false);
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Lỗi khi tìm kiếm thanh toán'
      );
      setLoading(false);
    }
  };
  
  const clearForm = () => {
    setApartmentNumber('');
    setFeeName('');
    setFeeType('');
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
    setPayerName('');
    setSearched(false);
    setPayments([]);
  };
  
  // Chuyển đổi tên loại phí
  const translateFeeType = (feeType) => {
    const translations = {
      'service': 'Dịch vụ',
      'maintenance': 'Bảo trì',
      'water': 'Nước',
      'electricity': 'Điện',
      'parking': 'Đỗ xe',
      'internet': 'Internet',
      'security': 'An ninh',
      'cleaning': 'Vệ sinh',
      'contribution': 'Đóng góp',
      'mandatory': 'Bắt buộc',
      'other': 'Khác'
    };
    
    return translations[feeType] || 'Khác';
  };
  
  return (
    <>
      <h1 className="mb-4 d-flex align-items-center text-primary">
        <i className="fas fa-search-dollar me-2"></i> Tìm Kiếm Thanh Toán
      </h1>
      
      <Card className="mb-4 shadow-lg border-info">
        <Card.Header className="bg-info text-white d-flex align-items-center">
          <i className="fas fa-filter me-2"></i>
          <span className="fw-bold">Bộ lọc tìm kiếm</span>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={searchPayments} className="p-2">
            <Row>
              <Col md={6}>
                <Form.Group controlId="apartmentNumber" className="mb-3">
                  <Form.Label><i className="fas fa-home me-1 text-primary"></i> Số Căn Hộ</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nhập số căn hộ..."
                    value={apartmentNumber}
                    onChange={(e) => setApartmentNumber(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="payerName" className="mb-3">
                  <Form.Label><i className="fas fa-user me-1 text-success"></i> Tên Người Nộp</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nhập tên người nộp..."
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group controlId="feeName" className="mb-3">
                  <Form.Label><i className="fas fa-coins me-1 text-warning"></i> Tên Phí</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nhập tên phí..."
                    value={feeName}
                    onChange={(e) => setFeeName(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="feeType" className="mb-3">
                  <Form.Label><i className="fas fa-tags me-1 text-info"></i> Loại Phí</Form.Label>
                  <Form.Select
                    value={feeType}
                    onChange={(e) => setFeeType(e.target.value)}
                  >
                    <option value="">Tất cả loại</option>
                    <option value="mandatory">Bắt buộc</option>
                    <option value="service">Dịch vụ</option>
                    <option value="maintenance">Bảo trì</option>
                    <option value="water">Nước</option>
                    <option value="electricity">Điện</option>
                    <option value="parking">Đỗ xe</option>
                    <option value="internet">Internet</option>
                    <option value="security">An ninh</option>
                    <option value="cleaning">Vệ sinh</option>
                    <option value="contribution">Đóng góp</option>
                    <option value="other">Khác</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={3}>
                <Form.Group controlId="startDate" className="mb-3">
                  <Form.Label><i className="fas fa-calendar-day me-1 text-secondary"></i> Từ Ngày</Form.Label>
                  <Form.Control
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="endDate" className="mb-3">
                  <Form.Label><i className="fas fa-calendar-day me-1 text-secondary"></i> Đến Ngày</Form.Label>
                  <Form.Control
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="minAmount" className="mb-3">
                  <Form.Label><i className="fas fa-sort-amount-down me-1 text-primary"></i> Số Tiền Tối Thiểu</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="VND"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group controlId="maxAmount" className="mb-3">
                  <Form.Label><i className="fas fa-sort-amount-up me-1 text-danger"></i> Số Tiền Tối Đa</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="VND"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-between mt-3 gap-2">
              <Button variant="secondary" onClick={clearForm} className="w-50">
                <i className="fas fa-eraser me-1"></i> Xóa Bộ Lọc
              </Button>
              <Button type="submit" variant="info" className="w-50">
                <i className="fas fa-search me-1"></i> Tìm Kiếm
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : searched ? (
        <>
          <h2 className="mb-3 d-flex align-items-center text-success">
            <i className="fas fa-list me-2"></i> Kết Quả Tìm Kiếm
          </h2>
          {payments.length === 0 ? (
            <Message>Không tìm thấy thanh toán nào phù hợp</Message>
          ) : (
            <Card className="shadow-lg border-success">
              <Card.Header className="bg-success text-white d-flex align-items-center">
                <i className="fas fa-table me-2"></i>
                <span className="fw-bold">Bảng kết quả</span>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th><i className="fas fa-home"></i> Căn Hộ</th>
                        <th><i className="fas fa-coins"></i> Loại Phí</th>
                        <th><i className="fas fa-money-bill-wave"></i> Số Tiền</th>
                        <th><i className="fas fa-calendar-day"></i> Ngày Thanh Toán</th>
                        <th><i className="fas fa-user"></i> Người Nộp</th>
                        <th><i className="fas fa-sticky-note"></i> Ghi Chú</th>
                        <th><i className="fas fa-cogs"></i> Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment._id}>
                          <td>
                            {payment.household?.apartmentNumber || 'N/A'}
                          </td>
                          <td>
                            {payment.fee?.name} 
                            ({translateFeeType(payment.fee?.feeType)})
                          </td>
                          <td>{payment.amount.toLocaleString()} VND</td>
                          <td>
                            {new Date(payment.paymentDate).toLocaleDateString('vi-VN')}
                          </td>
                          <td>{payment.payerName || 'N/A'}</td>
                          <td>{payment.note || '-'}</td>
                          <td>
                            <Link
                              to={`/payments/${payment._id}`}
                              className="btn btn-sm btn-info me-2"
                            >
                              <i className="fas fa-eye"></i>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          )}
        </>
      ) : null}
    </>
  );
};

export default PaymentSearchScreen; 