import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../../api/api';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../../context/AuthContext';

const QuestionPaperDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshAuthHeaders, user } = useAuth();
  const [questionPaper, setQuestionPaper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Fetch question paper from API
  useEffect(() => {
    const fetchQuestionPaper = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Ensure auth headers are set
        refreshAuthHeaders();
        
        // Use the correct API endpoint with /api/v1 prefix
        const response = await api.get(`/api/v1/question-papers/${id}`);
        console.log('Fetched question paper:', response.data);
        
        if (response.data && response.data.data && response.data.data.questionPaper) {
          setQuestionPaper(response.data.data.questionPaper);
        } else {
          console.warn('Unexpected response format:', response.data);
          setError('Failed to load question paper details.');
        }
      } catch (err) {
        console.error('Error fetching question paper:', err);
        setError('Failed to load question paper. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    if (id && user) {
      fetchQuestionPaper();
    } else if (!user) {
      setError('You must be logged in to view question papers.');
      setLoading(false);
    } else {
      setError('Question paper ID is missing.');
      setLoading(false);
    }
  }, [id, refreshAuthHeaders, user]);
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  // Export to PDF
  const exportToPDF = async () => {
    if (!questionPaper) return;
    
    setExportLoading(true);
    
    try {
      // Call the server-side export endpoint with blob response type
      const response = await api.get(`/api/v1/question-papers/${id}/export`, {
        responseType: 'blob'
      });
      
      // Create a download link for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${questionPaper.title || 'question-paper'}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      link.remove();
      
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          <span className="ml-3">Loading question paper...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link to="/question-papers" className="text-primary-600 hover:text-primary-700">
            ← Back to Question Papers
          </Link>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg shadow p-6 text-center">
          <p className="text-red-700 dark:text-red-200 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }
  
  if (!questionPaper) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link to="/question-papers" className="text-primary-600 hover:text-primary-700">
            ← Back to Question Papers
          </Link>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 text-center">
          <p className="text-gray-700 dark:text-gray-300">Question paper not found.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <Link to="/question-papers" className="text-primary-600 hover:text-primary-700">
          ← Back to Question Papers
        </Link>
      </div>
      
      {/* Paper Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {questionPaper.title || 'Untitled Question Paper'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Subject: {questionPaper.subject || 'No subject'}</p>
            <p className="text-gray-600 dark:text-gray-300">Duration: {questionPaper.duration || 0} minutes</p>
            <p className="text-gray-600 dark:text-gray-300">Total Marks: {questionPaper.totalMarks || 0}</p>
            <p className="text-gray-600 dark:text-gray-300">Created: {formatDate(questionPaper.createdAt)}</p>
          </div>
          <div className="flex space-x-3 mt-4 md:mt-0">
            <button 
              onClick={exportToPDF}
              disabled={exportLoading}
              className={`px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition ${exportLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {exportLoading ? 'Exporting...' : 'Export PDF'}
            </button>
          </div>
        </div>
        {questionPaper.description && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Description:</h3>
            <p className="mt-1 text-gray-600 dark:text-gray-300">{questionPaper.description}</p>
          </div>
        )}
        
        {questionPaper.syllabus && questionPaper.syllabus.length > 0 && questionPaper.syllabus[0] && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Syllabus:</h3>
            <p className="mt-1 text-gray-600 dark:text-gray-300 whitespace-pre-line">
              {Array.isArray(questionPaper.syllabus) ? questionPaper.syllabus[0] : questionPaper.syllabus}
            </p>
          </div>
        )}
      </div>
      
      {/* Questions */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Questions</h2>
        </div>
        
        {questionPaper.questions && questionPaper.questions.length > 0 ? (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {questionPaper.questions.map((question, index) => (
              <li key={index} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-baseline">
                      <span className="text-lg font-medium mr-2 text-gray-900 dark:text-white">Q{index + 1}.</span>
                      <span className="text-lg text-gray-900 dark:text-white">{question.text}</span>
                    </div>
                    
                    {/* Display options for MCQ questions */}
                    {question.type === 'mcq' && question.options && question.options.length > 0 && (
                      <div className="mt-4 ml-8 space-y-2">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="text-gray-800 dark:text-gray-200">
                            <span className="font-medium mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                            <span>{option}</span>
                            {question.correctAnswer === option && (
                              <span className="ml-2 text-green-600 dark:text-green-400">(Correct)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Type:</span>
                        <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">{question.type}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Marks:</span>
                        <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">{question.marks}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Difficulty:</span>
                        <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">{question.difficulty}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Topic:</span>
                        <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">{question.topic}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No questions available.
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionPaperDetail; 