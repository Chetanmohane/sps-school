const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  teacher: {type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  className: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  instructions: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Assignment", assignmentSchema);