import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const ConfirmDeleteModal = ({
  show,
  onHide,
  onConfirm,
  title = 'Xác nhận xóa',
  message = 'Bạn có chắc chắn muốn xóa mục này? Hành động này không thể hoàn tác.',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  loading = false
}) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      backdrop="static"
      keyboard={!loading}
      contentClassName="border-0 rounded-4"
    >
      <Modal.Header closeButton={!loading} className="border-0 bg-white rounded-top-4">
        <Modal.Title className="fw-bold text-danger">
          <i className="bi bi-exclamation-triangle-fill me-2 text-danger" style={{fontSize: 22}}></i>
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center py-4">
        <p className="mb-0 fs-5">{message}</p>
      </Modal.Body>
      <Modal.Footer className="border-0 bg-white rounded-bottom-4 d-flex justify-content-center gap-2">
        
        <Button
          variant="danger"
          onClick={onConfirm}
          disabled={loading}
          className="px-4 rounded-pill"
        >
        
          {loading ? 'Đang xóa...' : confirmText}
        </Button>
        <Button
          variant="outline-secondary"
          onClick={onHide}
          disabled={loading}
          className="px-4 rounded-pill"
        >
          {cancelText}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmDeleteModal; 