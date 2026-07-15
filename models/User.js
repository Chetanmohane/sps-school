const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, 'Password must be at least 8 characters long'],
    validate: {
    validator: function(value) {
      // Regex: 1 Uppercase, 1 Lowercase, 1 Number, 1 Special Char
      return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(value);
    },
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
  }
  },
  phone: { 
    type: String,
    required: [true, "Phone number is required"],
    validate: {
    validator: function(v) {
      // Check if starts with +91 and has 10 digits after that
      return /^\+91\d{10}$/.test(v);
    },
    message: props => `${props.value} is not a valid Indian phone number! Format: +91XXXXXXXXXX`
  }
  },
  role: {
    type: String,
    required: [true, "Role is required"],
    lowercase: true,
    enum: {
      values: ['student', 'teacher', 'finance-admin', 'super-admin', 'academic-admin', 'student-admin', 'operations-admin'],
      message: '{VALUE} is not a supported role' // Better error message for your console
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("User", userSchema);