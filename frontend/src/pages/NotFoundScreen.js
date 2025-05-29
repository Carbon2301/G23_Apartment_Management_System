import React from 'react';
import { Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const NotFoundScreen = () => {
  return (
    <Row className="justify-content-center align-items-center vh-100 bg-light">
      <Col md={6} lg={5}>
        <Card className="shadow-lg border-danger text-center">
          <Card.Body>
            <div className="mb-4">
              <i className="fas fa-exclamation-circle text-danger animate__animated animate__shakeX" style={{ fontSize: '5rem' }}></i>
            </div>
            <h1 className="display-2 fw-bold text-danger">404</h1>
            <h2 className="mb-3 text-dark">Không tìm thấy trang</h2>
            <p className="lead mb-4 text-secondary">
              Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.<br />Vui lòng kiểm tra lại đường dẫn hoặc quay về trang chủ.
            </p>
            <Link to="/">
              <Button variant="danger" size="lg" className="w-100 shadow-sm">
                <i className="fas fa-home me-2"></i> Về trang chủ
              </Button>
            </Link>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default NotFoundScreen;
