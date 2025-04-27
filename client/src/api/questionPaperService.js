import axios from 'axios';

const questionPaperService = {
  // Generate questions using AI
  generateQuestions: async (params) => {
    try {
      const response = await axios.post('/api/v1/question-papers/generate', params);
      return response.data.data;
    } catch (error) {
      console.error('Error generating questions:', error);
      throw error;
    }
  },

  // Create a new question paper
  createQuestionPaper: async (params) => {
    try {
      const response = await axios.post('/api/v1/question-papers', params);
      return response.data.data;
    } catch (error) {
      console.error('Error creating question paper:', error);
      throw error;
    }
  },

  // Get all question papers
  getQuestionPapers: async () => {
    try {
      const response = await axios.get('/api/v1/question-papers');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching question papers:', error);
      throw error;
    }
  },

  // Get a single question paper
  getQuestionPaper: async (id) => {
    try {
      const response = await axios.get(`/api/v1/question-papers/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching question paper:', error);
      throw error;
    }
  },

  // Update a question paper
  updateQuestionPaper: async (id, params) => {
    try {
      const response = await axios.patch(`/api/v1/question-papers/${id}`, params);
      return response.data.data;
    } catch (error) {
      console.error('Error updating question paper:', error);
      throw error;
    }
  },

  // Delete a question paper
  deleteQuestionPaper: async (id) => {
    try {
      const response = await axios.delete(`/api/v1/question-papers/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting question paper:', error);
      throw error;
    }
  },

  // Get question paper export URL
  getExportUrl: (id) => {
    return `/api/v1/question-papers/${id}/export`;
  },

  // Solve a question using AI
  solveQuestion: async (params) => {
    try {
      const response = await axios.post('/api/v1/question-papers/solve', params);
      return response.data.data;
    } catch (error) {
      console.error('Error solving question:', error);
      throw error;
    }
  },

  // Solve multiple questions
  solveQuestions: async (questions, subject) => {
    try {
      const response = await axios.post('/api/v1/question-papers/solve-paper', {
        questions,
        subject,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error solving questions:', error);
      throw error;
    }
  },
};

export default questionPaperService; 