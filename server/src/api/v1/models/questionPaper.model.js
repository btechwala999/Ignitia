const mongoose = require('mongoose');
const { Schema } = mongoose;

// Question Schema
const questionSchema = new Schema({
  text: {
    type: String,
    required: [true, 'Question text is required'],
  },
  type: {
    type: String,
    enum: ['mcq', 'short', 'long', 'diagram', 'code', 'hots', 'case_study'],
    required: [true, 'Question type is required'],
  },
  options: {
    type: [String],
    validate: {
      validator: function(options) {
        return this.type !== 'mcq' || (options && options.length >= 2);
      },
      message: 'MCQ questions must have at least 2 options',
    },
  },
  correctAnswer: {
    type: String,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: [true, 'Difficulty level is required'],
  },
  marks: {
    type: Number,
    required: [true, 'Marks are required'],
    min: [1, 'Marks must be at least 1'],
  },
  bloomsTaxonomy: {
    type: String,
    enum: ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'],
  },
  explanation: {
    type: String,
  },
  topic: {
    type: String,
    required: [true, 'Topic is required'],
  },
});

// Question Paper Schema
const questionPaperSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    description: {
      type: String,
    },
    totalMarks: {
      type: Number,
      required: [true, 'Total marks are required'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
    },
    questions: [questionSchema],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
    syllabus: {
      type: [String],
    },
    educationBoard: {
      type: String,
    },
    class: {
      type: String,
    },
    educationalLevel: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Add validation to ensure the total marks match the sum of question marks
questionPaperSchema.pre('save', function(next) {
  const totalQuestionMarks = this.questions.reduce(
    (sum, question) => sum + question.marks,
    0
  );
  
  if (totalQuestionMarks !== this.totalMarks) {
    this.totalMarks = totalQuestionMarks;
  }
  
  next();
});

// Check if the model already exists before creating a new one
const QuestionPaper = mongoose.models.QuestionPaper || mongoose.model('QuestionPaper', questionPaperSchema);

module.exports = QuestionPaper; 