import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';
import { FiFileText, FiCheckCircle, FiPieChart, FiBook } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/UI/Spinner';
import QuestionPaperInsights from '../components/Dashboard/QuestionPaperInsights';
import AnimatedPage from '../components/AnimatedPage';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    papers: { count: 0 },
    questions: { total: 0 },
    paperQuality: { score: 0 },
    recentPapers: [],
    subjects: []
  });

  // Function to properly parse the API response
  const parseQuestionPapers = (apiData) => {
    // Detailed logging for debugging the response structure
    console.log('Parsing question papers from:', apiData);
    
    // Check if data exists
    if (!apiData) {
      console.error('API data is null or undefined');
      return { papers: [], count: 0, subjects: [] };
    }
    
    // Determine how to access papers based on the response structure
    let papers = [];
    
    if (apiData.questionPapers) {
      // Standard format - questionPapers directly in the data object
      papers = apiData.questionPapers;
      console.log('Found papers in apiData.questionPapers:', papers.length);
    } else if (apiData.data && apiData.data.questionPapers) {
      // Nested format - questionPapers in a data property
      papers = apiData.data.questionPapers;
      console.log('Found papers in apiData.data.questionPapers:', papers.length);
    } else if (Array.isArray(apiData)) {
      // Direct array format
      papers = apiData;
      console.log('API data is directly an array of papers:', papers.length);
    } else {
      // Try to find papers in any top-level property
      const possibleArrays = Object.values(apiData).filter(val => Array.isArray(val));
      if (possibleArrays.length > 0) {
        // Use the first array found
        papers = possibleArrays[0];
        console.log('Found papers in an array property:', papers.length);
      }
    }
    
    // Ensure papers is an array
    papers = Array.isArray(papers) ? papers : [];
    
    // Extract unique subjects from papers
    const subjects = [...new Set(papers.map(paper => paper.subject).filter(Boolean))];
    console.log('Extracted subjects:', subjects);
    
    return {
      papers,
      count: papers.length,
      subjects
    };
  };

  // Calculate Paper Quality Index
  const calculatePaperQualityIndex = (papers) => {
    if (!papers || papers.length === 0) return 0;
    
    // Initialize scores
    let totalScore = 0;
    
    papers.forEach(paper => {
      let paperScore = 0;
      
      // 1. Question diversity score (types of questions)
      if (paper.questions && paper.questions.length > 0) {
        const questionTypes = new Set(paper.questions.map(q => q.type).filter(Boolean));
        const typeScore = (questionTypes.size / 3) * 25; // Assuming 3 types is optimal
        paperScore += Math.min(25, typeScore);
        
        // 2. Difficulty balance score
        const difficulties = paper.questions.map(q => q.difficulty?.toLowerCase()).filter(Boolean);
        const easyCount = difficulties.filter(d => d === 'easy').length;
        const mediumCount = difficulties.filter(d => d === 'medium').length;
        const hardCount = difficulties.filter(d => d === 'hard').length;
        
        const total = difficulties.length;
        if (total > 0) {
          // Ideal distribution: 30% easy, 50% medium, 20% hard
          const easyRatio = easyCount / total;
          const mediumRatio = mediumCount / total;
          const hardRatio = hardCount / total;
          
          // Calculate how close to ideal distribution
          const balanceScore = 25 * (1 - (
            Math.abs(easyRatio - 0.3) + 
            Math.abs(mediumRatio - 0.5) + 
            Math.abs(hardRatio - 0.2)
          ) / 2);
          
          paperScore += Math.max(0, balanceScore);
        }
        
        // 3. Topic coverage score
        const topics = new Set(paper.questions.map(q => q.topic).filter(Boolean));
        const topicScore = Math.min(25, (topics.size / paper.questions.length) * 50);
        paperScore += topicScore;
        
        // 4. Question completeness score
        const completeQuestions = paper.questions.filter(q => 
          q.text && q.difficulty && q.type && q.topic && q.marks
        ).length;
        
        const completenessScore = (completeQuestions / paper.questions.length) * 25;
        paperScore += completenessScore;
      }
      
      totalScore += paperScore;
    });
    
    // Average score across all papers
    const averageScore = Math.round(totalScore / papers.length);
    return averageScore;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('Starting to fetch dashboard data');
        
        // Ensure the loading state is properly set
        setLoading(true);
        
        // Fetch question papers
        console.log('Fetching question papers');
        const response = await api.get('/api/v1/question-papers');
        console.log('Question papers response:', response);
        
        // Parse the papers from the response
        const { papers, count, subjects } = parseQuestionPapers(response.data);
        console.log(`Found ${count} papers after parsing`);
        
        // Log the first paper if available
        if (papers.length > 0) {
          console.log('First paper:', papers[0]);
        }
        
        // Calculate total questions
        const totalQuestions = papers.reduce(
          (sum, paper) => sum + (paper.questions ? paper.questions.length : 0), 0
        );
        
        // Calculate paper quality index
        const qualityScore = calculatePaperQualityIndex(papers);
        
        // Update the stats
        setStats({
          papers: { count },
          questions: {
            total: totalQuestions
          },
          paperQuality: {
            score: qualityScore
          },
          recentPapers: papers,
          subjects
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        console.error('Error details:', error.response?.data);
      } finally {
        // Always set loading to false when done
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return '';
    }
  };

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Welcome, {user?.name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer flex items-center group relative">
          <div className="p-4 rounded-full bg-blue-100 mr-4">
            <FiFileText className="text-blue-600 text-xl" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-1 text-gray-900">Question Papers</h3>
            <p className="text-3xl font-bold text-primary-600">{stats.papers.count}</p>
            <p className="text-gray-500 mt-1">Total papers created</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer flex items-center">
          <div className="p-4 rounded-full bg-green-100 mr-4">
            <FiCheckCircle className="text-green-600 text-xl" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-1 text-gray-900">Questions</h3>
            <p className="text-3xl font-bold text-primary-600">{stats.questions.total}</p>
            <p className="text-gray-500 mt-1">Total questions created</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer flex items-center group relative">
          <div className="p-4 rounded-full bg-purple-100 mr-4">
            <FiPieChart className="text-purple-600 text-xl" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-1 text-gray-900">Paper Quality</h3>
            <p className="text-3xl font-bold text-primary-600">{stats.paperQuality.score}</p>
            <p className="text-gray-500 mt-1">Quality score</p>
          </div>
          
          {/* Tooltip that appears on hover */}
          <div className="absolute invisible group-hover:visible bg-gray-900 text-white text-sm rounded p-3 shadow-lg top-full mt-2 left-0 right-0 mx-auto w-11/12 max-w-[250px] z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute top-[-6px] left-1/2 transform -translate-x-1/2 w-3 h-3 bg-gray-900 rotate-45"></div>
            <div className="text-center mb-2 font-medium">Quality Score Components:</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>• Question Types: 25%</div>
              <div>• Difficulty Balance: 25%</div>
              <div>• Topic Coverage: 25%</div>
              <div>• Completeness: 25%</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Question Paper Insights Panel */}
        {stats.recentPapers && stats.recentPapers.length > 0 && stats.recentPapers.some(paper => paper.questions && paper.questions.length > 0) && (
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <QuestionPaperInsights papers={stats.recentPapers} />
      </div>
        )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Subjects Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">
            <span className="flex items-center">
              <FiBook className="mr-2" /> Subjects
            </span>
          </h2>
          
          {stats.subjects.length === 0 ? (
            <div className="text-gray-600 p-4 text-center">
              <p>No subjects available.</p>
            </div>
          ) : (
              <div className="flex flex-wrap gap-3">
              {stats.subjects.map((subject, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <span className="font-medium text-gray-800">{subject}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Recent Papers */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Recent Papers</h2>
            <Link 
              to="/create-paper" 
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              New Paper
            </Link>
          </div>
          
          {!stats.recentPapers || stats.recentPapers.length === 0 ? (
            <div className="text-gray-600 p-4 text-center">
              <p>No papers created yet.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
              {stats.recentPapers.map((paper, index) => (
                <Link 
                  key={index} 
                  to={`/question-papers/${paper._id}`} 
                  className="block p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-900">{paper.title}</h3>
                      <p className="text-gray-500 text-sm">{paper.subject}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-md">
                        {paper.totalMarks} marks
                      </span>
                      <p className="text-gray-500 text-xs mt-1">
                        {formatDate(paper.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </AnimatedPage>
  );
};

export default Dashboard; 