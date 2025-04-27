import React, { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Helper function to truncate text
const truncateText = (text, maxLength = 15) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

const QuestionPaperInsights = ({ papers = [] }) => {
  // Filter out papers without questions
  const validPapers = useMemo(() => 
    papers.filter(paper => paper.questions && paper.questions.length > 0), 
    [papers]
  );

  // Calculate difficulty distribution
  const difficultyData = useMemo(() => {
    // Initialize counters
    const difficultyCount = {
      easy: 0,
      medium: 0,
      hard: 0
    };

    // Count questions by difficulty
    validPapers.forEach(paper => {
      paper.questions.forEach(question => {
        if (question.difficulty) {
          difficultyCount[question.difficulty.toLowerCase()] = 
            (difficultyCount[question.difficulty.toLowerCase()] || 0) + 1;
        }
      });
    });

    // Prepare data for chart
    return {
      labels: ['Easy', 'Medium', 'Hard'],
      datasets: [
        {
          data: [
            difficultyCount.easy || 0,
            difficultyCount.medium || 0,
            difficultyCount.hard || 0
          ],
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 99, 132, 0.6)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 99, 132, 1)'
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [validPapers]);

  // Calculate question type breakdown
  const questionTypeData = useMemo(() => {
    // Initialize counters
    const typeCount = {
      mcq: 0,
      short: 0,
      long: 0,
      other: 0
    };

    // Count questions by type
    validPapers.forEach(paper => {
      paper.questions.forEach(question => {
        if (question.type) {
          const type = question.type.toLowerCase();
          if (['mcq', 'short', 'long'].includes(type)) {
            typeCount[type] = (typeCount[type] || 0) + 1;
          } else {
            typeCount.other = (typeCount.other || 0) + 1;
          }
        } else {
          typeCount.other = (typeCount.other || 0) + 1;
        }
      });
    });

    // Prepare data for chart
    return {
      labels: ['Multiple Choice', 'Short Answer', 'Long Answer', 'Other'],
      datasets: [
        {
          data: [
            typeCount.mcq || 0,
            typeCount.short || 0,
            typeCount.long || 0,
            typeCount.other || 0
          ],
          backgroundColor: [
            'rgba(255, 159, 64, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 205, 86, 0.6)',
            'rgba(201, 203, 207, 0.6)'
          ],
          borderColor: [
            'rgba(255, 159, 64, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 205, 86, 1)',
            'rgba(201, 203, 207, 1)'
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [validPapers]);

  // Extract topics/concepts from questions for topic coverage
  const topicCoverageData = useMemo(() => {
    // Get all topics from papers
    const topicMap = new Map();
    
    validPapers.forEach(paper => {
      // Check for topics in questions only
      paper.questions.forEach(question => {
        if (question.topic) {
          const topic = question.topic.trim();
          topicMap.set(topic, (topicMap.get(topic) || 0) + 1);
        }
      });
    });
    
    // Convert map to arrays for chart
    const topTopics = Array.from(topicMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // Get top 5 topics
      
    // Store full topic names for tooltips but truncate for display
    const topicLabels = topTopics.map(([topic]) => topic);
    const truncatedLabels = topicLabels.map(topic => truncateText(topic));
    
    return {
      labels: truncatedLabels,
      originalLabels: topicLabels, // Store original labels for tooltip
      datasets: [
        {
          label: 'Question Count',
          data: topTopics.map(([_, count]) => count),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [validPapers]);

  // Options for charts
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y', // This makes the chart horizontal
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Question Count'
        }
      },
      y: {
        ticks: {
          crossAlign: 'far',
        }
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Topic Coverage',
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          // Use the original full label in the tooltip
          title: function(context) {
            const index = context[0].dataIndex;
            return topicCoverageData.originalLabels[index] || context[0].label;
          }
        }
      }
    },
  };

  // If no valid papers with questions
  if (validPapers.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        <p>Create questions to see insights!</p>
      </div>
    );
  }

  return (
    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl p-6 border border-gray-100/50 dark:border-slate-700/30">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text inline-flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Question Paper Insights
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Difficulty Distribution */}
        <div className="bg-gradient-to-br from-white/80 to-purple-50/90 dark:from-slate-700/80 dark:to-slate-800/90 p-5 rounded-xl shadow-sm border border-purple-100/50 dark:border-purple-900/20 transform transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white text-center">
            Difficulty Distribution
          </h4>
          <div className="h-52">
            <Doughnut data={difficultyData} options={doughnutOptions} />
          </div>
        </div>
        
        {/* Question Type Breakdown */}
        <div className="bg-gradient-to-br from-white/80 to-blue-50/90 dark:from-slate-700/80 dark:to-slate-800/90 p-5 rounded-xl shadow-sm border border-blue-100/50 dark:border-blue-900/20 transform transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white text-center">
            Question Type Breakdown
          </h4>
          <div className="h-52">
            <Doughnut data={questionTypeData} options={doughnutOptions} />
          </div>
        </div>
        
        {/* Topic Coverage */}
        <div className="bg-gradient-to-br from-white/80 to-green-50/90 dark:from-slate-700/80 dark:to-slate-800/90 p-5 rounded-xl shadow-sm border border-green-100/50 dark:border-green-900/20 md:col-span-2 transform transition-all duration-300 hover:shadow-md hover:-translate-y-1">
          <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white text-center">
            Topic Coverage
          </h4>
          <div className="h-60">
            <Bar data={topicCoverageData} options={barOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionPaperInsights; 