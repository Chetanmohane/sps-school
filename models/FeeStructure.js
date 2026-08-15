const mongoose = require("mongoose");

const feeStructureSchema = new mongoose.Schema({
  className: {
    type: String,
    required: true,
    unique: true
  },
  tuitionFee: {
    type: Number,
    default: 0
  },
  admissionFee: {
    type: Number,
    default: 0
  },
  examFee: {
    type: Number,
    default: 0
  },
  activityFee: {
    type: Number,
    default: 0
  },
  totalAnnualFee: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active"
  },
  updatedBy: {
    type: String,
    default: "Super Admin"
  },
  remarks: {
    type: String,
    default: "Standard Class Fee Structure"
  }
}, { timestamps: true });

module.exports = mongoose.model("FeeStructure", feeStructureSchema);
