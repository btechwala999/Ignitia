import React from 'react';
import { useAuth } from '../context/AuthContext';

// This is just a test component to verify AuthContext works
const TestAuth = () => {
  const auth = useAuth();
  console.log('Auth context test:', auth);
  
  return (
    <div>
      <h1>Auth Test Component</h1>
      <p>Check console to see if auth context is working</p>
    </div>
  );
};

export default TestAuth; 