const Timetable = require("../models/Timetable");
const User = require("../models/User");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Class = require("../models/Class");

// @desc    Get timetable for a specific class, section, and day
// @route   GET /api/timetable
// @access  Public (for students) / Private (for teachers)
exports.getTimetable = async (req, res) => {
  try {
    const { className, section, dayOfWeek } = req.query;
    
    let query = {};
    if (className) query.className = className;
    if (section) query.section = section;
    if (dayOfWeek) query.dayOfWeek = dayOfWeek;

    const timetables = await Timetable.find(query);
    res.status(200).json({ success: true, data: timetables });
  } catch (error) {
    console.error("Error fetching timetables:", error);
    res.status(500).json({ success: false, message: "Server error while fetching timetables." });
  }
};

// @desc    Create or update a timetable
// @route   POST /api/timetable
// @access  Private (Manager, Teacher, Super Admin, Academic Admin)
exports.createOrUpdateTimetable = async (req, res) => {
  try {
    const { className, section, dayOfWeek, periods } = req.body;

    if (!className || !section || !dayOfWeek || !periods) {
      return res.status(400).json({ success: false, message: "Please provide Class, Section, Day, and Periods." });
    }

    // Sanitize periods array so no missing fields crash validation
    const sanitizedPeriods = (Array.isArray(periods) ? periods : []).map(p => ({
      period: p.period || '1',
      startTime: p.startTime || '08:30',
      endTime: p.endTime || '09:30',
      subject: p.subject || (p.isBreak ? 'Recess Break' : 'General'),
      teacher: p.teacher || '',
      room: p.room || '',
      isBreak: Boolean(p.isBreak)
    }));

    // Check if timetable already exists
    let timetable = await Timetable.findOne({ className, section, dayOfWeek });

    if (timetable) {
      // Update existing
      timetable.periods = sanitizedPeriods;
      await timetable.save();
      return res.status(200).json({ success: true, data: timetable, message: "Timetable updated successfully." });
    } else {
      // Create new
      timetable = await Timetable.create({
        className,
        section,
        dayOfWeek,
        periods: sanitizedPeriods
      });
      return res.status(201).json({ success: true, data: timetable, message: "Timetable created successfully." });
    }
  } catch (error) {
    console.error("Error saving timetable:", error);
    res.status(400).json({ success: false, message: error.message || "Server error while saving timetable." });
  }
};

// @desc    Delete a timetable
// @route   DELETE /api/timetable/:id
// @access  Private (Manager, Super Admin)
exports.deleteTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id);

    if (!timetable) {
      return res.status(404).json({ success: false, message: "Timetable not found." });
    }

    await timetable.deleteOne();
    res.status(200).json({ success: true, message: "Timetable deleted successfully." });
  } catch (error) {
    console.error("Error deleting timetable:", error);
    res.status(500).json({ success: false, message: "Server error while deleting timetable." });
  }
};

// @desc    Get timetable filtered by logged-in user's class (student) or assigned classes (teacher)
// @route   GET /api/timetable/my-timetable?email=X&role=Y
// @access  Private
exports.getMyTimetable = async (req, res) => {
  try {
    const { email, role } = req.query;
    if (!email) return res.status(400).json({ success: false, message: "Email is required." });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    if (role === "student") {
      // Get student's class and section
      const student = await Student.findOne({ user: user._id });
      if (!student) return res.status(404).json({ success: false, message: "Student profile not found." });

      const timetables = await Timetable.find({
        className: student.className,
        section: student.section,
      }).sort({ dayOfWeek: 1 });

      return res.status(200).json({
        success: true,
        data: timetables,
        classInfo: { className: student.className, section: student.section },
      });
    }

    if (role === "teacher") {
      // Get teacher's assigned class (as class teacher) and all their classes
      const teacher = await Teacher.findOne({ user: user._id });
      if (!teacher) return res.status(404).json({ success: false, message: "Teacher profile not found." });

      // Find the class where this teacher is classTeacher
      const myClass = await Class.findOne({ classTeacher: teacher._id });

      if (myClass) {
        const timetables = await Timetable.find({
          className: myClass.className,
          section: myClass.section,
        }).sort({ dayOfWeek: 1 });

        return res.status(200).json({
          success: true,
          data: timetables,
          classInfo: { className: myClass.className, section: myClass.section },
          isClassTeacher: true,
        });
      }

      // Not a class teacher — return empty
      return res.status(200).json({ success: true, data: [], classInfo: null, isClassTeacher: false });
    }

    return res.status(400).json({ success: false, message: "Invalid role." });
  } catch (error) {
    console.error("Error in getMyTimetable:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

