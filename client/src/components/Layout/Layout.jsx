import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import usePageTransition from "../../hooks/usePageTransition";

const Layout = () => {
  const location = useLocation();
  const isQuestionPapersPage = location.pathname === "/question-papers";
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  
  // Use the custom hook to ensure animations trigger on navigation
  usePageTransition();
  
  const handleSubscribe = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      const response = await fetch("https://formspree.io/f/xblolyok", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        setSubmitStatus("success");
        setEmail("");
      } else {
        setSubmitStatus("error");
      }
    } catch {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-purple-300/20 to-blue-300/10 dark:from-purple-900/20 dark:to-blue-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-t from-blue-300/20 to-purple-300/10 dark:from-blue-900/20 dark:to-purple-900/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBzdHJva2U9IiNkMWQxZDEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgb3BhY2l0eT0iLjAzIj48cGF0aCBkPSJNMzAgMHYzME0wIDMwaDYwIi8+PC9nPjwvc3ZnPg==')] opacity-50 dark:opacity-20"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col flex-grow">
        <Navbar />
        <main className={`pt-16 pb-8 flex-grow ${isQuestionPapersPage ? 'min-h-[calc(100vh-80px)]' : ''}`}>
          <div key={location.key} className="animate-fadeIn">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gradient-to-r from-slate-800 to-slate-900 text-white mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text mb-3">Ignitia</h3>
                <p className="text-slate-300 text-sm">
                  Create, manage, and share question papers effortlessly. Our platform helps teachers and educators generate high-quality question papers with AI assistance.
                </p>
                <div className="mt-4 flex items-center text-xs text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                  </svg>
                  Powered by Groq AI
                </div>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-3">Quick Links</h3>
                <div>
                  <a href="/" className="text-slate-300 hover:text-purple-400 text-sm transition-colors block py-1">Home</a>
                  <a href="/dashboard" className="text-slate-300 hover:text-purple-400 text-sm transition-colors block py-1">Dashboard</a>
                  <a href="/question-papers" className="text-slate-300 hover:text-purple-400 text-sm transition-colors block py-1">Question Papers</a>
                  <a href="/create-paper" className="text-slate-300 hover:text-purple-400 text-sm transition-colors block py-1">Create Paper</a>
                  <a href="/solve-questions" className="text-slate-300 hover:text-purple-400 text-sm transition-colors block py-1">Solve Questions</a>
                </div>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-3">Contact Us</h3>
                <div className="flex items-center space-x-2 mb-2 text-sm text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>support@qpgenerator.com</span>
                </div>
                <div className="flex items-center space-x-2 mb-4 text-sm text-slate-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>+1 (555) 123-4567</span>
                </div>
                
                <div>
                  <div className="text-sm text-slate-300 mb-2">Email to us</div>
                  <form onSubmit={handleSubscribe} className="flex">
                    <input
                      id="subscribe-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email"
                      className="px-3 py-2 text-sm bg-slate-700 border-none rounded-l-md focus:outline-none text-white w-full"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-r-md text-sm"
                    >
                      {isSubmitting ? "..." : "Send"}
                    </button>
                  </form>
                  {submitStatus === "success" && (
                    <p className="text-green-400 text-xs mt-1">Thank you for contacting us!</p>
                  )}
                  {submitStatus === "error" && (
                    <p className="text-red-400 text-xs mt-1">Something went wrong. Please try again.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout; 