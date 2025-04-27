import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Debug = () => {
  const { user, isAuthenticated, refreshAuthHeaders } = useAuth();
  const [serverStatus, setServerStatus] = useState('Checking...');
  const [authStatus, setAuthStatus] = useState('Checking...');
  const [tokenInfo, setTokenInfo] = useState('No token found');
  const [apiResponse, setApiResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualToken, setManualToken] = useState('');

  useEffect(() => {
    checkServerStatus();
    checkAuthStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/v1/auth/status', {
        timeout: 5000,
        validateStatus: status => true
      });
      setServerStatus(response.status === 200 ? '✅ Connected' : `❌ Error (${response.status})`);
    } catch (error) {
      setServerStatus(`❌ Error: ${error.message}`);
    }
  };

  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    
    if (token) {
      setTokenInfo(`Token exists: ${token.substring(0, 20)}...`);
      try {
        // Try to decode the token to get expiration info
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const expDate = new Date(payload.exp * 1000);
          const isExpired = expDate < new Date();
          
          setTokenInfo(`Token: ${token.substring(0, 20)}...\nExpires: ${expDate.toLocaleString()}\nStatus: ${isExpired ? '❌ EXPIRED' : '✅ Valid'}`);
        }
      } catch (e) {
        setTokenInfo(`Token exists but could not be decoded: ${token.substring(0, 20)}...`);
      }
    } else {
      setTokenInfo('No token found in localStorage');
    }
    
    setAuthStatus(isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated');
  };

  const testApiCall = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setApiResponse({
        status: response.status,
        data: response.data
      });
    } catch (error) {
      setApiResponse({
        error: true,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
    } finally {
      setLoading(false);
    }
  };

  const setToken = () => {
    if (manualToken) {
      localStorage.setItem('token', manualToken);
      refreshAuthHeaders();
      checkAuthStatus();
      alert('Token set successfully. Refresh the page to update auth state.');
    }
  };

  const clearToken = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    checkAuthStatus();
    alert('Token cleared. Refresh the page to update auth state.');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">Authentication Debug</h1>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">System Status</h2>
          
          <div className="space-y-4 mb-4">
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">Server Connection:</span>
              <span className="text-gray-900 dark:text-white">{serverStatus}</span>
            </div>
            
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">Authentication Status:</span>
              <span className="text-gray-900 dark:text-white">{authStatus}</span>
            </div>
            
            <div className="flex justify-between border-b pb-2">
              <span className="font-medium text-gray-700 dark:text-gray-300">User:</span>
              <span className="text-gray-900 dark:text-white">
                {user ? `${user.name} (${user.email})` : 'Not logged in'}
              </span>
            </div>
          </div>
          
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Token Information</h3>
            <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-auto whitespace-pre-wrap text-gray-900 dark:text-white">
              {tokenInfo}
            </pre>
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={checkServerStatus} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Check Server
            </button>
            <button 
              onClick={checkAuthStatus} 
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Check Auth
            </button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">API Test</h2>
          
          <button 
            onClick={testApiCall} 
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 mb-4"
            disabled={loading}
          >
            {loading ? 'Testing...' : 'Test API Call'}
          </button>
          
          {apiResponse && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">
                Response {apiResponse.error ? '(Error)' : ''}
              </h3>
              <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-auto max-h-60 text-gray-900 dark:text-white">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Manual Token Management</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Set Token Manually
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Paste JWT token here"
              />
              <button 
                onClick={setToken} 
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Set Token
              </button>
            </div>
          </div>
          
          <div>
            <button 
              onClick={clearToken} 
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Clear Token
            </button>
          </div>
        </div>
        
        <div className="text-center mt-6">
          <Link to="/" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Debug; 