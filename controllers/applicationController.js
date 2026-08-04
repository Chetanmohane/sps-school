const Application = require("../models/Application");
const Student = require("../models/Student");
const User = require("../models/User");
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