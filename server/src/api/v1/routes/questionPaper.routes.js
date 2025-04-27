const express = require('express');
const { body } = require('express-validator');
const questionPaperController = require('../controllers/questionPaper.controller');
const { protect, restrictTo } = require('../middlewares/auth');

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Generate questions using AI
router.post(
  '/generate',
  [
    body('topic').notEmpty().withMessage('Topic is required'),
    body('count').optional().isInt({ min: 1, max: 50 }).withMessage('Count must be between 1 and 50'),
    body('difficulty')
      .optional()
      .isIn(['easy', 'medium', 'hard'])
      .withMessage('Difficulty must be easy, medium, or hard'),
    body('type')
      .optional()
      .isIn(['mcq', 'short', 'long', 'diagram', 'code', 'hots', 'case_study'])
      .withMessage('Type must be valid'),
    body('questionTypes')
      .optional()
      .isArray()
      .withMessage('Question types must be an array'),
    body('questionTypes.*')
      .optional()
      .isIn(['mcq', 'short', 'long', 'diagram', 'code', 'hots', 'case_study'])
      .withMessage('Each question type must be valid'),
    body('questionDistribution')
      .optional()
      .isArray()
      .withMessage('Question distribution must be an array'),
    body('questionDistribution.*.type')
      .optional()
      .isIn(['mcq', 'short', 'long', 'diagram', 'code', 'hots', 'case_study'])
      .withMessage('Question type must be valid'),
    body('questionDistribution.*.count')
      .optional()
      .isInt({ min: 1, max: 25 })
      .withMessage('Question count must be between 1 and 25'),
    body('questionDistribution.*.difficulty')
      .optional()
      .isIn(['easy', 'medium', 'hard'])
      .withMessage('Question difficulty must be valid'),
    body('model')
      .optional()
      .isIn(['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'])
      .withMessage('Model must be a valid Groq model'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('syllabus').optional().isString().withMessage('Syllabus must be a string'),
    body('totalMarks').optional().isInt({ min: 1 }).withMessage('Total marks must be a positive number'),
    body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive number'),
    body('educationalLevel').optional().isString().withMessage('Educational level must be a string')
  ],
  questionPaperController.generateQuestions
);

// Create a new question paper (teachers and admins only)
router.post(
  '/',
  restrictTo('admin', 'teacher'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
    body('questions').isArray({ min: 1 }).withMessage('At least one question is required'),
    body('totalMarks').isInt({ min: 1 }).withMessage('Total marks must be a positive integer'),
    body('educationalLevel').optional().isString().withMessage('Educational level must be a string')
  ],
  questionPaperController.createQuestionPaper
);

// Get all question papers
router.get('/', questionPaperController.getQuestionPapers);

// Get a single question paper
router.get('/:id', questionPaperController.getQuestionPaper);

// Update a question paper (teachers and admins only)
router.patch(
  '/:id',
  restrictTo('admin', 'teacher'),
  questionPaperController.updateQuestionPaper
);

// Delete a question paper (teachers and admins only)
router.delete(
  '/:id',
  restrictTo('admin', 'teacher'),
  questionPaperController.deleteQuestionPaper
);

// Export a question paper as PDF
router.get('/:id/export', questionPaperController.exportQuestionPaper);

// Solve a question using AI
router.post(
  '/solve',
  [
    body('question').notEmpty().withMessage('Question is required'),
    body('subject').optional().isString().withMessage('Subject must be a string'),
    body('model')
      .optional()
      .isIn(['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'])
      .withMessage('Model must be a valid Groq model'),
  ],
  questionPaperController.solveQuestion
);

// Solve multiple questions or a full paper
router.post(
  '/solve-paper',
  [
    body('questions').isArray({ min: 1 }).withMessage('At least one question is required'),
    body('subject').optional().isString().withMessage('Subject must be a string'),
    body('model')
      .optional()
      .isIn(['llama3-70b-8192', 'llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'])
      .withMessage('Model must be a valid Groq model'),
  ],
  questionPaperController.solveQuestionPaper
);

module.exports = router; 