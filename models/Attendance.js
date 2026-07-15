const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  date: { type: Date, required: true },
  status: { type: String, enum: ['Present', 'Absent'], default: 'Present'},
});

// Ensure a student only has one record per day
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);