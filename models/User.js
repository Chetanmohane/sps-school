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
    minlength: [6, 'Password must be at least 6 characters long']
  },
  visiblePassword: {
    type: String,
    default: ""
  },
  phone: { 
    type: String,
    required: [true, "Phone number is required"],
    validate: {
      validator: function(v) {
        if (!v) return false;
        return /^\+?\d{10,13}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  role: {
    type: String,
    required: [true, "Role is required"],
    lowercase: true,
    enum: {
      values: [
        'student',
        'teacher',
        'class-teacher',
        'subject-teacher',
        'student-admin',
        'finance-admin',
        'super-admin',
        'academic-admin',
        'teacher-admin',
        'operations-admin',
        'manager-admin'
      ],
      message: '{VALUE} is not a supported role' // Better error message for your console
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    default: "Super Admin"
  },
  updatedBy: {
    type: String,
    default: "Super Admin"
  },
  remarks: {
    type: String,
    default: ""
  }
});

module.exports = mongoose.model("User", userSchema);