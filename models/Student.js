const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  className: { type: String, required: true },
  section: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  address: { type: String },
  dob: { type: Date, required: true },

  parentName: { type: String },
  parentPhone: { type: String },
  bloodGroup: { type: String },
  gender: { type: String },

  // for Student Admin perspective
  allocationDate: { type: Date },
  previousClassName: { type: String },
  previousSection: { type: String },
  promotionHistory: [
    {
      from: { type: String },
      to: { type: String },
      promotedAt: { type: Date },
      promotedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }
  ],
});

module.exports = mongoose.model("Student", studentSchema);