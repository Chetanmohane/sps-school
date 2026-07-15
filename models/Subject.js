const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Subject name is required"],
    trim: true,
    unique: true
  },
  code: {
    type: String,
    required: [true, "Subject code is required"],
    unique: true,
    uppercase: true
  },
  description: {
    type: String,
    default: ""
  },
  credits: {
    type: Number,
    default: 3
  },
  syllabus: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
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

module.exports = mongoose.model("Subject", subjectSchema);