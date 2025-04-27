import React, { useState } from 'react';
import { FiSearch, FiBell, FiPlus, FiFilter, FiDownload } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { FaPlus, FaSearch } from 'react-icons/fa';

const StatCard = ({ title, value, icon, bgColor }) => (
  <div className={`${bgColor} rounded-lg shadow-md p-4 flex items-center`}>
    <div className="mr-4 text-white text-2xl">
      {icon}
    </div>
    <div>
      <h3 className="text-white text-sm font-medium">{title}</h3>
      <p className="text-white text-xl font-bold">{value}</p>
    </div>
  </div>
);

const DashboardHeader = ({ stats = {}, onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Question Papers</h1>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search papers..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <FaSearch className="absolute right-3 top-3 text-gray-400" />
          </div>
          
          <Link
            to="/create-paper"
            className="flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FaPlus /> New Paper
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Papers" 
          value={stats.totalPapers || 0} 
          icon={<i className="fas fa-file-alt"></i>} 
          bgColor="bg-blue-500" 
        />
        <StatCard 
          title="Total Questions" 
          value={stats.totalQuestions || 0} 
          icon={<i className="fas fa-question-circle"></i>} 
          bgColor="bg-green-500" 
        />
        <StatCard 
          title="Papers Solved" 
          value={stats.papersSolved || 0} 
          icon={<i className="fas fa-check-circle"></i>} 
          bgColor="bg-yellow-500" 
        />
        <StatCard 
          title="Papers Exported" 
          value={stats.papersExported || 0} 
          icon={<i className="fas fa-file-export"></i>} 
          bgColor="bg-purple-500" 
        />
      </div>
    </div>
  );
};

export default DashboardHeader; 