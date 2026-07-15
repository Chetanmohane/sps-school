const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  type: {
    type: String,
    enum: ["Leave", "Bonafide", "Fee Extension", "Document", "Other"],
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  // Optional fields for Leave requests
  startDate: { type: Date },
  endDate: { type: Date },
  
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },
  appliedDate: {
    type: Date,
    default: Date.now,
  },
  teacherRemarks: {
    type: String,
    default: "",
  }
});

module.exports = mongoose.model("Application", applicationSchema);