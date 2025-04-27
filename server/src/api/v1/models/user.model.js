const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  active: {
    type: Boolean,
    default: true,
  },
  stats: {
    papersCreated: { type: Number, default: 0 },
    questionsAnswered: { type: Number, default: 0 },
    testsTaken: { type: Number, default: 0 },
  },
});

// Update the updatedAt timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to compare passwords (plain text comparison)
userSchema.methods.comparePassword = function(candidatePassword) {
  return this.password === candidatePassword;
};

// Check if the model already exists before creating a new one
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;