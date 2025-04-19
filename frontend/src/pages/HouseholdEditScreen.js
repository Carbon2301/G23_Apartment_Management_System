import React, { useState, useEffect, useContext } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Message from '../components/common/Message';
import Loader from '../components/common/Loader';
import FormContainer from '../components/common/FormContainer';
import AuthContext from '../context/AuthContext';
import axios from 'axios';

const HouseholdEditScreen = () => {
  const { id } = useParams();
  const isEditMode = !!id;
  
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [note, setNote] = useState('');
  const [active, setActive] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext);
  
  useEffect(() => {
    if (isEditMode) {
      fetchHouseholdDetails();
    }
  }, [id, isEditMode, userInfo]);
  
  const fetchHouseholdDetails = async () => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const { data } = await axios.get(`/api/households/${id}`, config);
      
      setApartmentNumber(data.apartmentNumber);
      setAddress(data.address);
      setArea(data.area || '');
      setNote(data.note || '');
      setActive(data.active);
      
      setLoading(false);
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : 'Không thể tải thông tin hộ gia đình'
      );
      setLoading(false);
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!apartmentNumber.trim()) {
      errors.apartmentNumber = 'Số căn hộ là bắt buộc';
    }
    
    if (!address.trim()) {
      errors.address = 'Địa chỉ là bắt buộc';
    }
    
    if (!area || area <= 0) {
      errors.area = 'Diện tích phải là số dương';
    } else if (area > 1000) {
      errors.area = 'Diện tích không được vượt quá 1000 m²';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const submitHandler = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };
      
      const householdData = {
        apartmentNumber,
        address,
        area: parseFloat(area),
        note,
        active
      };
      
      if (isEditMode) {
        await axios.put(`/api/households/${id}`, householdData, config);
      } else {
        await axios.post('/api/households', householdData, config);
      }
      
      setLoading(false);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/households');
      }, 2000);
      
    } catch (error) {
      setError(
        error.response && error.response.data.message
          ? error.response.data.message
          : `Không thể ${isEditMode ? 'cập nhật' : 'tạo'} hộ gia đình`
      );
      setLoading(false);
    }
  };
  
  return (
    <>
      <Link to='/households' className='btn btn-light my-3'>
        <i className="fas fa-arrow-left"></i> Quay lại
      </Link>
      
      <Card className="shadow-lg border-primary mb-4">
        <Card.Header className="bg-primary text-white d-flex align-items-center">
          <i className="fas fa-home fa-lg me-2"></i>
          <h1 className="mb-0" style={{ fontSize: '1.5rem' }}>{isEditMode ? 'Chỉnh Sửa Hộ Gia Đình' : 'Thêm Hộ Gia Đình Mới'}</h1>
        </Card.Header>
        <Card.Body>
          {error && <Message variant='danger'>{error}</Message>}
          {success && (
            <Message variant='success'>
              Hộ gia đình đã được {isEditMode ? 'cập nhật' : 'tạo'} thành công!
            </Message>
          )}
          {loading && <Loader />}
          <Form onSubmit={submitHandler} noValidate className="p-2">
            <Form.Group controlId='apartmentNumber' className='mb-3'>
              <Form.Label><i className="fas fa-door-open me-1 text-primary"></i> Số Căn Hộ</Form.Label>
              <Form.Control
                type='text'
                placeholder='VD: A101, B202...'
                value={apartmentNumber}
                onChange={(e) => setApartmentNumber(e.target.value)}
                isInvalid={!!validationErrors.apartmentNumber}
                required
              />
              <Form.Control.Feedback type='invalid'>
                {validationErrors.apartmentNumber}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId='address' className='mb-3'>
              <Form.Label><i className="fas fa-map-marker-alt me-1 text-success"></i> Địa Chỉ</Form.Label>
              <Form.Control
                type='text'
                placeholder='Nhập địa chỉ chi tiết...'
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                isInvalid={!!validationErrors.address}
                required
              />
              <Form.Control.Feedback type='invalid'>
                {validationErrors.address}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId='area' className='mb-3'>
              <Form.Label><i className="fas fa-ruler-combined me-1 text-info"></i> Diện Tích Căn Hộ (m²)</Form.Label>
              <Form.Control
                type='number'
                placeholder='Nhập diện tích (m²)...'
                value={area}
                onChange={(e) => setArea(e.target.value)}
                isInvalid={!!validationErrors.area}
                min='1'
                max='1000'
                step='0.1'
                required
              />
              <Form.Control.Feedback type='invalid'>
                {validationErrors.area}
              </Form.Control.Feedback>
              <Form.Text className="text-muted">
                Diện tích từ 1 đến 1000 m²
              </Form.Text>
            </Form.Group>
            <Form.Group controlId='note' className='mb-3'>
              <Form.Label><i className="fas fa-sticky-note me-1 text-warning"></i> Ghi Chú</Form.Label>
              <Form.Control
                as='textarea'
                rows={3}
                placeholder='Thêm ghi chú cho hộ gia đình (không bắt buộc)'
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Form.Group>
            {isEditMode && (
              <Form.Group controlId='active' className='mb-3'>
                <Form.Check
                  type='checkbox'
                  label={<span><i className="fas fa-toggle-on me-1 text-success"></i> Đang hoạt động</span>}
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
              </Form.Group>
            )}
            <Button type='submit' variant='primary' className='mt-3 w-100 shadow-sm' size="lg">
              {isEditMode ? <><i className="fas fa-save me-2"></i> Cập Nhật</> : <><i className="fas fa-plus-circle me-2"></i> Tạo Mới</>}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </>
  );
};

export default HouseholdEditScreen; 