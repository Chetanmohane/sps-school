const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
  className: {
    type: String,
    required: [true, "Class name is required"],
    trim: true
  },
  section: {
    type: String,
    required: [true, "Section is required"],
    enum: ["A", "B", "C", "D", "E"],
    default: "A"
  },
  academicYear: {
    type: String,
    required: [true, "Academic year is required"]
  },
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
    default: null
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject"
  }],
   startTime: {
    type: String,
    required: [true, "Start time is required"],
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  endTime: {
    type: String,
    required: [true, "End time is required"],
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  room: {
    type: String,
    default: ""
  },
  capacity: {
    type: Number,
    required: true,
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

// Compound index to ensure unique class-section combination per academic year
classSchema.index({ className: 1, section: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model("Class", classSchema);