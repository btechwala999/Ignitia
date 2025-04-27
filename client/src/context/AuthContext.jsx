import React, { createContext, useState, useContext, useEffect } from 'react';
import api, { setAuthToken } from '../api/api';

// Create the AuthContext
const AuthContext = createContext(null);

// Create the AuthProvider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('token') ? true : false
  );

  // Function to refresh auth headers
  const refreshAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
      if (!isAuthenticated) {
        setIsAuthenticated(true);
      }
      return true;
    }
    return false;
  };

  // Load user data on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.log('No token found');
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        console.log('Token found, initializing session');
        refreshAuthHeaders();
        
        try {
          // Get user data from API only
          const res = await api.get('/api/v1/auth/me');
          console.log('Raw /me response:', res.data);
          
          if (res.data.data && res.data.data.user) {
            const userData = res.data.data.user;
            console.log('User data fetched successfully:', userData);
            console.log('User ID from server:', userData.id);
            console.log('User ID type:', typeof userData.id);
            
            // Ensure we have the correct _id property if id is missing
            if (!userData.id && userData._id) {
              console.log('Using _id instead of id:', userData._id);
              userData.id = userData._id;
            }
            
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            // No user data found
            console.log('No user data returned from API');
            setIsAuthenticated(false);
            localStorage.removeItem('token');
            setAuthToken(null);
          }
        } catch (apiErr) {
          console.warn('Failed to fetch user profile:', apiErr.message);
          setIsAuthenticated(false);
          localStorage.removeItem('token');
          setAuthToken(null);
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Register user
  const register = async (name, email, password, role = 'student') => {
    setAuthLoading(true);
    try {
      const res = await api.post('/api/v1/auth/register', {
        name,
        email,
        password,
        role
      });

      if (res.data?.token) {
        console.log('User registered successfully');
        localStorage.setItem('token', res.data.token);
        setAuthToken(res.data.token);
        
        if (res.data.data && res.data.data.user) {
          console.log('User data received from registration:', res.data.data.user);
          setUser(res.data.data.user);
          setIsAuthenticated(true);
          console.log('Auth state updated after registration');
        }
        
        return { success: true };
      }
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    setAuthLoading(true);
    try {
      console.log('Attempting login for:', email);
      console.log('Making API request to:', api.defaults.baseURL + '/api/v1/auth/login');
      const res = await api.post('/api/v1/auth/login', { email, password });

      if (res.data?.token) {
        console.log('Login successful, got token');
        console.log('Full response:', res.data);
        localStorage.setItem('token', res.data.token);
        setAuthToken(res.data.token);
        
        if (res.data.data && res.data.data.user) {
          console.log('User data received:', res.data.data.user);
          setUser(res.data.data.user);
          setIsAuthenticated(true);
          console.log('Auth state updated, isAuthenticated =', true);
        } else {
          // If login response doesn't include user data, fetch it
          console.log('No user data in login response, fetching from /me endpoint');
          try {
            const userRes = await api.get('/api/v1/auth/me');
            if (userRes.data.data && userRes.data.data.user) {
              console.log('User data fetched after login:', userRes.data.data.user);
              setUser(userRes.data.data.user);
              setIsAuthenticated(true);
              console.log('Auth state updated after fetching user data');
            } else {
              console.error('No user data structure in /me response:', userRes.data);
            }
          } catch (userErr) {
            console.error('Failed to fetch user data after login:', userErr);
          }
        }
        
        return { success: true };
      } else {
        console.error('Login response missing token');
        throw new Error('Login failed: No token received');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    console.log('Logging out');
    localStorage.removeItem('token');
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
    console.log('Logged out, auth state updated');
  };

  // Create auth context value
  const value = {
    user,
    loading,
    authLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshAuthHeaders
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Export the context for advanced usage
export default AuthContext; 