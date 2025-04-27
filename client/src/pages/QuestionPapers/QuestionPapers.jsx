import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import AnimatedPage from '../../components/AnimatedPage';

const QuestionPapers = () => {
  const { refreshAuthHeaders, user } = useAuth();
  const [questionPapers, setQuestionPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  
  // Fetch question papers from the API
  useEffect(() => {
    const fetchQuestionPapers = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Ensure token is available in localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No auth token found in localStorage');
          setError('Authentication token not found. Please log in again.');
          setLoading(false);
          return;
        }
        
        // Ensure headers are set properly
        refreshAuthHeaders();
        
        console.log('Fetching papers for user:', user);
        console.log('User ID type:', typeof user?.id);
        console.log('User ID:', user?.id);
        console.log('Auth headers being used:', {
          Authorization: `Bearer ${token.substring(0, 15)}...`
        });
        
        // NOTE: This is the fixed endpoint with /api/v1 prefix explicitly included
        const response = await api.get('/api/v1/question-papers');
        console.log('Fetched question papers raw response:', response);
        
        if (response.data && response.data.data && response.data.data.questionPapers) {
          console.log('Number of papers received:', response.data.data.questionPapers.length);
          setQuestionPapers(response.data.data.questionPapers);
        } else {
          console.warn('Unexpected response format:', response.data);
          setQuestionPapers([]);
        }
      } catch (err) {
        console.error('Error fetching question papers:', err);
        console.error('Error details:', err.response?.data || 'No response data');
        
        if (err.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else {
          setError('Failed to load question papers. Please try again later.');
        }
        setQuestionPapers([]);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchQuestionPapers();
    } else {
      setError('You must be logged in to view question papers.');
      setLoading(false);
    }
  }, [refreshAuthHeaders, user]);
  
  // Filter papers based on search term and subject filter
  const filteredPapers = questionPapers.filter(paper => {
    const matchesSearch = !searchTerm || 
      (paper.title && paper.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (paper.subject && paper.subject.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesSubject = !subjectFilter || 
      (paper.subject && paper.subject.toLowerCase() === subjectFilter.toLowerCase());
      
    return matchesSearch && matchesSubject;
  });
  
  // Extract unique subjects for the filter dropdown
  const subjects = [...new Set(questionPapers.map(paper => paper.subject).filter(Boolean))];
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-[calc(100vh-200px)]">
      <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white animate-fadeIn">Question Papers</h1>
        <Link
          to="/create-paper"
            className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1"
        >
          Create New
        </Link>
      </div>
      
      {/* Search and Filter */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow mb-8 transition-all duration-300 hover:shadow-md">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <input
              type="text"
              placeholder="Search question papers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
            />
          </div>
          <div className="flex-shrink-0">
            <select 
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
            >
              <option value="">All Subjects</option>
              {subjects.map((subject, index) => (
                <option key={index} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Loading state */}
      {loading && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-12 text-center animate-fadeIn">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading question papers...</p>
        </div>
      )}
      
      {/* Error state */}
      {error && !loading && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg shadow p-6 text-center mb-8 animate-fadeIn">
          <p className="text-red-700 dark:text-red-200">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-all duration-300 hover:shadow-md"
          >
            Refresh
          </button>
        </div>
      )}
      
      {/* Question Papers List */}
      {!loading && !error && filteredPapers.length > 0 ? (
          <div className="space-y-4">
            {filteredPapers.map((paper, index) => (
              <div 
                key={paper._id} 
                className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md" 
              >
                <Link to={`/question-papers/${paper._id}`} className="block">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">{paper.title || 'Untitled Paper'}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Subject: {paper.subject || 'No subject'}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Created: {formatDate(paper.createdAt)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Marks: {paper.totalMarks || 0}</p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
        </div>
      ) : !loading && !error ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-12 text-center animate-fadeIn">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No question papers found.</p>
          <p className="text-gray-500 dark:text-gray-400">
            Click on "Create New" to create your first question paper.
          </p>
        </div>
      ) : null}
    </div>
    </AnimatedPage>
  );
};

export default QuestionPapers; 