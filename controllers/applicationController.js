const Application = require("../models/Application");
const Student = require("../models/Student");
const User = require("../models/User");
const Fee = require("../models/Fee");
const Attendance = require("../models/Attendance");
const Submission = require("../models/Submission");
const { notifyChange } = require("../config/socket");

exports.sendApplication = async (req, res) => {
  try {
    const { type, subject, description, startDate, endDate, email } = req.body;

    const user = await User.findOne({ email: email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const studentProfile = await Student.findOne({ user: user._id });
    if (!studentProfile) return res.status(404).json({ message: "Student profile not found" });

    const newApplication = new Application({
      student: studentProfile._id,
      type,
      subject,
      description,
      startDate: startDate || null,
      endDate: endDate || null,
      studentName: user.name || "",
      applyingClass: studentProfile.className ? `${studentProfile.className}${studentProfile.section ? `-${studentProfile.section}` : ''}` : ""
    });

    await newApplication.save();
    notifyChange("APPLICATION_CHANGED", { action: "create", application: newApplication });
    res.status(201).json({ message: "Application submitted successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate({
        path: 'student',
        populate: { path: 'user', select: 'name' }
      })
      .sort({ appliedDate: -1 });

    res.status(200).json(applications);
  } 
  catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, teacherRemarks, processedBy } = req.body;
    console.log(id, " ", status, " ", teacherRemarks, " ", processedBy);
    
    const updated = await Application.findByIdAndUpdate(id,
      { 
        status, 
        teacherRemarks, 
        processedBy: processedBy || "Admin",
        approvedBy: processedBy || "Admin",
        approvedAt: new Date()
      },
      { new: true }
    );

    notifyChange("APPLICATION_CHANGED", { action: "update", application: updated });
    res.status(200).json({ message: `Application ${status}`, data: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET applications filtered by class (for class teacher view)
exports.getByClass = async (req, res) => {
  try {
    const { className, section } = req.query;

    if (!className) {
      return res.status(400).json({ message: "className is required" });
    }

    // Find all students in this class+section
    const query = { className };
    if (section) query.section = section;
    const students = await Student.find(query).select("_id");
    const studentIds = students.map((s) => s._id);

    const applications = await Application.find({ student: { $in: studentIds } })
      .populate({
        path: "student",
        populate: { path: "user", select: "name" },
      })
      .sort({ appliedDate: -1 });

    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE an application by ID
exports.deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Clean up linked student/user profile if this was an admission or student application
    let rawStudentId = application.student;
    if (rawStudentId) {
      const studentId = typeof rawStudentId === "object" && rawStudentId._id ? rawStudentId._id : rawStudentId;
      try {
        const studentObj = await Student.findById(studentId);
        if (studentObj) {
          if (studentObj.user) {
            await User.findByIdAndDelete(studentObj.user);
          }
          await Fee.deleteMany({ studentId });
          await Attendance.deleteMany({ student: studentId });
          await Submission.deleteMany({ student: studentId });
          await Student.findByIdAndDelete(studentId);
        }
      } catch (err) {
        console.error("Error cleaning student profile:", err);
      }
    } else if (application.studentEmail) {
      try {
        const user = await User.findOne({ email: application.studentEmail });
        if (user) {
          const studentObj = await Student.findOne({ user: user._id });
          if (studentObj) {
            await Fee.deleteMany({ studentId: studentObj._id });
            await Attendance.deleteMany({ student: studentObj._id });
            await Submission.deleteMany({ student: studentObj._id });
            await Student.findByIdAndDelete(studentObj._id);
          }
          await User.findByIdAndDelete(user._id);
        }
      } catch (err) {
        console.error("Error cleaning user profile by email:", err);
      }
    }

    await Application.findByIdAndDelete(id);
    notifyChange("APPLICATION_CHANGED", { action: "delete", id });
    res.status(200).json({ message: "Application deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};