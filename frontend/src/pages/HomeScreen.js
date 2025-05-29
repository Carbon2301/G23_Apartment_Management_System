import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const HomeScreen = () => {
  return (
    <>
      <Row className="py-5 bg-light mb-4">
        <Col md={8} className="mx-auto text-center">
          <h1>Welcome to BlueMoon Apartment</h1>
          <p className="lead">
            Comprehensive fee management system for apartment residents and administration
          </p>
          <Link to="/login">
            <Button variant="primary" size="lg" className="mx-2">
              Sign In
            </Button>
          </Link>
        </Col>
      </Row>

      <Row>
        <Col md={4}>
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Card.Title>
                <i className="fas fa-home text-primary me-2"></i>
                Household Management
              </Card.Title>
              <Card.Text>
                Easily manage apartment households, track residents and maintain accurate records of all occupants.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Card.Title>
                <i className="fas fa-file-invoice-dollar text-success me-2"></i>
                Fee Collection
              </Card.Title>
              <Card.Text>
                Streamline the process of managing apartment fees, utilities, and other charges with our intuitive system.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Card.Title>
                <i className="fas fa-chart-line text-info me-2"></i>
                Reports & Analytics
              </Card.Title>
              <Card.Text>
                Generate detailed reports on payment status, resident statistics, and financial summaries.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mt-4">
        <Col md={6}>
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Card.Title>
                <i className="fas fa-users text-warning me-2"></i>
                Resident Information
              </Card.Title>
              <Card.Text>
                Maintain comprehensive resident profiles including contact information, documentation, and residence status.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <Card.Title>
                <i className="fas fa-lock text-danger me-2"></i>
                Secure & Reliable
              </Card.Title>
              <Card.Text>
                Our system ensures data security and provides reliable access to important apartment management information.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default HomeScreen; 