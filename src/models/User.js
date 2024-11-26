const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Define the User schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  resetToken: {
    type: String
  },
  resetTokenExpiry: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  last_login: {
    type: Date
  }
});

// Pre-save middleware to hash the password before saving
userSchema.pre('save', async function(next) {
  const user = this;
  console.log('Pre-save middleware triggered');
  console.log('Password modified:', user.isModified('password'));
  
  if (user.isModified('password')) {
    console.log('Hashing password...');
    user.password = await bcrypt.hash(user.password, 8);
    console.log('Password hashed successfully');
  }
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  const user = this;
  return bcrypt.compare(candidatePassword, user.password);
};

// Method to generate an authentication token
userSchema.methods.generateAuthToken = function() {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });
  return token;
};

// toJSON method to exclude password from responses
userSchema.methods.toJSON = function() {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  return userObject;
};

// Create the User model
const User = mongoose.model('User', userSchema);

module.exports = User;
