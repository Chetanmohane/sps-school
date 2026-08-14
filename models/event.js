const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  date: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  type: {
    type: String,
    enum: ["Holiday", "Event", "Academic", "Sports", "Exam"],
    default: "Event"
  },
  location: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

module.exports = mongoose.model("Event", eventSchema);