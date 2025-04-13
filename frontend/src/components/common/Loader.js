import React from 'react';
import { Spinner } from 'react-bootstrap';

const Loader = ({ size = 'medium', text = 'Loading...', centered = true }) => {
  // Convert size to pixel values
  const spinnerSize = {
    small: 16,
    medium: 32,
    large: 64
  }[size] || 32;

  return (
    <div
      className={`d-flex ${centered ? 'justify-content-center' : ''} align-items-center my-3`}
    >
      <Spinner
        animation="border"
        role="status"
        style={{
          width: `${spinnerSize}px`,
          height: `${spinnerSize}px`,
          margin: 'auto',
          display: 'block',
        }}
      >
        <span className="visually-hidden">{text}</span>
      </Spinner>
      {text !== null && (
        <span className="ms-2">{text}</span>
      )}
    </div>
  );
};

export default Loader; 