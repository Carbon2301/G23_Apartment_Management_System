import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Row, Col, ListGroup, Badge, Container, Card, Button, Modal, Form, Alert, Toast, ToastContainer, Dropdown, OverlayTrigger, Tooltip, Accordion, Tab, Tabs, ProgressBar, Spinner, Table, InputGroup, FloatingLabel, Offcanvas } from 'react-bootstrap';
import axios from 'axios';
import Loader from '../components/common/Loader';
import Message from '../components/common/Message';
import AuthContext from '../context/AuthContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';

const PaymentDetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Advanced state management
  const [relatedPayments, setRelatedPayments] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showRemindModal, setShowRemindModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editedPayment, setEditedPayment] = useState({});
  const [reminderData, setReminderData] = useState({
    type: 'email',
    message: '',
    scheduleDate: ''
  });
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');
  const [activeTab, setActiveTab] = useState('details');
  const [paymentStats, setPaymentStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
    onTimePayments: 0
  });
  const [printOptions, setPrintOptions] = useState({
    format: 'A4',
    orientation: 'portrait',
    includeQR: true,
    includeHistory: false,
    includeComments: false
  });
  const [attachments, setAttachments] = useState([]);
  const [showAttachments, setShowAttachments] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [auditTrail, setAuditTrail] = useState([]);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [quickActions, setQuickActions] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [paymentAnalytics, setPaymentAnalytics] = useState({
    avgPaymentTime: 0,
    paymentTrends: [],
    popularMethods: []
  });
  
  const { userInfo } = useContext(AuthContext);
  
  // Refs for advanced features
  const paymentCardRef = useRef(null);
  const commentInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const printRef = useRef(null);
  
  // Check if user is admin
  const isAdmin = userInfo && (userInfo.role === 'admin' || userInfo.role === 'accountant');
  const canEdit = isAdmin || userInfo.role === 'manager';
  const canDelete = userInfo.role === 'admin';
  const canComment = true; // All users can comment
  
  // Computed values
  const paymentAmount = useMemo(() => {
    return payment?.amount || 0;
  }, [payment]);

  const isOverdue = useMemo(() => {
    if (!payment?.fee?.dueDate) return false;
    return new Date(payment.fee.dueDate) < new Date() && payment.status !== 'paid';
  }, [payment]);

  const daysSinceCreated = useMemo(() => {
    if (!payment?.createdAt) return 0;
    const diff = new Date() - new Date(payment.createdAt);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [payment]);

  const nextPaymentDue = useMemo(() => {
    // Calculate next payment based on current payment period
    if (!payment?.period) return null;
    const currentPeriod = new Date(payment.period);
    const nextMonth = new Date(currentPeriod);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return nextMonth;
  }, [payment]);

  // Toast message helper
  const showToastMessage = useCallback((message, variant = 'success') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }, []);

  // Advanced API calls
  const fetchRelatedPayments = useCallback(async () => {
    if (!payment?.household?._id) return;
    
    try {
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      };
      
      const { data } = await axios.get(`/api/payments/household/${payment.household._id}?limit=10`, config);
      setRelatedPayments(data.filter(p => p._id !== id));
    } catch (error) {
      console.error('Failed to fetch related payments:', error);
    }
  }, [payment, userInfo, id]);

  const fetchPaymentHistory = useCallback(async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      };
      
      const { data } = await axios.get(`/api/payments/${id}/history`, config);
      setPaymentHistory(data);
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
    }
  }, [id, userInfo]);

  const fetchComments = useCallback(async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      };
      
      const { data } = await axios.get(`/api/payments/${id}/comments`, config);
      setComments(data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  }, [id, userInfo]);

  const fetchAuditTrail = useCallback(async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      };
      
      const { data } = await axios.get(`/api/payments/${id}/audit`, config);
      setAuditTrail(data);
    } catch (error) {
      console.error('Failed to fetch audit trail:', error);
    }
  }, [id, userInfo]);

  const fetchAttachments = useCallback(async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      };
      
      const { data } = await axios.get(`/api/payments/${id}/attachments`, config);
      setAttachments(data);
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
    }
  }, [id, userInfo]);

  const handleAddComment = useCallback(async () => {
    if (!newComment.trim()) return;

    try {
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      };

      const { data } = await axios.post(`/api/payments/${id}/comments`, {
        content: newComment
      }, config);

      setComments(prev => [data, ...prev]);
      setNewComment('');
      showToastMessage('Đã thêm bình luận');
    } catch (error) {
      showToastMessage('Thêm bình luận thất bại', 'danger');
    }
  }, [newComment, id, userInfo, showToastMessage]);

  const handleStatusChange = useCallback(async () => {
    if (!newStatus) return;

    try {
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      };

      const { data } = await axios.put(`/api/payments/${id}/status`, {
        status: newStatus,
        reason: statusReason
      }, config);

      setPayment(data);
      setShowStatusModal(false);
      setNewStatus('');
      setStatusReason('');
      showToastMessage('Đã cập nhật trạng thái');
      
      // Refresh related data
      fetchPaymentHistory();
      fetchAuditTrail();
    } catch (error) {
      showToastMessage('Cập nhật trạng thái thất bại', 'danger');
    }
  }, [newStatus, statusReason, id, userInfo, showToastMessage, fetchPaymentHistory, fetchAuditTrail]);

  const handlePrint = useCallback(async () => {
    try {
      const element = printRef.current;
      if (!element) return;

      if (printOptions.format === 'image') {
        const dataUrl = await toPng(element);
        const link = document.createElement('a');
        link.download = `payment-${payment._id}.png`;
        link.href = dataUrl;
        link.click();
      } else {
        const doc = new jsPDF({
          orientation: printOptions.orientation,
          unit: 'mm',
          format: printOptions.format.toLowerCase()
        });

        doc.setFontSize(20);
        doc.text('CHI TIẾT THANH TOÁN', 20, 20);
        
        doc.setFontSize(12);
        let yPos = 40;
        
        doc.text(`Mã thanh toán: ${payment._id}`, 20, yPos);
        yPos += 10;
        doc.text(`Tên phí: ${payment.fee?.name}`, 20, yPos);
        yPos += 10;
        doc.text(`Căn hộ: ${payment.household?.apartmentNumber}`, 20, yPos);
        yPos += 10;
        doc.text(`Số tiền: ${payment.amount?.toLocaleString('vi-VN')} VND`, 20, yPos);
        yPos += 10;
        doc.text(`Trạng thái: ${payment.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}`, 20, yPos);
        yPos += 10;
        doc.text(`Ngày tạo: ${new Date(payment.createdAt).toLocaleDateString('vi-VN')}`, 20, yPos);

        if (printOptions.includeHistory && paymentHistory.length > 0) {
          yPos += 20;
          doc.text('LỊCH SỬ THANH TOÁN', 20, yPos);
          yPos += 10;
          
          paymentHistory.forEach(history => {
            doc.text(`- ${history.action} (${new Date(history.createdAt).toLocaleDateString('vi-VN')})`, 25, yPos);
            yPos += 8;
          });
        }

        doc.save(`payment-${payment._id}.pdf`);
      }
      
      setShowPrintModal(false);
      showToastMessage('Đã xuất file thành công');
    } catch (error) {
      showToastMessage('Xuất file thất bại', 'danger');
    }
  }, [printOptions, payment, paymentHistory, showToastMessage]);

  const handleFileUpload = useCallback(async () => {
    if (!uploadFile) return;

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('description', 'Payment attachment');

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      };

      const { data } = await axios.post(`/api/payments/${id}/attachments`, formData, config);
      
      setAttachments(prev => [...prev, data]);
      setUploadFile(null);
      setUploadProgress(0);
      showToastMessage('Đã tải file thành công');
    } catch (error) {
      showToastMessage('Tải file thất bại', 'danger');
      setUploadProgress(0);
    }
  }, [uploadFile, id, userInfo, showToastMessage]);

  const handleToggleFavorite = useCallback(async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      };

      if (isFavorite) {
        await axios.delete(`/api/payments/${id}/favorite`, config);
        setIsFavorite(false);
        showToastMessage('Đã bỏ khỏi danh sách yêu thích');
      } else {
        await axios.post(`/api/payments/${id}/favorite`, {}, config);
        setIsFavorite(true);
        showToastMessage('Đã thêm vào danh sách yêu thích');
      }
    } catch (error) {
      showToastMessage('Thao tác thất bại', 'danger');
    }
  }, [isFavorite, id, userInfo, showToastMessage]);

  const handleSendReminder = useCallback(async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      };

      await axios.post(`/api/payments/${id}/remind`, reminderData, config);
      
      setShowRemindModal(false);
      setReminderData({ type: 'email', message: '', scheduleDate: '' });
      showToastMessage('Đã gửi nhắc nhở thành công');
    } catch (error) {
      showToastMessage('Gửi nhắc nhở thất bại', 'danger');
    }
  }, [reminderData, id, userInfo, showToastMessage]);

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
        setEditedPayment(data);
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

  // Fetch related data when payment is loaded
  useEffect(() => {
    if (payment && userInfo) {
      fetchRelatedPayments();
      fetchPaymentHistory();
      fetchComments();
      fetchAuditTrail();
      fetchAttachments();
      
      // Check if payment is in favorites
      const checkFavorite = async () => {
        try {
          const config = {
            headers: { Authorization: `Bearer ${userInfo.token}` }
          };
          const { data } = await axios.get(`/api/payments/${id}/favorite`, config);
          setIsFavorite(data.isFavorite);
        } catch (error) {
          // Not in favorites
          setIsFavorite(false);
        }
      };
      
      checkFavorite();
    }
  }, [payment, userInfo, fetchRelatedPayments, fetchPaymentHistory, fetchComments, fetchAuditTrail, fetchAttachments, id]);

  // Auto-refresh data periodically
  useEffect(() => {
    if (!payment || !userInfo) return;

    const interval = setInterval(() => {
      fetchPaymentHistory();
      fetchComments();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [payment, userInfo, fetchPaymentHistory, fetchComments]);

  // Handle file upload when uploadFile changes
  useEffect(() => {
    if (uploadFile) {
      handleFileUpload();
    }
  }, [uploadFile, handleFileUpload]);
  
  return (
    <Container>
      {/* Enhanced Header with more actions */}
      <Row className="align-items-center my-3">
        <Col md={3}>
          <Link to="/payments" className="btn btn-light">
            <i className="fas fa-arrow-left"></i> Quay lại
          </Link>
        </Col>
        <Col md={6} className="text-center">
          <div className="d-flex align-items-center justify-content-center gap-2">
            <h4 className="mb-0">Chi tiết thanh toán</h4>
            {isOverdue && (
              <Badge bg="danger" className="animate__animated animate__pulse">
                <i className="bi bi-exclamation-triangle me-1"></i>Quá hạn
              </Badge>
            )}
            {payment?.status === 'paid' && (
              <Badge bg="success">
                <i className="bi bi-check-circle me-1"></i>Đã thanh toán
              </Badge>
            )}
          </div>
        </Col>
        <Col md={3} className="text-end">
          <div className="d-flex gap-2 justify-content-end flex-wrap">
            {/* Quick Actions */}
            <OverlayTrigger overlay={<Tooltip>Thêm vào yêu thích</Tooltip>}>
              <Button 
                variant={isFavorite ? "warning" : "outline-warning"} 
                size="sm"
                onClick={handleToggleFavorite}
              >
                <i className={`bi ${isFavorite ? "bi-star-fill" : "bi-star"}`}></i>
              </Button>
            </OverlayTrigger>

            <OverlayTrigger overlay={<Tooltip>In hoặc xuất file</Tooltip>}>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => setShowPrintModal(true)}
              >
                <i className="bi bi-printer"></i>
              </Button>
            </OverlayTrigger>

            <OverlayTrigger overlay={<Tooltip>Chia sẻ</Tooltip>}>
              <Button 
                variant="outline-info" 
                size="sm"
                onClick={() => setShowShareModal(true)}
              >
                <i className="bi bi-share"></i>
              </Button>
            </OverlayTrigger>

            {/* Admin/Manager Actions */}
            {(canEdit || canDelete) && (
              <Dropdown>
                <Dropdown.Toggle variant="primary" size="sm">
                  <i className="bi bi-gear me-1"></i>Thao tác
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {canEdit && (
                    <>
                      <Dropdown.Item onClick={() => setShowEditModal(true)}>
                        <i className="bi bi-pencil me-2"></i>Chỉnh sửa
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setShowStatusModal(true)}>
                        <i className="bi bi-arrow-repeat me-2"></i>Thay đổi trạng thái
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => setShowRemindModal(true)}>
                        <i className="bi bi-bell me-2"></i>Gửi nhắc nhở
                      </Dropdown.Item>
                      <Dropdown.Divider />
                    </>
                  )}
                  {canDelete && (
                    <Dropdown.Item onClick={handleDelete} className="text-danger">
                      <i className="bi bi-trash me-2"></i>Xóa
                    </Dropdown.Item>
                  )}
                </Dropdown.Menu>
              </Dropdown>
            )}
          </div>
        </Col>
      </Row>

      {/* Alert for overdue payments */}
      {isOverdue && (
        <Alert variant="danger" className="mb-3">
          <Alert.Heading><i className="bi bi-exclamation-triangle me-2"></i>Thanh toán quá hạn!</Alert.Heading>
          <p>Khoản thanh toán này đã quá hạn {Math.floor((new Date() - new Date(payment.fee?.dueDate)) / (1000 * 60 * 60 * 24))} ngày. Vui lòng liên hệ với hộ gia đình để xử lý.</p>
          <Button variant="outline-danger" size="sm" onClick={() => setShowRemindModal(true)}>
            <i className="bi bi-bell me-1"></i>Gửi nhắc nhở ngay
          </Button>
        </Alert>
      )}

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm h-100">
            <Card.Body>
              <div className="text-primary mb-2">
                <i className="bi bi-cash-stack" style={{fontSize: '2rem'}}></i>
              </div>
              <h5 className="text-primary">{paymentAmount.toLocaleString('vi-VN')} VND</h5>
              <small className="text-muted">Số tiền thanh toán</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm h-100">
            <Card.Body>
              <div className="text-info mb-2">
                <i className="bi bi-calendar-date" style={{fontSize: '2rem'}}></i>
              </div>
              <h5 className="text-info">{daysSinceCreated}</h5>
              <small className="text-muted">Ngày kể từ khi tạo</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm h-100">
            <Card.Body>
              <div className="text-success mb-2">
                <i className="bi bi-check-circle" style={{fontSize: '2rem'}}></i>
              </div>
              <h5 className="text-success">{payment?.status === 'paid' ? 'Hoàn thành' : 'Chưa hoàn thành'}</h5>
              <small className="text-muted">Trạng thái</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm h-100">
            <Card.Body>
              <div className="text-warning mb-2">
                <i className="bi bi-clock-history" style={{fontSize: '2rem'}}></i>
              </div>
              <h5 className="text-warning">
                {nextPaymentDue ? nextPaymentDue.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : 'N/A'}
              </h5>
              <small className="text-muted">Kỳ thanh toán tiếp theo</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <>
          {/* Main Content with Tabs */}
          <div ref={printRef}>
            <Card className="shadow-lg border-0 mb-4">
              <Card.Header className="bg-gradient-primary text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <i className="fas fa-file-invoice-dollar fa-lg me-2"></i>
                    <h3 className="mb-0">Chi tiết thanh toán #{payment._id.slice(-6)}</h3>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <QRCodeSVG value={`${window.location.origin}/payments/${payment._id}`} size={40} />
                    <Badge bg={payment.status === 'paid' ? 'success' : payment.status === 'overdue' ? 'danger' : 'warning'} className="fs-6">
                      {payment.status === 'paid' ? 'Đã thanh toán' : payment.status === 'overdue' ? 'Quá hạn' : 'Chưa thanh toán'}
                    </Badge>
                  </div>
                </div>
              </Card.Header>
              
              <Card.Body className="p-0">
                <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="border-bottom-0">
                  <Tab eventKey="details" title={<><i className="bi bi-info-circle me-1"></i>Chi tiết</>}>
                    <div className="p-4">
                      <Row>
                        <Col md={6} className="mb-3">
                          <h5 className="mb-3 text-primary border-bottom pb-2">
                            <i className="fas fa-info-circle me-2"></i>Thông tin cơ bản
                          </h5>
                          <ListGroup variant="flush">
                            <ListGroup.Item className="d-flex justify-content-between align-items-start">
                              <div>
                                <strong><i className="fas fa-hashtag me-1 text-muted"></i> Mã thanh toán:</strong>
                                <div className="text-success fw-bold font-monospace">{payment._id}</div>
                              </div>
                              <Button variant="outline-secondary" size="sm" onClick={() => navigator.clipboard.writeText(payment._id)}>
                                <i className="bi bi-clipboard"></i>
                              </Button>
                            </ListGroup.Item>
                            <ListGroup.Item>
                              <strong><i className="fas fa-coins me-1 text-warning"></i> Tên phí:</strong> 
                              <div className="mt-1">{payment.fee?.name}</div>
                              {payment.fee?.description && (
                                <small className="text-muted d-block">{payment.fee.description}</small>
                              )}
                            </ListGroup.Item>
                            <ListGroup.Item>
                              <strong><i className="fas fa-home me-1 text-info"></i> Căn hộ:</strong> 
                              <div className="mt-1">
                                <Link to={`/households/${payment.household?._id}`} className="text-decoration-none">
                                  {payment.household?.apartmentNumber}
                                </Link>
                              </div>
                            </ListGroup.Item>
                            <ListGroup.Item>
                              <strong><i className="fas fa-money-bill-wave me-1 text-success"></i> Số tiền:</strong> 
                              <div className="fs-4 text-primary fw-bold mt-1">
                                {payment.amount?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                              </div>
                            </ListGroup.Item>
                            <ListGroup.Item>
                              <strong><i className="fas fa-receipt me-1 text-secondary"></i> Mã biên lai:</strong> 
                              <div className="mt-1 font-monospace">{payment.receiptNumber || 'Chưa có'}</div>
                            </ListGroup.Item>
                          </ListGroup>
                        </Col>
                        <Col md={6} className="mb-3">
                          <h5 className="mb-3 text-secondary border-bottom pb-2">
                            <i className="fas fa-calendar-alt me-2"></i>Thời gian & Người thanh toán
                          </h5>
                          <ListGroup variant="flush">
                            <ListGroup.Item>
                              <strong><i className="fas fa-user me-1 text-primary"></i> Người thanh toán:</strong> 
                              <div className="mt-1">{payment.payerName || 'Chưa có thông tin'}</div>
                            </ListGroup.Item>
                            <ListGroup.Item>
                              <strong><i className="fas fa-phone me-1 text-success"></i> Số điện thoại:</strong> 
                              <div className="mt-1">
                                {payment.payerPhone ? (
                                  <a href={`tel:${payment.payerPhone}`} className="text-decoration-none">
                                    {payment.payerPhone}
                                  </a>
                                ) : 'Chưa có'}
                              </div>
                            </ListGroup.Item>
                            <ListGroup.Item>
                              <strong><i className="fas fa-id-card me-1 text-info"></i> CMND/CCCD:</strong> 
                              <div className="mt-1 font-monospace">{payment.payerId || 'Chưa có'}</div>
                            </ListGroup.Item>
                            <ListGroup.Item>
                              <strong><i className="fas fa-calendar-day me-1"></i> Ngày thanh toán:</strong> 
                              <div className="mt-1">
                                {payment.paymentDate ? (
                                  <>
                                    {new Date(payment.paymentDate).toLocaleDateString('vi-VN')}
                                    <small className="text-muted ms-2">
                                      ({new Date(payment.paymentDate).toLocaleTimeString('vi-VN')})
                                    </small>
                                  </>
                                ) : 'Chưa thanh toán'}
                              </div>
                            </ListGroup.Item>
                            <ListGroup.Item>
                              <strong><i className="fas fa-calendar me-1"></i> Kỳ thanh toán:</strong> 
                              <div className="mt-1">
                                {payment.period ? new Date(payment.period).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) : 'N/A'}
                              </div>
                            </ListGroup.Item>
                            <ListGroup.Item>
                              <strong><i className="fas fa-sticky-note me-1 text-secondary"></i> Ghi chú:</strong> 
                              <div className="mt-1 fst-italic">
                                {payment.note || (
                                  <span className="text-muted">Không có ghi chú</span>
                                )}
                              </div>
                            </ListGroup.Item>
                          </ListGroup>
                        </Col>
                      </Row>
                    </div>
                  </Tab>

                  <Tab eventKey="history" title={<><i className="bi bi-clock-history me-1"></i>Lịch sử ({paymentHistory.length})</>}>
                    <div className="p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="text-secondary">
                          <i className="bi bi-clock-history me-2"></i>Lịch sử thay đổi
                        </h5>
                        <Button variant="outline-secondary" size="sm" onClick={fetchPaymentHistory}>
                          <i className="bi bi-arrow-clockwise me-1"></i>Làm mới
                        </Button>
                      </div>
                      {paymentHistory.length > 0 ? (
                        <div className="timeline">
                          {paymentHistory.map((history, index) => (
                            <div key={index} className="timeline-item mb-3">
                              <div className="d-flex align-items-start">
                                <div className="timeline-marker bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: 40, height: 40}}>
                                  <i className="bi bi-clock-history"></i>
                                </div>
                                <div className="flex-grow-1">
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                      <h6 className="mb-1">{history.action}</h6>
                                      <p className="text-muted mb-1">{history.description}</p>
                                      <small className="text-muted">
                                        Bởi: {history.user?.name || 'Hệ thống'} • {new Date(history.createdAt).toLocaleString('vi-VN')}
                                      </small>
                                    </div>
                                    <Badge bg="secondary">{history.type}</Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i className="bi bi-clock-history text-muted" style={{fontSize: '3rem'}}></i>
                          <p className="text-muted mt-2">Chưa có lịch sử thay đổi</p>
                        </div>
                      )}
                    </div>
                  </Tab>

                  <Tab eventKey="related" title={<><i className="bi bi-link-45deg me-1"></i>Liên quan ({relatedPayments.length})</>}>
                    <div className="p-4">
                      <h5 className="text-secondary mb-3">
                        <i className="bi bi-link-45deg me-2"></i>Thanh toán liên quan
                      </h5>
                      {relatedPayments.length > 0 ? (
                        <Row>
                          {relatedPayments.map((relatedPayment) => (
                            <Col md={6} key={relatedPayment._id} className="mb-3">
                              <Card className="h-100 border-0 shadow-sm">
                                <Card.Body>
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <h6 className="mb-0">{relatedPayment.fee?.name}</h6>
                                    <Badge bg={relatedPayment.status === 'paid' ? 'success' : 'warning'}>
                                      {relatedPayment.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                    </Badge>
                                  </div>
                                  <p className="text-muted mb-2">
                                    {relatedPayment.amount?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                                  </p>
                                  <p className="text-muted small mb-2">
                                    Kỳ: {relatedPayment.period ? new Date(relatedPayment.period).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) : 'N/A'}
                                  </p>
                                  <Link to={`/payments/${relatedPayment._id}`} className="btn btn-outline-primary btn-sm">
                                    <i className="bi bi-eye me-1"></i>Xem chi tiết
                                  </Link>
                                </Card.Body>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      ) : (
                        <div className="text-center py-4">
                          <i className="bi bi-link-45deg text-muted" style={{fontSize: '3rem'}}></i>
                          <p className="text-muted mt-2">Không có thanh toán liên quan</p>
                        </div>
                      )}
                    </div>
                  </Tab>

                  {canComment && (
                    <Tab eventKey="comments" title={<><i className="bi bi-chat-dots me-1"></i>Bình luận ({comments.length})</>}>
                      <div className="p-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="text-secondary">
                            <i className="bi bi-chat-dots me-2"></i>Bình luận & Ghi chú
                          </h5>
                          <Button variant="primary" size="sm" onClick={() => commentInputRef.current?.focus()}>
                            <i className="bi bi-plus-circle me-1"></i>Thêm bình luận
                          </Button>
                        </div>
                        
                        {/* Add comment form */}
                        <Card className="mb-4">
                          <Card.Body>
                            <Form onSubmit={(e) => { e.preventDefault(); handleAddComment(); }}>
                              <FloatingLabel label="Nhập bình luận...">
                                <Form.Control 
                                  ref={commentInputRef}
                                  as="textarea" 
                                  style={{height: '100px'}}
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  placeholder="Nhập bình luận..."
                                />
                              </FloatingLabel>
                              <div className="d-flex justify-content-end mt-2">
                                <Button 
                                  type="submit" 
                                  disabled={!newComment.trim()}
                                  size="sm"
                                >
                                  <i className="bi bi-send me-1"></i>Gửi bình luận
                                </Button>
                              </div>
                            </Form>
                          </Card.Body>
                        </Card>

                        {/* Comments list */}
                        {comments.length > 0 ? (
                          comments.map((comment, index) => (
                            <Card key={index} className="mb-3">
                              <Card.Body>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div className="d-flex align-items-center">
                                    <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{width: 32, height: 32}}>
                                      {comment.user?.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                      <h6 className="mb-0">{comment.user?.name || 'Người dùng'}</h6>
                                      <small className="text-muted">{new Date(comment.createdAt).toLocaleString('vi-VN')}</small>
                                    </div>
                                  </div>
                                  <Badge bg="secondary">{comment.user?.role || 'user'}</Badge>
                                </div>
                                <p className="mb-0">{comment.content}</p>
                              </Card.Body>
                            </Card>
                          ))
                        ) : (
                          <div className="text-center py-4">
                            <i className="bi bi-chat-dots text-muted" style={{fontSize: '3rem'}}></i>
                            <p className="text-muted mt-2">Chưa có bình luận nào</p>
                          </div>
                        )}
                      </div>
                    </Tab>
                  )}

                  {attachments.length > 0 && (
                    <Tab eventKey="attachments" title={<><i className="bi bi-paperclip me-1"></i>Tệp đính kèm ({attachments.length})</>}>
                      <div className="p-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="text-secondary">
                            <i className="bi bi-paperclip me-2"></i>Tệp đính kèm
                          </h5>
                          <input 
                            ref={uploadInputRef}
                            type="file" 
                            className="d-none"
                            onChange={(e) => setUploadFile(e.target.files[0])}
                          />
                          <Button 
                            variant="outline-primary" 
                            size="sm"
                            onClick={() => uploadInputRef.current?.click()}
                          >
                            <i className="bi bi-upload me-1"></i>Tải tệp lên
                          </Button>
                        </div>

                        {uploadProgress > 0 && (
                          <div className="mb-3">
                            <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} />
                          </div>
                        )}

                        <Row>
                          {attachments.map((attachment, index) => (
                            <Col md={4} key={index} className="mb-3">
                              <Card className="h-100">
                                <Card.Body className="text-center">
                                  <i className="bi bi-file-earmark text-primary" style={{fontSize: '2rem'}}></i>
                                  <h6 className="mt-2">{attachment.filename}</h6>
                                  <small className="text-muted">{attachment.size} bytes</small>
                                  <div className="mt-2">
                                    <Button variant="outline-primary" size="sm" href={attachment.url} target="_blank">
                                      <i className="bi bi-download me-1"></i>Tải về
                                    </Button>
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    </Tab>
                  )}
                </Tabs>
              </Card.Body>
            </Card>
          </div>
        </>
      )}

      {/* Toast Notifications */}
      <ToastContainer position="top-end" className="p-3">
        <Toast show={showToast} onClose={() => setShowToast(false)} bg={toastVariant}>
          <Toast.Body className="text-white">
            <i className={`bi ${toastVariant === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-2`}></i>
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
};

export default PaymentDetailScreen; 