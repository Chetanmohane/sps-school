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
  startTime: {
    type: String,
    default: "10:00 AM"
  },
  endTime: {
    type: String,
    default: "01:00 PM"
  },
  roomNumber: {
    type: String,
    default: "Hall-1"
  },
  maxMarks: {
    type: Number,
    default: 100
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

