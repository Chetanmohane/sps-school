const Notification = require("../models/Notification");
const User = require("../models/User");
const Student = require("../models/Student");

exports.getNotifications = async (req, res) => {
  try {
    const userRole = req.user?.role || "student";
    
    // Fetch notifications targetting "all" or specific user role
    const notifications = await Notification.find({
      $or: [
        { targetRole: "all" },
        { targetRole: userRole }
      ]
    }).sort({ createdAt: -1 });

    let filtered = notifications;

    if (userRole === "student" && req.user?.id) {
      const student = await Student.findOne({ user: req.user.id });
      if (student && student.className) {
        const studentClassNorm = student.className.toString().toLowerCase().replace('class', '').replace('th', '').replace('rd', '').replace('nd', '').replace('st', '').trim();
        
        filtered = notifications.filter(n => {
          if (!n.targetClass || n.targetClass.toLowerCase() === 'all') return true;
          const targetClassNorm = n.targetClass.toString().toLowerCase().replace('class', '').replace('th', '').replace('rd', '').replace('nd', '').replace('st', '').trim();
          return targetClassNorm === studentClassNorm;
        });
      }
    }

    res.status(200).json({
      message: "Notifications retrieved successfully",
      data: filtered
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching notifications",
      error: error.message
    });
  }
};

exports.createNotification = async (req, res) => {
  try {
    const { title, message, targetRole, targetClass } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ message: "Title and message are required." });
    }

    let creatorName = "Super Admin";
    if (req.user && req.user.id) {
      const user = await User.findById(req.user.id);
      if (user) {
        creatorName = `${user.name} (${user.role.toUpperCase()})`;
      }
    }

    const notification = new Notification({
      title,
      message,
      targetRole: targetRole || "all",
      targetClass: targetClass || "all",
      createdBy: creatorName
    });

    await notification.save();

    res.status(201).json({
      message: "Notification published successfully",
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      message: "Error publishing notification",
      error: error.message
    });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Notification.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting notification",
      error: error.message
    });
  }
};
