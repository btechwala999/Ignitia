import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FiEdit2, FiTrash2, FiDownload, FiClock, FiFileText, FiCheck, FiEye } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import DashboardHeader from '../../components/Dashboard/DashboardHeader';
import Spinner from '../../components/UI/Spinner';

const Dashboard = () => {
  const [papers, setPapers] = useState([]);
  const [filteredPapers, setFilteredPapers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Statistics
  const [stats, setStats] = useState({
    totalPapers: 0,
    totalQuestions: 0,
    papersSolved: 0,
    papersExported: 0
  });
  
  useEffect(() => {
    const fetchPapers = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('/api/v1/question-papers');
        
        setPapers(response.data.questionPapers);
        setFilteredPapers(response.data.questionPapers);
        
        // Calculate stats
        const totalQuestions = response.data.questionPapers.reduce((acc, paper) => 
          acc + (paper.questions ? paper.questions.length : 0), 0);
        
        const papersSolved = response.data.questionPapers.filter(
          paper => paper.attempts && paper.attempts.length > 0).length;
          
        const papersExported = response.data.questionPapers.filter(
          paper => paper.exports && paper.exports > 0).length;
        
        setStats({
          totalPapers: response.data.questionPapers.length,
          totalQuestions,
          papersSolved,
          papersExported
        });
        
        setIsLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch question papers');
        setIsLoading(false);
      }
    };
    
    fetchPapers();
  }, []);
  
  const handleSearch = (searchTerm) => {
    if (!searchTerm) {
      setFilteredPapers(papers);
      return;
    }
    
    const filtered = papers.filter(paper => 
      paper.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      paper.class.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredPapers(filtered);
  };
  
  const handleDelete = async (paperId) => {
    if (!window.confirm('Are you sure you want to delete this question paper?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/v1/question-papers/${paperId}`);
      
      setPapers(prev => prev.filter(paper => paper._id !== paperId));
      setFilteredPapers(prev => prev.filter(paper => paper._id !== paperId));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalPapers: prev.totalPapers - 1
      }));
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete question paper');
    }
  };
  
  const handleExport = async (paperId) => {
    try {
      const response = await axios.get(
        `/api/v1/question-papers/${paperId}/export`, 
        {
          responseType: 'blob'
        }
      );
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'question-paper.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Update the export count locally
      setPapers(prev => 
        prev.map(paper => 
          paper._id === paperId 
            ? { ...paper, exports: (paper.exports || 0) + 1 } 
            : paper
        )
      );
      setFilteredPapers(prev => 
        prev.map(paper => 
          paper._id === paperId 
            ? { ...paper, exports: (paper.exports || 0) + 1 } 
            : paper
        )
      );
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to export question paper');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHeader 
        title="Question Papers" 
        subtitle="Manage and create your question papers"
        onSearch={handleSearch}
      />
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Papers</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.totalPapers}</h3>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <FiFileText className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Questions</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.totalQuestions}</h3>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <FiCheck className="text-green-600 dark:text-green-400" size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Papers Solved</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.papersSolved}</h3>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <FiEye className="text-purple-600 dark:text-purple-400" size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Papers Exported</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stats.papersExported}</h3>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <FiDownload className="text-amber-600 dark:text-amber-400" size={20} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      {/* Papers Grid */}
      {filteredPapers.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700">
          <h3 className="text-xl font-medium text-slate-800 dark:text-white mb-2">No question papers found</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Get started by creating your first question paper</p>
          <Link 
            to="/create-paper" 
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Create Question Paper
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPapers.map(paper => (
            <div 
              key={paper._id} 
              className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-lg text-slate-800 dark:text-white truncate">{paper.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">{paper.subject}</span>
                      <span className="text-xs font-medium px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded">Class {paper.class}</span>
                      <span className="text-xs font-medium px-2.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded">{paper.totalMarks} Marks</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleDelete(paper._id)}
                      className="p-1 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"
                    >
                      <FiTrash2 size={16} />
                    </button>
                    <Link 
                      to={`/edit-paper/${paper._id}`}
                      className="p-1 text-slate-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400"
                    >
                      <FiEdit2 size={16} />
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-3">
                  <FiClock className="mr-1" size={14} />
                  <span>Created: {format(new Date(paper.createdAt), 'MMM dd, yyyy')}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300 mb-3">
                  <span>Questions: {paper.questions?.length || 0}</span>
                  <span>Time: {paper.timeLimit} min</span>
                </div>
                
                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => handleExport(paper._id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm"
                  >
                    <FiDownload size={14} />
                    <span>Export</span>
                  </button>
                  <Link
                    to={`/view-paper/${paper._id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors text-sm"
                  >
                    <FiEye size={14} />
                    <span>View</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard; 