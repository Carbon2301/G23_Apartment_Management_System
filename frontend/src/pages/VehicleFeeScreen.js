import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Card, Button, Table, Alert, Spinner, Modal, Form, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaCar, FaCalculator, FaMoneyBillWave, FaChartLine, FaPlus, FaEye } from 'react-icons/fa';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const VehicleFeeScreen = () => {
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext);

  const [statistics, setStatistics] = useState(null);
  const [prices, setPrices] = useState(null);
  const [allCalculations, setAllCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Form states
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [overwriteExisting, setOverwriteExisting] = useState(false);

  useEffect(() => {
    if (userInfo) {
      fetchData();
    }
  }, [userInfo]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, pricesRes, calculationsRes] = await Promise.all([
        axios.get('/api/vehicle-fees/statistics', {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        }),
        axios.get('/api/vehicle-fees/prices', {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        }),
        axios.get('/api/vehicle-fees/calculate-all', {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        })
      ]);

      setStatistics(statsRes.data.data);
      setPrices(pricesRes.data.data);
      setAllCalculations(calculationsRes.data.data);
      setError('');
    } catch (error) {
      setError('Có lỗi xảy ra khi tải dữ liệu');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayments = async () => {
    try {
      setCreateLoading(true);
      
      const response = await axios.post('/api/vehicle-fees/create-payments', {
        year: selectedYear,
        month: selectedMonth,
        overwriteExisting
      }, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });

      setSuccess(response.data.message);
      setShowCreateModal(false);
      fetchData(); // Refresh data
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi tạo phí xe');
    } finally {
      setCreateLoading(false);
    }
  };

  const handlePreviewFees = async () => {
    try {
      const response = await axios.get(`/api/vehicle-fees/preview?year=${selectedYear}&month=${selectedMonth}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });

      setPreviewData(response.data.data);
      setShowPreviewModal(true);
    } catch (error) {
      setError('Có lỗi xảy ra khi xem trước phí xe');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  };

  const getVehicleTypeIcon = (type) => {
    switch (type) {
      case 'Ô tô': return '🚗';
      case 'Xe máy': return '🏍️';
      case 'Xe đạp': return '🚲';
      case 'Xe điện': return '⚡';
      default: return '🚗';
    }
  };

  const months = [
    { value: 1, label: 'Tháng 1' },
    { value: 2, label: 'Tháng 2' },
    { value: 3, label: 'Tháng 3' },
    { value: 4, label: 'Tháng 4' },
    { value: 5, label: 'Tháng 5' },
    { value: 6, label: 'Tháng 6' },
    { value: 7, label: 'Tháng 7' },
    { value: 8, label: 'Tháng 8' },
    { value: 9, label: 'Tháng 9' },
    { value: 10, label: 'Tháng 10' },
    { value: 11, label: 'Tháng 11' },
    { value: 12, label: 'Tháng 12' }
  ];

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Đang tải dữ liệu phí xe...</p>
      </div>
    );
  }

  return (
    <div className="vehicle-fee-screen">
      {/* Hero Section */}
      <div className="hero-section mb-4">
        <Row className="align-items-center">
          <Col>
            <h1 className="hero-title mb-0">
              <FaMoneyBillWave className="me-3" />
              Quản Lý Phí Xe
            </h1>
            <p className="hero-subtitle mb-0">
              Tính toán và quản lý phí xe theo loại và số lượng
            </p>
          </Col>
          <Col xs="auto">
            {userInfo.role === 'admin' && (
              <div className="d-flex gap-2">
                <Button
                  variant="outline-primary"
                  onClick={handlePreviewFees}
                  className="gradient-btn-outline"
                >
                  <FaEye className="me-2" />
                  Xem trước
                </Button>
              </div>
            )}
          </Col>
        </Row>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Price Table */}
      <Row className="mb-4">
        <Col lg={6}>
          <Card className="form-card h-100">
            <Card.Header className="form-header">
              <h5 className="mb-0">
                <FaCalculator className="me-2" />
                Bảng Giá Phí Xe
              </h5>
            </Card.Header>
            <Card.Body>
              {prices && (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Loại Xe</th>
                      <th>Giá/Tháng</th>
                      <th>Mã Phí</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(prices.prices).map(([type, price]) => (
                      <tr key={type}>
                        <td>
                          <span className="me-2">{getVehicleTypeIcon(type)}</span>
                          {type}
                        </td>
                        <td className="fw-bold text-success">
                          {formatCurrency(price)}
                        </td>
                        <td>
                          <Badge bg="secondary">{prices.feeMapping[type]}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="form-card h-100">
            <Card.Header className="form-header">
              <h5 className="mb-0">
                <FaChartLine className="me-2" />
                Thống Kê Tháng Hiện Tại
              </h5>
            </Card.Header>
            <Card.Body>
              {statistics && (
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-number text-primary">
                      {statistics.currentMonthStats.totalPayments}
                    </div>
                    <div className="stat-label">Tổng khoản phí</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number text-success">
                      {statistics.currentMonthStats.paidCount}
                    </div>
                    <div className="stat-label">Đã thanh toán</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number text-warning">
                      {statistics.currentMonthStats.pendingCount}
                    </div>
                    <div className="stat-label">Đang chờ</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number text-danger">
                      {statistics.currentMonthStats.overdueCount}
                    </div>
                    <div className="stat-label">Quá hạn</div>
                  </div>
                  <div className="stat-item col-span-2">
                    <div className="stat-number text-success">
                      {formatCurrency(statistics.currentMonthStats.totalRevenue)}
                    </div>
                    <div className="stat-label">Doanh thu đã thu</div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Vehicle Statistics */}
      {statistics && statistics.vehicleStats.length > 0 && (
        <Card className="form-card mb-4">
          <Card.Header className="form-header">
            <h5 className="mb-0">
              <FaCar className="me-2" />
              Thống Kê Xe Theo Loại
            </h5>
          </Card.Header>
          <Card.Body>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Loại Xe</th>
                  <th>Số Lượng Xe</th>
                  <th>Số Hộ Gia Đình</th>
                  <th>Giá/Xe/Tháng</th>
                  <th>Tổng Phí/Tháng</th>
                </tr>
              </thead>
              <tbody>
                {statistics.vehicleStats.map((stat) => (
                  <tr key={stat._id}>
                    <td>
                      <span className="me-2">{getVehicleTypeIcon(stat._id)}</span>
                      {stat._id}
                    </td>
                    <td className="fw-bold">{stat.count}</td>
                    <td>{stat.householdCount}</td>
                    <td>{formatCurrency(statistics.feeByType[stat._id]?.unitPrice || 0)}</td>
                    <td className="fw-bold text-success">
                      {formatCurrency(statistics.feeByType[stat._id]?.totalFee || 0)}
                    </td>
                  </tr>
                ))}
                <tr className="table-info">
                  <td className="fw-bold">TỔNG CỘNG</td>
                  <td className="fw-bold">
                    {statistics.vehicleStats.reduce((sum, stat) => sum + stat.count, 0)}
                  </td>
                  <td className="fw-bold">
                    {new Set(statistics.vehicleStats.flatMap(stat => stat.households)).size}
                  </td>
                  <td>-</td>
                  <td className="fw-bold text-success">
                    {formatCurrency(statistics.totalMonthlyFee)}
                  </td>
                </tr>
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {/* Create Payments Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Tạo Phí Xe Hàng Tháng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Năm</Form.Label>
                  <Form.Control
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    min="2020"
                    max="2030"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tháng</Form.Label>
                  <Form.Select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  >
                    {months.map(month => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Ghi đè các khoản phí đã tồn tại"
                checked={overwriteExisting}
                onChange={(e) => setOverwriteExisting(e.target.checked)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Hủy
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreatePayments}
            disabled={createLoading}
          >
            {createLoading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
            Tạo Phí Xe
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Preview Modal */}
      <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Xem Trước Phí Xe</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewData && (
            <div>
              <div className="mb-3">
                <h5>Kỳ phí: {previewData.period.monthName}</h5>
                <Row>
                  <Col md={4}>
                    <div className="stat-card">
                      <div className="stat-number">{previewData.summary.totalHouseholds}</div>
                      <div className="stat-label">Hộ gia đình có xe</div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="stat-card">
                      <div className="stat-number">{previewData.summary.totalVehicles}</div>
                      <div className="stat-label">Tổng số xe</div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="stat-card">
                      <div className="stat-number text-success">
                        {formatCurrency(previewData.summary.totalAmount)}
                      </div>
                      <div className="stat-label">Tổng phí dự kiến</div>
                    </div>
                  </Col>
                </Row>
              </div>
              
              <Table striped bordered hover responsive size="sm">
                <thead>
                  <tr>
                    <th>Căn Hộ</th>
                    <th>Số Xe</th>
                    <th>Chi Tiết</th>
                    <th>Tổng Phí</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.householdDetails.slice(0, 10).map((household) => (
                    <tr key={household.householdId}>
                      <td>
                        <Badge bg="info" className="apartment-badge">
                          {household.apartmentNumber}
                        </Badge>
                      </td>
                      <td>{household.totalVehicles}</td>
                      <td>
                        {household.feeDetails.map((detail, idx) => (
                          <div key={idx} className="small">
                            {detail.count} {detail.vehicleType} x {formatCurrency(detail.unitPrice)}
                          </div>
                        ))}
                      </td>
                      <td className="fw-bold">{formatCurrency(household.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {previewData.householdDetails.length > 10 && (
                <p className="text-muted">
                  ... và {previewData.householdDetails.length - 10} hộ gia đình khác
                </p>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreviewModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default VehicleFeeScreen; 