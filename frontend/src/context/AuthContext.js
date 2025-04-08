import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Load user from localStorage on first render
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = localStorage.getItem('userInfo')
          ? JSON.parse(localStorage.getItem('userInfo'))
          : null;
        
        // Always assume the user is valid if it exists in localStorage
        setUserInfo(user);
      } catch (err) {
        localStorage.removeItem('userInfo');
        setUserInfo(null);
        setError('Session data is corrupted. Please login again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  // Login user
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const { data } = await axios.post(
        '/api/users/login',
        { username, password },
        config
      );

      setUserInfo(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      const message = error.response && error.response.data.message
          ? error.response.data.message
          : 'Invalid username or password';
      setError(message);
      return {
        success: false,
        message,
      };
    }
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('userInfo');
    setUserInfo(null);
    navigate('/login');
  };

  // Clear errors
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        userInfo,
        loading,
        error,
        login,
        logout,
        clearError,
        isAuthenticated: !!userInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 