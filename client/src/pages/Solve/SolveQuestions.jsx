import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

// Add model options
const modelOptions = [
  { label: 'LLaMA 3 70B (Best Quality)', value: 'llama3-70b-8192' },
  { label: 'LLaMA 3 8B (Faster)', value: 'llama3-8b-8192' },
  { label: 'Mixtral 8x7B (Long Context)', value: 'mixtral-8x7b-32768' },
  { label: 'Gemma 7B (Balanced)', value: 'gemma-7b-it' }
];

const SolveQuestions = () => {
  const [question, setQuestion] = useState('');
  const [selectedModel, setSelectedModel] = useState('llama3-70b-8192');
  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState(null);
  const [error, setError] = useState('');
  const { user, isAuthenticated, refreshAuthHeaders } = useAuth();
  const navigate = useNavigate();
  
  // Check authentication on component mount
  useEffect(() => {
    if (refreshAuthHeaders) {
      refreshAuthHeaders();
    }
  }, [refreshAuthHeaders]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check authentication
    if (!isAuthenticated) {
      setError('You are not logged in. Please log in to solve questions.');
      return;
    }
    
    if (!question.trim()) return;
    
    setIsLoading(true);
    setSolution(null);
    setError('');
    
    try {
      // Get token for authorization
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setIsLoading(false);
        return;
      }
      
      // Call the backend API to solve the question
      const response = await api.post('/api/v1/question-papers/solve', 
        {
          question: question,
          subject: 'general', // You could add a subject selector in the future
          model: selectedModel
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.data.status === 'success') {
        setSolution(response.data.data.solution);
      } else {
        setError('Failed to get solution. Please try again.');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error solving question:', error);
      
      // Handle unauthorized error
      if (error.response && error.response.status === 401) {
        setError('Your session has expired. Please log in again to continue.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
      // Display specific error message from API if available
      else if (error.response && error.response.data && error.response.data.message) {
        setError(`Error: ${error.response.data.message}`);
      } else {
        setError(`Failed to get solution: ${error.message || 'Unknown error'}`);
      }
      
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Solve Questions</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Enter Your Question</h2>
        
        {!isAuthenticated && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-md">
            <p className="font-medium">Error: You are not logged in. Please log in to get access.</p>
            <div className="mt-2">
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Log in
              </Link> or 
              <Link to="/register" className="ml-2 text-primary-600 hover:text-primary-700 font-medium">
                Register
              </Link>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Type or paste your question here..."
              disabled={!isAuthenticated}
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
              AI Model
            </label>
            <select
              id="model"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              disabled={!isAuthenticated}
            >
              {modelOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Select the AI model to use for solving your question.
            </p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md">
              {error}
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <p className="text-sm text-gray-500">
                Enter your question in the text area above
              </p>
            </div>
            <button
              type="submit"
              disabled={isLoading || !question.trim() || !isAuthenticated}
              className={`px-4 py-2 ${
                isLoading || !question.trim() || !isAuthenticated
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-primary-500 hover:bg-primary-600'
              } text-white rounded-md transition`}
            >
              {isLoading ? 'Solving...' : 'Solve Question'}
            </button>
          </div>
        </form>
      </div>
      
      {isLoading && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-700 mb-4">Solving your question...</p>
          <p className="text-gray-500">This may take a few moments.</p>
        </div>
      )}
      
      {solution && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Solution</h2>
            <p className="text-gray-600 mt-1">Step-by-step explanation</p>
          </div>
          <div className="p-6">
            <div className="prose prose-primary max-w-none">
              <div dangerouslySetInnerHTML={{ __html: solution.replace(/\n/g, '<br>') }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SolveQuestions; 