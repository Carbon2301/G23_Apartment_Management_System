import React, { useState } from 'react';
import { Alert } from 'react-bootstrap';

const Message = ({ variant = 'info', children, dismissible = false }) => {
  const [show, setShow] = useState(true);

  if (!show) return null;

  return (
    <Alert 
      variant={variant}
      dismissible={dismissible}
      onClose={dismissible ? () => setShow(false) : undefined}
    >
      {children}
    </Alert>
  );
};

Message.defaultProps = {
  variant: 'info',
};

export default Message; 