import axios from 'axios';

// Create axios instance with clear baseURL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set the auth token if available on startup
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  console.log('API: Auth token initialized from localStorage');
}

// Add request interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log the final request URL for debugging
    console.log(`API Request: ${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    console.log('Request headers:', config.headers);
    
    return config;
  },
  (error) => {
    console.error('API request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log(`API Response for ${response.config.url}: Status ${response.status}`);
    
    // Log detailed response data for debugging
    if (response.config.url.includes('question-papers')) {
      console.log('Question Papers API Response Data Structure:', {
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        questionPapersExists: response.data && !!response.data.questionPapers,
        questionPapersType: response.data && response.data.questionPapers ? 
          Array.isArray(response.data.questionPapers) ? 'array' : typeof response.data.questionPapers : 'undefined',
        questionPapersLength: response.data && Array.isArray(response.data.questionPapers) ? 
          response.data.questionPapers.length : 'not an array',
        firstPaper: response.data && Array.isArray(response.data.questionPapers) && response.data.questionPapers.length > 0 ?
          { id: response.data.questionPapers[0]._id, title: response.data.questionPapers[0].title } : 'no papers'
      });
    }
    
    return response;
  },
  (error) => {
    // Handle token expiration or invalid token
    if (error.response && error.response.status === 401) {
      console.log('API: Unauthorized response received, clearing token');
      localStorage.removeItem('token');
      
      // Don't redirect or reload - let the auth context handle this
      // Authentication state will be updated by the auth context
    }
    
    // Enhanced error logging
    console.error('API error:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data
    });
    
    return Promise.reject(error);
  }
);

// Export a function to update auth token
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('API: Auth token set from external source');
  } else {
    delete api.defaults.headers.common['Authorization'];
    console.log('API: Auth token removed');
  }
};

export default api; 