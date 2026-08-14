const Notification = require("../models/Notification");
const User = require("../models/User");
const Student = require("../models/Student");

exports.getNotifications = async (req, res) => {
  try {
    const userRole = req.user?.role || "student";
    let query = {};
    
    const adminRoles = ["super-admin", "manager-admin", "academic-admin", "finance-admin", "student-admin", "operations-admin"];
    
    if (adminRoles.includes(userRole)) {
      query = {};
    } else if (userRole === "teacher" || userRole === "class-teacher") {
      query = {
        $or: [
          { targetRole: "all" },
          { targetRole: "teacher" },
          { targetRole: "class-teacher" },
          { targetRole: "student" }
        ]
      };
    } else {
      query = {
        $or: [
          { targetRole: "all" },
          { targetRole: userRole }
        ]
      };
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 });

    let filtered = notifications;

    if (userRole === "student" && req.user?.id) {
      const student = await Student.findOne({ user: req.user.id });
      if (student && student.className) {
        const studentClassNorm = student.className.toString().toLowerCase().replace('class', '').replace('th', '').replace('rd', '').replace('nd', '').replace('st', '').trim();
        const studentSectionNorm = (student.section || '').toString().toLowerCase().trim();
        
        filtered = notifications.filter(n => {
          let classMatch = true;
          let sectionMatch = true;

          if (n.targetClass && n.targetClass.toLowerCase() !== 'all') {
            const targetClassNorm = n.targetClass.toString().toLowerCase().replace('class', '').replace('th', '').replace('rd', '').replace('nd', '').replace('st', '').trim();
            classMatch = targetClassNorm === studentClassNorm;
          }

          if (n.targetSection && n.targetSection.toLowerCase() !== 'all') {
            const targetSectionNorm = n.targetSection.toString().toLowerCase().trim();
            sectionMatch = targetSectionNorm === studentSectionNorm;
          }

          return classMatch && sectionMatch;
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
    const { title, message, targetRole, targetClass, targetSection } = req.body;
    
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
      targetSection: targetSection || "all",
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

exports.updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, targetRole, targetClass, targetSection } = req.body;

    const updated = await Notification.findByIdAndUpdate(
      id,
      { title, message, targetRole: targetRole || "all", targetClass: targetClass || "all", targetSection: targetSection || "all" },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
      message: "Notification updated successfully",
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating notification",
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
