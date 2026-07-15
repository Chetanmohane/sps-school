const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Assignment",
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  marks: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ["Submitted", "Graded", "Late", "Pending"],
    default: "Pending"
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
}, { timestamps: true });

module.exports = mongoose.model("Submission", submissionSchema);