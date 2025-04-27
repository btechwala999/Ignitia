const QuestionPaper = require('../models/questionPaper.model');
const Analytics = require('../models/analytics.model');
const logger = require('../../../utils/logger');
const { validationResult } = require('express-validator');
const groqService = require('../services/groq.service');
const pdfService = require('../services/pdf.service');

/**
 * Generate questions using AI
 */
exports.generateQuestions = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        message: errors.array()[0].msg, // Return the first error message for clarity
        errors: errors.array(),
      });
    }

    // Log the request body to debug
    console.log('Generate questions request body:', JSON.stringify(req.body, null, 2));

    const { 
      topic, 
      count = 5, 
      difficulty = 'medium', 
      type = 'mcq', 
      bloomsLevel, 
      subject,
      model = 'llama3-70b-8192',
      // Additional parameters
      questionTypes,
      description,
      syllabus,
      totalMarks,
      duration,
      // New parameter for detailed question distribution
      questionDistribution = []
    } = req.body;

    // Validate question distribution before processing
    if (questionDistribution && questionDistribution.length > 0) {
      // Ensure each item has valid fields
      const isValidDistribution = questionDistribution.every(item => {
        return (
          ['mcq', 'short', 'long', 'diagram', 'code', 'hots', 'case_study'].includes(item.type) &&
          ['easy', 'medium', 'hard'].includes(item.difficulty) &&
          Number.isInteger(item.count) && 
          item.count > 0 && 
          item.count <= 25 &&
          Number.isInteger(item.marks) && 
          item.marks > 0
        );
      });

      if (!isValidDistribution) {
        return res.status(400).json({
          status: 'fail',
          message: 'Invalid question distribution. Please check type, difficulty, count and marks values.',
        });
      }
    }

    // Generate questions using the groq service
    try {
      // Calculate total question count from distribution if provided
      const totalCount = questionDistribution && questionDistribution.length > 0
        ? questionDistribution.reduce((sum, item) => sum + item.count, 0)
        : count;
        
      // Extract additional parameters to pass to the service
      const additionalParams = {
        questionTypes: questionTypes || [type],
        description,
        syllabus,
        totalMarks,
        duration,
        questionDistribution
      };

      // Log request parameters for debugging
      console.log('Sending to Groq service:', {
        topic, totalCount, difficulty, type, model,
        additionalParams: JSON.stringify(additionalParams)
      });

      const questions = await groqService.generateQuestions(
        topic,
        totalCount,
        difficulty,
        type,
        bloomsLevel,
        subject,
        model,
        additionalParams
      );

      // Validate MCQ questions to ensure they have exactly 4 options
      const validatedQuestions = questions.map(question => {
        if (question.type === 'mcq' && (!question.options || question.options.length !== 4)) {
          // Ensure MCQ questions have exactly 4 options
          if (!question.options || !Array.isArray(question.options)) {
            question.options = [
              "Option A",
              "Option B", 
              "Option C",
              "Option D"
            ];
          } else if (question.options.length < 4) {
            // Add generic options if fewer than 4
            while (question.options.length < 4) {
              question.options.push(`Option ${String.fromCharCode(65 + question.options.length)}`);
            }
          } else if (question.options.length > 4) {
            // Truncate if more than 4
            question.options = question.options.slice(0, 4);
          }
          
          // Ensure correctAnswer is set and valid
          if (!question.correctAnswer || !question.options.includes(question.correctAnswer)) {
            question.correctAnswer = question.options[0];
          }
        }
        
        return question;
      });

      // Log analytics data
      await Analytics.create({
        user: req.user._id,
        action: 'create_question',
        details: {
          questionsGenerated: validatedQuestions.length,
          difficulty,
          subject,
          model,
          questionDistribution: additionalParams.questionDistribution
        },
      });

      res.status(200).json({
        status: 'success',
        data: {
          questions: validatedQuestions,
        },
      });
    } catch (apiError) {
      logger.error('API Error in generateQuestions:', apiError);
      return res.status(500).json({
        status: 'error',
        message: apiError.message || 'Failed to generate questions with Groq API',
      });
    }
  } catch (error) {
    logger.error('Error generating questions:', error);
    next(error);
  }
};

/**
 * Create a new question paper
 */
exports.createQuestionPaper = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array(),
      });
    }

    // Create question paper
    const questionPaper = await QuestionPaper.create({
      ...req.body,
      createdBy: req.user._id,
    });

    // Update user stats
    await req.user.updateOne({
      $inc: { 'stats.papersCreated': 1 },
    });

    // Log analytics data
    await Analytics.create({
      user: req.user._id,
      action: 'create_question',
      questionPaper: questionPaper._id,
      details: {
        questionsGenerated: questionPaper.questions.length,
        subject: questionPaper.subject,
      },
    });

    res.status(201).json({
      status: 'success',
      data: {
        questionPaper,
      },
    });
  } catch (error) {
    logger.error('Error creating question paper:', error);
    next(error);
  }
};

/**
 * Get all question papers
 */
exports.getQuestionPapers = async (req, res, next) => {
  try {
    // Set up filtering options
    const filter = {};

    // If not admin, only show papers created by the user
    if (req.user.role !== 'admin') {
      filter.createdBy = req.user._id;
    }

    // Apply subject filter if provided
    if (req.query.subject) {
      filter.subject = req.query.subject;
    }

    // Apply title search if provided
    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: 'i' };
    }

    // Set up pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Query papers with filter, sorting, and pagination
    const questionPapers = await QuestionPaper.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title subject createdAt totalMarks questions createdBy')
      .populate('createdBy', 'name');

    // Get total count for pagination
    const total = await QuestionPaper.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      results: questionPapers.length,
      data: {
        questionPapers,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
          limit,
        },
      },
    });
  } catch (error) {
    logger.error('Error getting question papers:', error);
    next(error);
  }
};

/**
 * Get a single question paper
 */
exports.getQuestionPaper = async (req, res, next) => {
  try {
    const questionPaper = await QuestionPaper.findById(req.params.id).populate(
      'createdBy',
      'name'
    );

    if (!questionPaper) {
      return res.status(404).json({
        status: 'fail',
        message: 'Question paper not found',
      });
    }

    // Check if user is authorized (admin, creator, or teacher with permissions)
    if (
      req.user.role !== 'admin' &&
      questionPaper.createdBy._id.toString() !== req.user._id.toString()
    ) {
      // For now allow any teacher to view question papers
      if (req.user.role !== 'teacher') {
        return res.status(403).json({
          status: 'fail',
          message: 'You are not authorized to view this question paper',
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        questionPaper,
      },
    });
  } catch (error) {
    logger.error('Error getting question paper:', error);
    next(error);
  }
};

/**
 * Update a question paper
 */
exports.updateQuestionPaper = async (req, res, next) => {
  try {
    // Find the question paper
    const questionPaper = await QuestionPaper.findById(req.params.id);

    if (!questionPaper) {
      return res.status(404).json({
        status: 'fail',
        message: 'Question paper not found',
      });
    }

    // Check if user is authorized (admin or creator)
    if (
      req.user.role !== 'admin' &&
      questionPaper.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to update this question paper',
      });
    }

    // Update the question paper
    const updatedQuestionPaper = await QuestionPaper.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        questionPaper: updatedQuestionPaper,
      },
    });
  } catch (error) {
    logger.error('Error updating question paper:', error);
    next(error);
  }
};

/**
 * Delete a question paper
 */
exports.deleteQuestionPaper = async (req, res, next) => {
  try {
    // Find the question paper
    const questionPaper = await QuestionPaper.findById(req.params.id);

    if (!questionPaper) {
      return res.status(404).json({
        status: 'fail',
        message: 'Question paper not found',
      });
    }

    // Check if user is authorized (admin or creator)
    if (
      req.user.role !== 'admin' &&
      questionPaper.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to delete this question paper',
      });
    }

    // Delete the question paper
    await QuestionPaper.findByIdAndDelete(req.params.id);

    // Also delete any analytics associated with this paper
    await Analytics.deleteMany({ questionPaper: req.params.id });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    logger.error('Error deleting question paper:', error);
    next(error);
  }
};

/**
 * Export a question paper as PDF
 */
exports.exportQuestionPaper = async (req, res, next) => {
  try {
    // Find the question paper
    const questionPaper = await QuestionPaper.findById(req.params.id);

    if (!questionPaper) {
      return res.status(404).json({
        status: 'fail',
        message: 'Question paper not found',
      });
    }

    // Check if user is authorized (admin, creator, or teacher)
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'teacher' &&
      questionPaper.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to export this question paper',
      });
    }

    // Generate the PDF as buffer
    const pdfBuffer = await pdfService.generatePDF(questionPaper);

    // Log the export action
    await Analytics.create({
      user: req.user._id,
      action: 'export_paper',
      questionPaper: questionPaper._id,
    });

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="question-paper-${questionPaper._id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // Send the PDF buffer directly to the client
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Error exporting question paper:', error);
    next(error);
  }
};

/**
 * Solve a question using AI
 */
exports.solveQuestion = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array(),
      });
    }

    const { question, subject, model = 'llama3-70b-8192' } = req.body;

    // Solve the question using groq service
    try {
      // Use the instance method directly now
      const solution = await groqService.solveQuestion(question, subject, model);

      // Log analytics data
      await Analytics.create({
        user: req.user._id,
        action: 'solve_question',
        details: {
          subject,
          model
        },
      });

      // Update user stats
      await req.user.updateOne({
        $inc: { 'stats.questionsAnswered': 1 },
      });

      res.status(200).json({
        status: 'success',
        data: {
          question,
          solution,
        },
      });
    } catch (apiError) {
      logger.error('API Error in solveQuestion:', apiError);
      return res.status(500).json({
        status: 'error',
        message: apiError.message || 'Failed to solve question with Groq API',
      });
    }
  } catch (error) {
    logger.error('Error solving question:', error);
    next(error);
  }
};

/**
 * Solve multiple questions from a paper
 */
exports.solveQuestionPaper = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'fail',
        errors: errors.array(),
      });
    }

    const { questions, subject, model = 'llama3-70b-8192' } = req.body;

    // Get just the question texts if full objects were provided
    const questionTexts = questions.map(q => typeof q === 'string' ? q : q.text);

    // Solve the questions
    try {
      const solutions = await groqService.solveQuestionPaper(questionTexts, subject, model);

      // Log analytics data
      await Analytics.create({
        user: req.user._id,
        action: 'solve_question',
        details: {
          subject,
          questionsGenerated: questions.length,
          model
        },
      });

      // Update user stats
      await req.user.updateOne({
        $inc: { 'stats.questionsAnswered': questions.length, 'stats.testsTaken': 1 },
      });

      res.status(200).json({
        status: 'success',
        data: {
          solutions: questionTexts.map((question, index) => ({
            question,
            solution: solutions[index],
          })),
        },
      });
    } catch (apiError) {
      logger.error('API Error in solveQuestionPaper:', apiError);
      return res.status(500).json({
        status: 'error',
        message: apiError.message || 'Failed to solve questions with Groq API',
      });
    }
  } catch (error) {
    logger.error('Error solving question paper:', error);
    next(error);
  }
}; 