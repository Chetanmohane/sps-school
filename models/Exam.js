const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Exam title is required"],
    trim: true
  },
  date: {
    type: Date,
    required: [true, "Exam date is required"]
  },
  className: {
    type: String,
    required: [true, "Class is required"]
  },
  subject: {
    type: String,
    required: [true, "Subject is required"]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Exam", examSchema);
