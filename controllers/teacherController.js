const Class = require("../models/Class");
const User = require("../models/User");
const Teacher = require("../models/Teacher");

exports.getMyClasses = async (req, res) => {
  try {
    const {email} = req.params; 
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const teacher = await Teacher.findOne({ user: user._id });
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher profile not found" });
    }

    const myClasses = await Class.find({ classTeacher: teacher._id, status: "active" })
      .populate("subjects", "name code")          
      .sort({ startTime: 1 });   
      
    if (!myClasses || myClasses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active class for you!"
      });
    }  

    res.status(200).json({
      success: true,
      data: myClasses
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};