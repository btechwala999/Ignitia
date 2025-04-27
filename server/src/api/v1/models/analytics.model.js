const mongoose = require('mongoose');
const { Schema } = mongoose;

const analyticsSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  action: {
    type: String,
    enum: ['create_question', 'solve_question', 'export_paper', 'upload_paper', 'login', 'register'],
    required: [true, 'Action is required'],
  },
  questionPaper: {
    type: Schema.Types.ObjectId,
    ref: 'QuestionPaper',
  },
  details: {
    questionsGenerated: Number,
    difficulty: String,
    subject: String,
    solveTime: Number,
    accuracy: Number,
    paperType: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Index for quick queries on user and action
analyticsSchema.index({ user: 1, action: 1 });
analyticsSchema.index({ timestamp: -1 });

// Check if the model already exists before creating a new one
const Analytics = mongoose.models.Analytics || mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics; 