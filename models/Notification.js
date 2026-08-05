const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  targetRole: {
    type: String,
    default: "all" // "all", "teacher", "student", "manager-admin", etc.
  },
  targetClass: {
    type: String,
    default: "all" // "all", "10", "9", etc.
  },
  createdBy: {
    type: String,
    default: "Super Admin"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Notification", notificationSchema);
