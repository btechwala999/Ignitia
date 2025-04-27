import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import pages
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard';
import QuestionPapers from './pages/QuestionPapers/QuestionPapers';
import QuestionPaperDetail from './pages/QuestionPapers/QuestionPaperDetail';
import CreatePaper from './pages/QuestionPapers/CreatePaper';
import SolveQuestions from './pages/Solve/SolveQuestions';
import Profile from './pages/Profile';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';

// Import components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';

// Create a query client
const queryClient = new QueryClient();

// Animated routes wrapper
const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <Routes location={location} key={location.pathname}>
      {/* Auth routes outside Layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
              <Route element={<Layout />}>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Protected routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/question-papers" 
                  element={
                    <ProtectedRoute>
                      <QuestionPapers />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/question-papers/:id" 
                  element={
                    <ProtectedRoute>
                      <QuestionPaperDetail />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/create-paper" 
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                      <CreatePaper />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/solve-questions" 
          element={
            <ProtectedRoute>
              <SolveQuestions />
            </ProtectedRoute>
          } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />

                {/* Catch all route */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <AnimatedRoutes />
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App; 