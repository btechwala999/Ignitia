import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import AnimatedPage from '../../components/AnimatedPage';

// Define the validation schema using Zod
const questionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  syllabus: z.string().optional(),
  topic: z.string().min(1, 'Topic is required'),
  questionDistribution: z.array(
    z.object({
      type: z.enum(['mcq', 'short', 'long', 'diagram', 'code', 'hots', 'case_study']),
      count: z.number().min(0, 'Count must be positive'),
      difficulty: z.enum(['easy', 'medium', 'hard']),
      marks: z.number().min(1, 'Marks must be at least 1')
    })
  ).nonempty('At least one question type must be selected'),
  bloomsLevel: z.enum(['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']).optional(),
  model: z.string().optional(),
  educationalLevel: z.string().optional(),
});

// Add model options
const modelOptions = [
  { label: 'LLaMA 3 70B (Best Quality)', value: 'llama3-70b-8192' },
  { label: 'LLaMA 3 8B (Faster)', value: 'llama3-8b-8192' },
  { label: 'Mixtral 8x7B (Long Context)', value: 'mixtral-8x7b-32768' },
  { label: 'Gemma 7B (Balanced)', value: 'gemma-7b-it' }
];

// Question type options
const questionTypeOptions = [
  { value: 'mcq', label: 'Multiple Choice' },
  { value: 'short', label: 'Short Answer' },
  { value: 'long', label: 'Long Answer' },
  { value: 'diagram', label: 'Diagram Based' },
  { value: 'code', label: 'Coding' },
  { value: 'hots', label: 'Higher Order Thinking (HOTS)' },
  { value: 'case_study', label: 'Case Study' }
];

// Difficulty options
const difficultyOptions = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' }
];

// Default marks for each question type
const defaultMarksMap = {
  'mcq': 1,
  'short': 3,
  'long': 5,
  'diagram': 4,
  'code': 5,
  'hots': 8,
  'case_study': 10
};

const CreatePaper = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, refreshAuthHeaders } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    duration: 120,
    syllabus: '',
    topic: '',
    questionDistribution: [
      { type: 'mcq', count: 10, difficulty: 'easy', marks: 1 },
      { type: 'short', count: 5, difficulty: 'medium', marks: 3 },
      { type: 'long', count: 2, difficulty: 'hard', marks: 5 }
    ],
    bloomsLevel: 'understand',
    model: 'llama3-70b-8192',
    educationalLevel: ''
  });
  
  const [step, setStep] = useState(1);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [error, setError] = useState('');

  // Initial distribution
  const [questionTypes, setQuestionTypes] = useState([
    { type: 'mcq', count: 10, difficulty: 'easy', marks: 1 },
    { type: 'short', count: 5, difficulty: 'medium', marks: 3 },
    { type: 'long', count: 2, difficulty: 'hard', marks: 5 }
  ]);

  // Add a new question type to the distribution
  const addQuestionType = () => {
    setQuestionTypes([
      ...questionTypes,
      { type: 'mcq', count: 1, difficulty: 'medium', marks: defaultMarksMap['mcq'] }
    ]);
  };

  // Remove a question type from the distribution
  const removeQuestionType = (index) => {
    setQuestionTypes(questionTypes.filter((_, i) => i !== index));
  };

  // Update a question type in the distribution
  const updateQuestionType = (index, field, value) => {
    const updatedTypes = [...questionTypes];
    updatedTypes[index][field] = value;
    
    // If type changes, update the marks to default for that type
    if (field === 'type') {
      updatedTypes[index].marks = defaultMarksMap[value] || 1;
    }
    
    setQuestionTypes(updatedTypes);
  };

  // Calculate total question count
  const totalQuestionCount = questionTypes.reduce((sum, item) => sum + item.count, 0);
  
  // Calculate total marks
  const totalMarks = questionTypes.reduce((sum, item) => sum + (item.count * item.marks), 0);

  const { register, handleSubmit, control, watch, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      title: '',
      subject: '',
      description: '',
      duration: 120,
      syllabus: '',
      topic: '',
      questionDistribution: [
        { type: 'mcq', count: 10, difficulty: 'easy', marks: 1 },
        { type: 'short', count: 5, difficulty: 'medium', marks: 3 },
        { type: 'long', count: 2, difficulty: 'hard', marks: 5 }
      ],
      bloomsLevel: 'understand',
      model: 'llama3-70b-8192',
      educationalLevel: ''
    }
  });
  
  // Log auth state on component mount
  useEffect(() => {
    console.log('Auth state in CreatePaper:', { 
      isAuthenticated, 
      user, 
      token: localStorage.getItem('token') ? 'Present' : 'Not found' 
    });
    
    // Refresh auth headers when component mounts
    const headersSet = refreshAuthHeaders();
    console.log('Headers refreshed on mount:', headersSet);
  }, [isAuthenticated, user, refreshAuthHeaders]);
  
  // Update form when question types change
  useEffect(() => {
    setValue('questionDistribution', questionTypes);
  }, [questionTypes, setValue]);
  
  const onSubmit = async (data) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      setError('Please login to generate questions');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      console.log('Submitting data:', data);
      
      // Calculate total count and marks
      const totalCount = data.questionDistribution.reduce((sum, item) => sum + item.count, 0);
      const calculatedTotalMarks = data.questionDistribution.reduce(
        (sum, item) => sum + (item.count * item.marks), 0
      );
      
      // Create payload from question distribution
      const payload = {
        topic: data.topic,
        subject: data.subject,
        count: totalCount,
        questionDistribution: data.questionDistribution,
        bloomsLevel: data.bloomsLevel,
        model: data.model || 'llama3-70b-8192',
        // Additional parameters for better question generation
        description: data.description,
        syllabus: data.syllabus,
        totalMarks: calculatedTotalMarks, // Use calculated total marks
        duration: data.duration,
        educationalLevel: data.educationalLevel
      };
      
      // Get the current token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Create a temporary direct axios instance
      const apiCall = api.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Make the API call directly to troubleshoot
      console.log('Making API call with payload:', payload);
      console.log('Using token:', token.substring(0, 15) + '...');
      
      // First generate the questions
      const response = await apiCall.post('/api/v1/question-papers/generate', payload);
      
      if (response.data && response.data.data && response.data.data.questions) {
        setGeneratedQuestions(response.data.data.questions);
        setLoading(false);
        
        // Move to step 2 after successfully generating questions
        setStep(2);
        
        // Return the response for chaining
        return response;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      
      // Handle unauthorized errors specifically
      if (error.response && error.response.status === 401) {
        setError('Authentication failed. Please login again to generate questions.');
        // Force a re-login by clearing credentials
        localStorage.removeItem('token');
        setTimeout(() => {
          navigate('/login', { state: { from: location.pathname } });
        }, 2000);
      } else {
        setError(`Failed to generate questions: ${error.message || 'Unknown error'}`);
      }
      
      setLoading(false);
      throw error; // Re-throw for proper error handling in the chain
    }
  };

  // For the form in step 1, we'll use a local submit handler that doesn't actually submit to the API
  const handleNextStep = (data) => {
    // Save the form data
    setFormData((prev) => ({
      ...prev,
      title: data.title,
      subject: data.subject,
      description: data.description || '',
      duration: data.duration,
      syllabus: data.syllabus || '',
      topic: data.topic,
      questionDistribution: data.questionDistribution,
      bloomsLevel: data.bloomsLevel,
      model: data.model || 'llama3-70b-8192',
      educationalLevel: data.educationalLevel || ''
    }));
    
    // Move to step 2
    setStep(2);
  };

  const saveQuestionPaper = async () => {
    if (!isAuthenticated) {
      setError('Please login to save the question paper');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Format the data for saving
      const questionPaperData = {
        title: formData.title,
        subject: formData.subject,
        duration: formData.duration,
        description: formData.description || '',
        syllabus: formData.syllabus ? formData.syllabus.split(',').map(item => item.trim()) : [],
        educationalLevel: formData.educationalLevel || '',
        totalMarks: generatedQuestions.reduce((sum, q) => sum + q.marks, 0),
        questions: generatedQuestions,
      };
      
      console.log('Saving question paper:', questionPaperData);
      
      // Create the question paper with the correct API path
      const response = await api.post('/api/v1/question-papers', questionPaperData);
      
      console.log('Question paper saved:', response.data);
      
      // Navigate to the question papers list
      navigate('/question-papers');
    } catch (err) {
      console.error('Error saving question paper:', err);
      setError('Failed to save question paper. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Ensure numeric values are properly converted
    if (name === 'duration') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? '' : Number(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Generate AI questions
  const generateQuestions = async () => {
    // Validate authentication and topic
    if (!isAuthenticated) {
      setError('Please login to generate questions');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    
    if (!formData.topic) {
      setError('Please enter a topic for the questions');
      return;
    }
    
    try {
      setGeneratingQuestions(true);
      setError('');
      
      // Ensure auth headers are set properly
      refreshAuthHeaders();
      
      // Validate and sanitize question distribution
      const validatedQuestionDistribution = questionTypes.map(item => {
        // Ensure all values are valid
        return {
          type: item.type || 'mcq',
          count: parseInt(item.count) || 1,
          difficulty: ['easy', 'medium', 'hard'].includes(item.difficulty) ? item.difficulty : 'medium',
          marks: parseInt(item.marks) || 1
        };
      });
      
      // Prepare the data for the API
      const requestData = {
        topic: formData.topic,
        subject: formData.subject || "General",
        difficulty: 'medium', // Default difficulty
        questionDistribution: validatedQuestionDistribution,
        description: formData.description || "",
        syllabus: formData.syllabus || "",
        educationalLevel: formData.educationalLevel || "",
        model: formData.model || 'llama3-70b-8192',
        bloomsLevel: formData.bloomsLevel || 'understand',
        totalMarks: totalMarks || 100,
        duration: parseInt(formData.duration) || 120
      };
      
      console.log('Generating questions with data:', requestData);
      
      // Get the current token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Make the API call with explicit headers to ensure authentication
      const response = await api.post('/api/v1/question-papers/generate', requestData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Generated questions response:', response);
      
      if (response.data && response.data.data && response.data.data.questions) {
        setGeneratedQuestions(response.data.data.questions);
        setStep(3);
      } else {
        setError('Failed to generate questions. Please try again.');
      }
    } catch (err) {
      console.error('Error generating questions:', err);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      
      // For debugging - log the request data
      console.log('Request data that caused error:', {
        topic: formData.topic,
        subject: formData.subject,
        questionDistribution: validatedQuestionDistribution
      });
      
      // Handle validation errors specifically
      if (err.response?.status === 400 && err.response?.data?.errors) {
        const validationErrors = err.response.data.errors;
        console.log('Validation errors:', validationErrors);
        const errorMessages = validationErrors.map(err => `${err.param}: ${err.msg}`).join(', ');
        setError(`Validation error: ${errorMessages}`);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to generate questions. Please check your parameters and try again.');
      }
    } finally {
      setGeneratingQuestions(false);
    }
  };
  
  // JSX for question distribution section
  const questionDistributionSection = (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Question Distribution
      </label>
      <div className="mb-2 flex justify-between items-center">
        <div className="flex gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total questions: {totalQuestionCount}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Total marks: {totalMarks}
          </p>
        </div>
        <button
          type="button"
          onClick={addQuestionType}
          className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition"
        >
          + Add Question Type
        </button>
      </div>
      
      <div className="space-y-4">
        {questionTypes.map((item, index) => (
          <div key={index} className="p-3 border border-gray-300 dark:border-gray-700 rounded-md">
            <div className="flex justify-between mb-2">
              <h4 className="font-medium text-gray-700 dark:text-gray-300">Question Type {index + 1}</h4>
              <button
                type="button"
                onClick={() => removeQuestionType(index)}
                className="text-red-600 hover:text-red-800 text-sm"
                disabled={questionTypes.length <= 1}
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                  Type
                </label>
                <select
                  value={item.type}
                  onChange={(e) => updateQuestionType(index, 'type', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-sm"
                >
                  {questionTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                  Count
                </label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={item.count}
                  onChange={(e) => updateQuestionType(index, 'count', parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                  Difficulty
                </label>
                <select
                  value={item.difficulty}
                  onChange={(e) => updateQuestionType(index, 'difficulty', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-sm"
                >
                  {difficultyOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                  Marks per Question
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={item.marks}
                  onChange={(e) => updateQuestionType(index, 'marks', parseInt(e.target.value) || 1)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {errors.questionDistribution && (
        <p className="text-red-500 text-sm mt-1">{errors.questionDistribution.message}</p>
      )}
    </div>
  );
  
  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Question Paper</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          {step === 1 ? 'Enter paper details' : 'Generate and customize questions'}
        </p>
      </div>
      
      {/* Steps */}
      <div className="mb-8">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
            1
          </div>
          <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
            2
          </div>
          <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
            3
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {loading && (
        <div className="flex justify-center items-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          <span className="ml-3">Loading...</span>
        </div>
      )}
      
      {step === 1 && !loading && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          {!isAuthenticated && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
              Please login to create a question paper. <Link to="/login" className="underline">Login here</Link>
            </div>
          )}
          <form onSubmit={handleSubmit(handleNextStep)}>
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Paper Title *
              </label>
              <input
                id="title"
                {...register('title')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g. Mathematics Mid-Term Exam"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
            </div>
            
            <div className="mb-6">
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject *
              </label>
              <input
                id="subject"
                {...register('subject')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g. Mathematics"
              />
              {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>}
            </div>
            
            <div className="mb-6">
              <label htmlFor="educationalLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Educational Level
              </label>
              <input
                id="educationalLevel"
                {...register('educationalLevel')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g. University, High School, Class 10, etc."
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Specify the target educational level for these questions
              </p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Topic *
              </label>
              <input
                id="topic"
                {...register('topic')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="e.g. Algebra, Calculus, etc."
              />
              {errors.topic && <p className="text-red-500 text-sm mt-1">{errors.topic.message}</p>}
            </div>
            
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter a description of the question paper"
              ></textarea>
            </div>
            
            <div className="mb-6">
              <label htmlFor="syllabus" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Syllabus (optional)
              </label>
              <textarea
                id="syllabus"
                {...register('syllabus')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter syllabus details (e.g. Unit-1: Introduction to Software Engineering, Unit-2: Software Requirements, etc.)"
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  id="duration"
                  {...register('duration', { 
                    valueAsNumber: true,
                    setValueAs: v => v === '' ? '' : Number(v)
                  })}
                  min={10}
                  max={300}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                />
                {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration.message}</p>}
              </div>
            </div>
            
            {questionDistributionSection}
            
            <div className="mb-4">
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                AI Model
              </label>
              <select
                id="model"
                {...register('model')}
                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              >
                {modelOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Select the AI model to use for generation. Different models have different capabilities and speeds.
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition"
              >
                Next: Generate Questions
              </button>
            </div>
          </form>
        </div>
      )}
      
      {step === 2 && !loading && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Question Generation Settings</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Click the button below to automatically generate questions for your paper based on the settings you provided.
            </p>
            <button
              onClick={generateQuestions}
              disabled={generatingQuestions}
              className={`px-4 py-2 ${generatingQuestions ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-700'} text-white rounded transition`}
            >
              {generatingQuestions ? 'Generating...' : 'Generate Questions'}
            </button>
          </div>
          
          {generatedQuestions.length > 0 && (
            <>
              <div className="mt-8 mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Generated Questions</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Edit or remove questions as needed. You can also add your own questions.
                </p>
              </div>
              
              <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                {generatedQuestions.map((question, index) => (
                  <div key={index} className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-start">
                      <div className="mr-3 text-gray-500 dark:text-gray-400">{index + 1}.</div>
                      <div className="flex-1">
                        <p className="text-gray-900 dark:text-white">{question.text}</p>
                        <div className="mt-2 flex flex-wrap gap-3 text-sm">
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                            {question.type}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                            {question.marks} marks
                          </span>
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                            {question.difficulty}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                            {question.topic}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Back to Details
                </button>
                <button
                  onClick={saveQuestionPaper}
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition"
                >
                  Save Question Paper
                </button>
              </div>
            </>
          )}
        </div>
      )}
      
      {step === 3 && !loading && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Generated Questions</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Review and save your question paper with {generatedQuestions.length} questions.
            </p>
          </div>
          
          {generatedQuestions.length > 0 && (
            <>
              <div className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden mb-6">
                {generatedQuestions.map((question, index) => (
                  <div key={index} className="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-start">
                      <div className="mr-3 text-gray-500 dark:text-gray-400">{index + 1}.</div>
                      <div className="flex-1">
                        <p className="text-gray-900 dark:text-white">{question.text}</p>
                        {question.type === 'mcq' && question.options && (
                          <div className="mt-2 space-y-2">
                            {question.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-start">
                                <span className="mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                                <span>{option}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap gap-3 text-sm">
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                            {question.type}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                            {question.marks} marks
                          </span>
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                            {question.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Back
                </button>
                <button
                  onClick={saveQuestionPaper}
                  className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition"
                >
                  Save Question Paper
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
    </AnimatedPage>
  );
};

export default CreatePaper; 