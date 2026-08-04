const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: false,
  },
  type: {
    type: String,
    enum: ["Leave", "Bonafide", "Fee Extension", "Document", "Other", "Admission"],
    default: "Admission",
  },
  subject: {
    type: String,
    default: "New Student Admission",
  },
  description: {
    type: String,
    default: "",
  },
  studentName: { type: String, default: "" },
  studentEmail: { type: String, default: "" },
  studentPhone: { type: String, default: "" },
  dob: { type: String, default: "" },
  gender: { type: String, default: "Male" },
  guardianName: { type: String, default: "" },
  guardianPhone: { type: String, default: "" },
  applyingClass: { type: String, default: "" },
  submittedBy: { type: String, default: "" },
  remark: { type: String, default: "" },
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
  processedBy: {
    type: String,
    default: "Super Admin",
  },
  approvedBy: {
    type: String,
    default: "Super Admin",
  },
  approvedAt: {
    type: Date,
  },
  allocatedClass: {
    type: String,
    default: "",
  },
  allocatedSection: {
    type: String,
    default: "",
  },
  teacherRemarks: {
    type: String,
    default: "",
  }
});

module.exports = mongoose.model("Application", applicationSchema);