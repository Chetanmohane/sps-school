const Attendance = require("../models/Attendance");
const User = require('../models/User');
const Student = require('../models/Student');
const { notifyChange } = require("../config/socket");

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Helper: extract numeric/core part from class name for flexible matching
const normalizeClassName = (cls) => {
  if (!cls) return '';
  return cls.toString()
    .replace(/^class\s*/i, '')
    .replace(/^grade\s*/i, '')
    .replace(/^std\s*/i, '')
    .replace(/(st|nd|rd|th)\s*$/i, '')
    .trim();
};

exports.getStudentsForAttendance = async (req, res) => {
  try {
    const { className, section } = req.query;

    if (!className) {
      return res.status(400).json({ message: 'className is required' });
    }

    const trimmedClass = className.trim();
    const normalizedNum = normalizeClassName(trimmedClass);
    const escapedClass = escapeRegex(trimmedClass);
    const escapedNum = escapeRegex(normalizedNum);

    // Match exact className OR flexible formats ("10", "10th", "Class 10", "Grade 10")
    const classPattern = `^(${escapedClass}|(class\\s*|grade\\s*|std\\s*)?${escapedNum}(st|nd|rd|th)?)$`;
    const classRegex = new RegExp(classPattern, 'i');

    const query = {
      className: { $regex: classRegex }
    };

    // Filter by section if specified and not 'all'
    if (section && section.trim().toLowerCase() !== 'all') {
      const escapedSection = escapeRegex(section.trim());
      query.section = { $regex: new RegExp(`^${escapedSection}$`, 'i') };
    }

    const students = await Student.find(query)
      .populate('user', 'name email phone')
      .sort({ rollNumber: 1 });

    if (!students || students.length === 0) {
      return res.status(200).json([]);
    }
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.submitBulkAttendance = async (req, res) => {
    try {
        const { attendanceData, date, updatedBy, remark } = req.body; 
        if (!attendanceData || !Array.isArray(attendanceData) || !date) {
            return res.status(400).json({ message: "Invalid attendance payload" });
        }

        const actionBy = updatedBy || "Class Teacher In-Charge";
        const actionRemark = remark || "Daily Period Roll Call Register";

        // Parse date string to midnight start/end of day
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        // Create an array of update promises
        const updatePromises = attendanceData.map(async record => {
            const studentId = record.studentId;
            const status = record.status;
            const recordRemark = record.remark || actionRemark;

            // Find existing record on this day or create a new one
            const existing = await Attendance.findOne({
                student: studentId,
                date: { $gte: startOfDay, $lte: endOfDay }
            });

            if (existing) {
                existing.status = status;
                existing.updatedBy = actionBy;
                existing.remark = recordRemark;
                return existing.save();
            } else {
                return Attendance.create({
                    student: studentId,
                    date: startOfDay,
                    status: status,
                    updatedBy: actionBy,
                    remark: recordRemark
                });
            }
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
    const user = await User.findOne({ email: new RegExp(`^${req.params.email.trim()}$`, 'i') });
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