import React, { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import AuthContext from '../context/AuthContext';
import axios from 'axios';

const AreaBasedFeeScreen = () => {
  const { userInfo } = useContext(AuthContext);
  
  const [statistics, setStatistics] = useState(null);
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  
  // Form states
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      // Fetch statistics and calculations in parallel
      const [statsResponse, calculationsResponse] = await Promise.all([
        axios.get('/api/area-fees/statistics', config),
        axios.get('/api/area-fees/calculate-all', config)
      ]);

      setStatistics(statsResponse.data.data);
      setCalculations(calculationsResponse.data.data);
      setLoading(false);
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể tải dữ liệu phí theo diện tích'
      );
      setLoading(false);
    }
  };

  const handleCreatePayments = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.post('/api/area-fees/create-payments', {
        year: selectedYear,
        month: selectedMonth,
        overwriteExisting
      }, config);

      setSuccess(data.message);
      setShowCreateModal(false);
      fetchData(); // Refresh data
      setLoading(false);
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể tạo phí theo diện tích'
      );
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const { data } = await axios.get(`/api/area-fees/preview?year=${selectedYear}&month=${selectedMonth}`, config);
      
      setPreviewData(data.data);
      setShowPreviewModal(true);
      setLoading(false);
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể xem trước phí theo diện tích'
      );
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading && !statistics) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>
              <i className="fas fa-building me-2 text-primary"></i>
              Quản Lý Phí Theo Diện Tích
            </h2>
            <div>
              <Button 
                variant="outline-primary" 
                className="me-2"
                onClick={() => setShowPreviewModal(true)}
                disabled={loading}
              >
                <i className="fas fa-eye me-1"></i>
                Xem Trước
              </Button>
              <Button 
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                disabled={loading}
              >
                <i className="fas fa-plus me-1"></i>
                Tạo Phí Tháng
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Statistics Cards */}
      {statistics && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="text-primary mb-2">
                  <i className="fas fa-home fa-2x"></i>
                </div>
                <h5 className="card-title">Tổng Hộ Gia Đình</h5>
                <h3 className="text-primary">{statistics.totalHouseholds}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="text-info mb-2">
                  <i className="fas fa-ruler-combined fa-2x"></i>
                </div>
                <h5 className="card-title">Tổng Diện Tích</h5>
                <h3 className="text-info">{statistics.totalArea} m²</h3>
                <small className="text-muted">TB: {statistics.avgArea} m²/hộ</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="text-success mb-2">
                  <i className="fas fa-money-bill-wave fa-2x"></i>
                </div>
                <h5 className="card-title">Phí Hàng Tháng</h5>
                <h3 className="text-success">{formatCurrency(statistics.totalMonthlyFees)}</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100 border-0 shadow-sm">
              <Card.Body className="text-center">
                <div className="text-warning mb-2">
                  <i className="fas fa-percentage fa-2x"></i>
                </div>
                <h5 className="card-title">Tỷ Lệ Thu</h5>
                <h3 className="text-warning">{statistics.currentMonthStats.collectionRate}%</h3>
                <small className="text-muted">Tháng hiện tại</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Fee Breakdown */}
      {statistics && (
        <Row className="mb-4">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-light">
                <h5 className="mb-0">
                  <i className="fas fa-chart-pie me-2"></i>
                  Chi Tiết Phí Theo Loại
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  {Object.entries(statistics.feeBreakdown).map(([feeCode, feeInfo]) => (
                    <Col md={6} key={feeCode} className="mb-3">
                      <div className="border rounded p-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="mb-1">{feeInfo.name}</h6>
                            <small className="text-muted">
                              {feeInfo.unitPrice.toLocaleString()} VND/m²/tháng
                            </small>
                          </div>
                          <div className="text-end">
                            <div className="fw-bold text-primary">
                              {formatCurrency(feeInfo.totalAmount)}
                            </div>
                            <small className="text-muted">
                              {feeInfo.totalArea} m²
                            </small>
                          </div>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Household Calculations Table */}
      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">
                <i className="fas fa-table me-2"></i>
                Tính Phí Theo Hộ Gia Đình
              </h5>
            </Card.Header>
            <Card.Body>
              {calculations.length > 0 ? (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Căn Hộ</th>
                      <th>Diện Tích</th>
                      <th>Phí Dịch Vụ</th>
                      <th>Phí Quản Lý</th>
                      <th>Tổng Phí</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculations.map((calc) => (
                      <tr key={calc.householdId}>
                        <td>
                          <Badge bg="info" className="apartment-badge">
                            {calc.apartmentNumber}
                          </Badge>
                        </td>
                        <td>{calc.area} m²</td>
                        <td>
                          {calc.feeDetails.find(f => f.feeCode === 'PHI006') ? 
                            formatCurrency(calc.feeDetails.find(f => f.feeCode === 'PHI006').amount) : 
                            'N/A'
                          }
                        </td>
                        <td>
                          {calc.feeDetails.find(f => f.feeCode === 'PHI007') ? 
                            formatCurrency(calc.feeDetails.find(f => f.feeCode === 'PHI007').amount) : 
                            'N/A'
                          }
                        </td>
                        <td className="fw-bold">{formatCurrency(calc.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                  <p className="text-muted">Không có dữ liệu phí theo diện tích</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Create Payments Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Tạo Phí Theo Diện Tích Hàng Tháng</Modal.Title>
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
            <div className="d-flex gap-2">
              <Button variant="outline-primary" onClick={handlePreview}>
                <i className="fas fa-eye me-1"></i>
                Xem Trước
              </Button>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleCreatePayments} disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Đang tạo...
              </>
            ) : (
              <>
                <i className="fas fa-plus me-1"></i>
                Tạo Phí
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Preview Modal */}
      <Modal show={showPreviewModal} onHide={() => setShowPreviewModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            Xem Trước Phí Theo Diện Tích - {previewData?.period.monthName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewData && (
            <div>
              <Row className="mb-3">
                <Col md={3}>
                  <Card className="text-center">
                    <Card.Body>
                      <h5>Tổng Hộ</h5>
                      <h3 className="text-primary">{previewData.summary.totalHouseholds}</h3>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center">
                    <Card.Body>
                      <h5>Tổng Diện Tích</h5>
                      <h3 className="text-info">{previewData.summary.totalArea} m²</h3>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center">
                    <Card.Body>
                      <h5>Tổng Phí</h5>
                      <h3 className="text-success">{formatCurrency(previewData.summary.totalAmount)}</h3>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center">
                    <Card.Body>
                      <h5>TB/Hộ</h5>
                      <h3 className="text-warning">{formatCurrency(previewData.summary.avgFeePerHousehold)}</h3>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              
              <Table striped bordered hover responsive size="sm">
                <thead>
                  <tr>
                    <th>Căn Hộ</th>
                    <th>Diện Tích</th>
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
                      <td>{household.area} m²</td>
                      <td>
                        {household.feeDetails.map((detail, idx) => (
                          <div key={idx} className="small">
                            {detail.feeName}: {detail.area}m² × {detail.unitPrice.toLocaleString()} = {formatCurrency(detail.amount)}
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
    </Container>
  );
};

export default AreaBasedFeeScreen; 