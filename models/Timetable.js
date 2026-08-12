const mongoose = require("mongoose");

const TimetableSchema = new mongoose.Schema(
  {
    className: { type: String, required: true },
    section: { type: String, required: true },
    dayOfWeek: { 
      type: String, 
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    periods: [
      {
        period: { type: String, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        subject: { type: String, default: "" },
        teacher: { type: String, default: "" },
        room: { type: String, default: "" },
        isBreak: { type: Boolean, default: false }
      }
    ]
  },
  { timestamps: true }
);

// Create compound index to ensure one timetable per class, section, and day
TimetableSchema.index({ className: 1, section: 1, dayOfWeek: 1 }, { unique: true });

module.exports = mongoose.model("Timetable", TimetableSchema);
