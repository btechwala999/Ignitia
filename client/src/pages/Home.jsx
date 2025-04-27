import React from 'react';
import { Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const Home = () => {
  // Animation variants
  const cardVariants = {
    hover: {
      y: -10,
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      transition: { duration: 0.3 }
    }
  };

  return (
    <div className="py-12">
      {/* Hero section with background gradient */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-purple-300/20 to-blue-300/10 dark:from-purple-900/30 dark:to-blue-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-t from-blue-300/20 to-purple-300/10 dark:from-blue-900/20 dark:to-purple-900/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
        </div>

        {/* Main hero content */}
        <div className="lg:flex lg:items-center lg:justify-between relative z-10">
          <div className="lg:w-1/2 text-center lg:text-left">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl dark:text-white">
              <span className="block bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text">From Idea to Ink</span>
              <span className="block text-primary-600 dark:text-primary-400">— In Seconds</span>
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-center lg:justify-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              Fueled by the speed and intelligence of Groq AI
            </p>
            <p className="mt-3 max-w-md mx-auto lg:mx-0 text-base text-gray-500 dark:text-gray-300 sm:text-lg md:mt-5 md:text-xl">
              Generate <span className="font-semibold text-purple-600 dark:text-purple-400">high-quality</span> academic questions <span className="font-semibold text-blue-600 dark:text-blue-400">instantly</span> with our AI. Create, manage and solve question papers across various subjects and difficulty levels.
            </p>
            <div className="mt-10 flex justify-center lg:justify-start">
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.98 }}
              >
                <Link to="/register" className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 shadow-lg hover:shadow-primary-600/50 transition-all duration-300 md:py-4 md:text-lg md:px-10">
                  Get Started
                </Link>
              </motion.div>
            </div>
            
            {/* Stats section */}
            <div className="mt-10 py-3 px-5 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-slate-700/50 shadow-sm inline-flex items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                <span>500+ Papers</span>
              </div>
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
                <span>20+ Teachers</span>
              </div>
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>99% Satisfaction</span>
              </div>
            </div>
          </div>
          
          {/* Hero image */}
          <div className="mt-10 lg:mt-0 lg:w-1/2 flex justify-center lg:justify-end">
            <img 
              src="/home_page_main.png" 
              alt="AI Question Paper Generator" 
              className="rounded-2xl w-full max-w-lg relative z-10"
              style={{
                filter: "drop-shadow(0 10px 15px rgba(0, 0, 0, 0.1))",
                transform: "translateZ(0)",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                isolation: "isolate"
              }}
            />
            <div className="absolute top-0 right-0 w-[65%] h-[80%] bg-gradient-to-tr from-purple-400/5 to-blue-300/10 dark:from-purple-800/10 dark:to-blue-700/15 rounded-full blur-3xl -z-0"></div>
          </div>
        </div>

        {/* Key Features Section */}
        <div className="mt-32 relative z-10">
          <h2 className="text-3xl font-extrabold text-center text-gray-900 dark:text-white">
            <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-transparent bg-clip-text">Key Features</span>
          </h2>
          <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <motion.div 
              className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700/50"
              variants={cardVariants}
              whileHover="hover"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <h3 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">
                <span className="text-purple-600 dark:text-purple-400">AI-powered</span> Generation
              </h3>
              <p className="mt-3 text-gray-600 dark:text-gray-300">Generate high-quality questions instantly from topics or syllabus content.</p>
            </motion.div>
            
            <motion.div 
              className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700/50"
              variants={cardVariants}
              whileHover="hover"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">
                <span className="text-blue-600 dark:text-blue-400">Customizable</span> Options
              </h3>
              <p className="mt-3 text-gray-600 dark:text-gray-300">Create MCQs, short and long answers with adjustable difficulty levels.</p>
            </motion.div>
            
            <motion.div 
              className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700/50"
              variants={cardVariants}
              whileHover="hover"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">
                <span className="text-green-600 dark:text-green-400">Export</span> to PDF
              </h3>
              <p className="mt-3 text-gray-600 dark:text-gray-300">Export your question papers in PDF format with or without answers.</p>
            </motion.div>
            
            <motion.div 
              className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700/50"
              variants={cardVariants}
              whileHover="hover"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">
                <span className="text-orange-600 dark:text-orange-400">Analytics</span> & Insights
              </h3>
              <p className="mt-3 text-gray-600 dark:text-gray-300">Track your practice or paper-solving history with detailed AI analytics.</p>
            </motion.div>
          </div>
        </div>
        
        {/* Why Ignitia Section */}
        <div className="mt-28 text-center relative z-10">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-6">
            Why <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-transparent bg-clip-text">Ignitia</span>?
          </h2>
          <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300 text-lg">
            Our AI-powered solution revolutionizes education by making high-quality question paper creation simple, efficient, and accessible to all teachers and educators.
          </p>
          
          {/* Groq AI Footer Note */}
          <div className="mt-16 flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Powered by Groq AI
          </div>
        </div>
      </div>
      
      {/* Decorative Badge (replacing Help Button) */}
      <div className="fixed bottom-8 right-8 z-50">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 1 }}
          className="bg-gradient-to-r from-purple-600 to-blue-600 p-3 rounded-full shadow-lg flex items-center gap-2 text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
          <span className="text-base font-bold">Groq Engine</span>
        </motion.div>
      </div>
    </div>
  );
};

export default Home; 