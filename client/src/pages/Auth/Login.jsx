import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, authLoading, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  
  // Get the redirect path from location state, or default to dashboard
  const from = location.state?.from || '/dashboard';
  
  // If already authenticated, redirect to the appropriate page
  useEffect(() => {
    console.log('Login component: isAuthenticated state changed to:', isAuthenticated);
    if (isAuthenticated) {
      console.log('Login component: User is authenticated, redirecting to:', from);
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 100); // Small delay to ensure state updates are processed
    }
  }, [isAuthenticated, from, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear errors when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    if (loginError) {
      setLoginError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoginSuccess(false);
      const result = await login(formData.email, formData.password);
      
      if (result && result.success) {
        console.log('Login component: Login successful, waiting for auth state update');
        setLoginSuccess(true);
        
        // Force navigation after a delay if isAuthenticated doesn't trigger it
        setTimeout(() => {
          console.log('Login component: Forcing navigation to:', from);
          navigate(from, { replace: true });
        }, 1500); 
      }
    } catch (error) {
      console.error('Login error in component:', error);
      setLoginError(
        error.response?.data?.message || 'Login failed. Please check your credentials and try again.'
      );
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col justify-center items-center">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-b from-purple-300/20 to-blue-300/10 dark:from-purple-900/20 dark:to-blue-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-t from-blue-300/20 to-purple-300/10 dark:from-blue-900/20 dark:to-purple-900/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBzdHJva2U9IiNkMWQxZDEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgb3BhY2l0eT0iLjAzIj48cGF0aCBkPSJNMzAgMHYzME0wIDMwaDYwIi8+PC9nPjwvc3ZnPg==')] opacity-50 dark:opacity-20"></div>
      </div>

      {/* Project title at top left */}
      <div className="absolute top-0 left-0 w-full z-10 bg-transparent">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="py-4">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-extrabold bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-600 text-transparent bg-clip-text font-display tracking-tight">
            Ignitia
          </span>
        </Link>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md px-6 z-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Sign in to your account
          </h1>
          {from !== '/dashboard' && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              You need to sign in to access this page
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl p-8">
          {loginError && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg shadow-md">
              {loginError}
            </div>
          )}
          
          {loginSuccess && (
            <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg shadow-md">
              Login successful! Redirecting...
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`block w-full rounded-lg border-0 py-2 px-3.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 dark:bg-gray-800 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 ${
                    errors.email ? 'ring-red-500 dark:ring-red-500' : ''
                  }`}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                  Password
                </label>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full rounded-lg border-0 py-2 px-3.5 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 dark:bg-gray-800 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 ${
                    errors.password ? 'ring-red-500 dark:ring-red-500' : ''
                  }`}
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={authLoading || loginSuccess}
                className="flex w-full justify-center rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-3.5 py-2 text-sm font-semibold leading-6 text-white shadow-md hover:from-purple-700 hover:to-blue-700 hover:shadow-lg transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-70"
              >
                {authLoading ? 'Signing in...' : loginSuccess ? 'Success!' : 'Sign in'}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Not a member?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 