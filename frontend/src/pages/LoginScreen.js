import React, { useState, useEffect, useContext, useRef, useLayoutEffect } from 'react';
import { Form, Button, Row, Col, Card, Container, Image } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import Message from '../components/common/Message';
import Loader from '../components/common/Loader';
import AuthContext from '../context/AuthContext';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login, userInfo, loading } = useContext(AuthContext);
  
  const formCardRef = useRef(null);
  const [formHeight, setFormHeight] = useState(null);
  
  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (userInfo) {
      navigate('/dashboard');
    }
  }, [navigate, userInfo]);
  
  useLayoutEffect(() => {
    if (formCardRef.current) {
      setFormHeight(formCardRef.current.offsetHeight);
    }
  }, [username, password, error, loading]);
  
  const submitHandler = async (e) => {
    e.preventDefault();
    setError('');
    
    const result = await login(username, password);
    
    if (!result.success) {
      setError(result.message);
    } else {
      navigate('/dashboard');
    }
  };
  
  return (
    <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <Row className="w-100 justify-content-center align-items-center g-0">
        {/* Cột form đăng nhập bên trái */}
        <Col xs={12} md={6} lg={5} xl={4} className="d-flex justify-content-center align-items-center order-1 order-md-1">
          <Card ref={formCardRef} className="p-4 shadow-lg border-0 rounded-4 bg-white w-100">
            <Card.Body>
              <div className="text-center mb-4">
                {/* Fake logo */}
                <div className="mb-2">
                  <span className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: 56, height: 56, fontSize: 32 }}>
                    <i className="bi bi-house-door-fill"></i>
                  </span>
                </div>
                <h2 className="mb-1 fw-bold">Đăng nhập</h2>
                <p className="text-muted mb-0">Quản lý chung cư G23</p>
              </div>
              {error && <Message variant="danger">{error}</Message>}
              {loading && <Loader />}
              <Form onSubmit={submitHandler} className="mt-3">
                <Form.Group controlId="username" className="mb-3">
                  <Form.Label className="fw-semibold">Tên đăng nhập</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nhập tên đăng nhập"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    size="lg"
                    autoFocus
                  />
                </Form.Group>
                <Form.Group controlId="password" className="mb-3">
                  <Form.Label className="fw-semibold">Mật khẩu</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    size="lg"
                  />
                </Form.Group>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-100 py-2 mt-2 fw-bold fs-5 shadow-sm"
                  disabled={loading}
                  size="lg"
                >
                  {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                </Button>
              </Form>
              <div className="alert alert-info mt-4 rounded-3 py-2 px-3 small">
                <p className="mb-0"><strong>Lưu ý:</strong> Tài khoản quản lý chỉ được cấp bởi quản trị viên hệ thống.</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        {/* Cột hình ảnh minh họa bên phải */}
        <Col md={6} lg={7} xl={6} className="d-none d-md-flex align-items-center order-2 order-md-2 p-0 m-0">
          <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', padding: 0, margin: 0 }}>
            <Image
              src="https://vietlandjsc.vn/uploads/tin-tuc/quan-ly-chung-cu-cao-cap.jpg"
              alt="Hình minh họa chung cư"
              fluid
              rounded
              className="shadow-lg"
              style={{
                height: formHeight ? formHeight : 400,
                maxHeight: 600,
                objectFit: 'cover',
                width: '100%',
                maxWidth: '100%',
                margin: 0,
                padding: 0
              }}
            />
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginScreen; 