const Student = require("../models/Student");
const User = require('../models/User');

exports.getStudent = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const profile = await Student.findOne({ user: user._id })
      .populate('user', 'name email phone');
  
    if (!profile) {
      return res.status(404).json({ message: "Profile details not found" });
    }
    res.status(200).json(profile);

  } catch (error) {
    console.error("Fetch Profile Error:", error.message);
    res.status(500).json({ message: "Server Error: " + error.message });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate("user", "name"); 
    res.json(students);
  } catch (err) {
    res.status(500).send("Error fetching students");
  }
};