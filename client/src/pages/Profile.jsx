import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user: authUser, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  
  // Load user data from API directly
  useEffect(() => {
    const fetchUserData = async () => {
      // Wait for auth context to initialize
      if (authLoading) {
        return;
      }

      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      setLoading(true);
      try {
        // Get user data directly from API for the most up-to-date information
        const response = await axios.get('/api/v1/auth/me');
        
        if (response.data?.user) {
          setUserData(response.data.user);
        } else {
          // If no user data, use authUser as backup
          setUserData(authUser);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Use auth context data as fallback
        setUserData(authUser);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [authUser, isAuthenticated, authLoading, navigate]);
  
  if (loading || authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // If no user data is available, show error message
  if (!userData) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center p-6 bg-red-50 dark:bg-red-900/30 rounded-lg">
          <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">User Profile Not Available</h2>
          <p className="text-red-600 dark:text-red-300">
            Unable to load your profile information. Please try logging in again.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Your Profile</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Personal Information</h2>
          </div>
        </div>
        
        <div className="p-6">
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center">
            <div className="sm:w-1/4 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-0">
              Profile Picture
            </div>
            <div className="sm:w-3/4 flex items-center gap-4">
              <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-200 overflow-hidden">
                {userData.profilePic ? (
                  <img src={userData.profilePic} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl">{(userData.name && userData.name.charAt(0)) || 'U'}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="mb-6 flex flex-col sm:flex-row">
            <div className="sm:w-1/4 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-0 pt-2">
              Name
            </div>
            <div className="sm:w-3/4">
              <p className="text-gray-900 dark:text-white">{userData.name || 'User'}</p>
            </div>
          </div>
          
          <div className="mb-6 flex flex-col sm:flex-row">
            <div className="sm:w-1/4 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-0 pt-2">
              Email
            </div>
            <div className="sm:w-3/4">
              <p className="text-gray-900 dark:text-white">{userData.email || 'Not available'}</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row">
            <div className="sm:w-1/4 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-0 pt-2">
              Role
            </div>
            <div className="sm:w-3/4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                userData.role === 'admin' 
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                  : userData.role === 'teacher' 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              }`}>
                {userData.role === 'admin' 
                  ? 'Administrator' 
                  : userData.role === 'teacher' 
                    ? 'Teacher'
                    : 'Student'
                }
              </span>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {userData.role === 'admin' 
                  ? 'You have full access to all features of the platform.' 
                  : userData.role === 'teacher' 
                    ? 'You can create question papers and solve questions.'
                    : 'You can solve questions but cannot create question papers.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 