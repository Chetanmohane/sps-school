const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  qualifications: {
    type: String,
    default: ""
  },
  experience: {
    type: Number,
    default: 0
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject"
  }],
  classes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Class"
  }],
  department: {
    type: String,
    default: ""
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ["active", "inactive", "on-leave"],
    default: "active"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Teacher", teacherSchema);