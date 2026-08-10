const Attendance = require("../models/Attendance");
const User = require('../models/User');
const Student = require('../models/Student');
const { notifyChange } = require("../config/socket");

exports.getStudentsForAttendance = async (req, res) => {
   try {
        const { className, section } = req.query;
        const students = await Student.find({ className, section })
            .populate('user', 'name email phone'); 
      
        if (!students || students.length === 0) {
            return res.status(200).json([]); 
        }
        res.status(200).json(students);
    } 
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.submitBulkAttendance = async (req, res) => {
    try {
        const { attendanceData, date, updatedBy } = req.body; 
        const actionBy = updatedBy || "Class Teacher In-Charge";
        // Create an array of update promises
        const updatePromises = attendanceData.map(record => {
            return Attendance.findOneAndUpdate(
                { student: record.studentId, date: new Date(date) },
                { status: record.status, updatedBy: actionBy, remark: `Marked ${record.status}` },
                { upsert: true, new: true }
            );
        });

        // Run all updates in parallel
        await Promise.all(updatePromises);
        notifyChange("ATTENDANCE_CHANGED", { date });

        res.status(200).json({ message: "Attendance marked successfully!" });
    } 
    catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAttendance = async (req, res) => {
 try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const profile = await Student.findOne({ user: user._id });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const attendance = await Attendance.find({ student: profile._id }).sort({ date: -1 });
    
    // Calculate percentage
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'Present').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    res.json({ records: attendance, percentage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllAttendance = async (req, res) => {
  try {
    const attendanceRecords = await Attendance.find()
      .populate({
        path: 'student',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .sort({ date: -1 });
    res.status(200).json(attendanceRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};