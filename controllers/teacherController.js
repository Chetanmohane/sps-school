const Class = require("../models/Class");
const User = require("../models/User");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");
const Application = require("../models/Application");
const { notifyChange } = require("../config/socket");

// Get all classes taught by teacher (both Class Teacher classes & subject classes)
exports.getMyClasses = async (req, res) => {
  try {
    const { email } = req.params; 
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const teacher = await Teacher.findOne({ user: user._id });
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher profile not found" });
    }

    // Find classes where teacher is Class Teacher OR listed in teacher's assigned classes
    let myClasses = await Class.find({
      $or: [
        { classTeacher: teacher._id },
        { _id: { $in: teacher.classes || [] } }
      ],
      status: "active"
    })
      .populate("subjects", "name code")
      .populate("classTeacher", "user")
      .sort({ className: 1, section: 1 });

    // Annotate classes with isClassTeacher flag
    const annotatedClasses = myClasses.map((cls) => {
      const isClassTeacher = cls.classTeacher && String(cls.classTeacher._id || cls.classTeacher) === String(teacher._id);
      return {
        ...cls.toObject(),
        isClassTeacher
      };
    });

    res.status(200).json({
      success: true,
      data: annotatedClasses
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Teacher Profile and Class Teacher Status
exports.getTeacherProfileInfo = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email }).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const teacher = await Teacher.findOne({ user: user._id })
      .populate("user", "-password")
      .populate("subjects", "name code")
      .populate("classes", "className section");

    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher profile not found" });
    }

    // Check classTeacher link first
    let classInCharge = await Class.findOne({ classTeacher: teacher._id, status: "active" })
      .populate("subjects", "name code");

    // Fallback: if teacher.classes has entries but classTeacher not set, use first class
    if (!classInCharge && teacher.classes && teacher.classes.length > 0) {
      const firstClassId = teacher.classes[0]._id || teacher.classes[0];
      const candidateClass = await Class.findOne({ _id: firstClassId, status: "active" })
        .populate("subjects", "name code");
      if (candidateClass) {
        // Auto-repair the classTeacher link
        if (!candidateClass.classTeacher || String(candidateClass.classTeacher) !== String(teacher._id)) {
          candidateClass.classTeacher = teacher._id;
          await candidateClass.save();
        }
        classInCharge = candidateClass;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        teacher,
        isClassTeacher: !!classInCharge,
        classInCharge: classInCharge || null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get roster of students ONLY for Class Teacher's assigned class
exports.getClassTeacherStudents = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const teacher = await Teacher.findOne({ user: user._id });
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher profile not found" });
    }

    // Step 1: Try strict classTeacher match
    let classInCharge = await Class.findOne({ classTeacher: teacher._id, status: "active" });

    // Step 2: Fallback — check teacher.classes array for an active class
    if (!classInCharge && teacher.classes && teacher.classes.length > 0) {
      for (const clsId of teacher.classes) {
        const classDoc = await Class.findOne({ _id: clsId, status: "active" });
        if (classDoc) {
          // Auto-repair: set this teacher as classTeacher on the Class document
          classDoc.classTeacher = teacher._id;
          await classDoc.save();
          classInCharge = classDoc;
          break;
        }
      }
    }

    if (!classInCharge) {
      return res.status(200).json({
        success: true,
        data: { isClassTeacher: false, classInfo: null, students: [] }
      });
    }

    const students = await Student.find({
      className: classInCharge.className,
      section: classInCharge.section
    }).populate("user", "-password");

    // Enhance each student with overall attendance stats
    const studentListWithStats = await Promise.all(
      students.map(async (st) => {
        const totalAtt = await Attendance.countDocuments({ student: st._id });
        const presentAtt = await Attendance.countDocuments({ student: st._id, status: "Present" });
        const attendancePct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 100;
        
        return {
          ...st.toObject(),
          attendancePct,
          totalAttendanceRecords: totalAtt
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        isClassTeacher: true,
        classInfo: classInCharge,
        students: studentListWithStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Summary Stats strictly for Class Teacher's assigned class
exports.getClassTeacherSummary = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const teacher = await Teacher.findOne({ user: user._id });
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher profile not found" });
    }

    const classInCharge = await Class.findOne({ classTeacher: teacher._id, status: "active" });

    if (!classInCharge) {
      return res.status(200).json({
        success: true,
        data: { totalStudents: 0, presentToday: 0, absentToday: 0, pendingLeaves: 0 }
      });
    }

    const students = await Student.find({ className: classInCharge.className, section: classInCharge.section });
    const studentIds = students.map(s => s._id);

    const todayStr = new Date().toISOString().split("T")[0];
    const todayStart = new Date(todayStr);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const todayAttendance = await Attendance.find({
      student: { $in: studentIds },
      date: { $gte: todayStart, $lt: todayEnd }
    });

    const presentToday = todayAttendance.filter(a => a.status === "Present").length;
    const absentToday = todayAttendance.filter(a => a.status === "Absent").length;

    const pendingLeaves = await Application.countDocuments({
      student: { $in: studentIds },
      status: "Pending"
    });

    res.status(200).json({
      success: true,
      data: {
        classInfo: classInCharge,
        totalStudents: students.length,
        presentToday,
        absentToday,
        markedToday: todayAttendance.length,
        pendingLeaves
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update / Assign subjects and classes to teacher by email
exports.updateTeacherSubjects = async (req, res) => {
  try {
    const { email } = req.params;
    const { subjects, classes, specialization, department } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const teacher = await Teacher.findOne({ user: user._id });
    if (!teacher) {
      return res.status(404).json({ success: false, message: "Teacher profile not found" });
    }

    if (subjects !== undefined) teacher.subjects = subjects;
    if (classes !== undefined) teacher.classes = classes;
    if (specialization !== undefined) teacher.specialization = specialization;
    if (department !== undefined) teacher.department = department;
    teacher.updatedAt = Date.now();

    await teacher.save();

    const updatedTeacher = await Teacher.findById(teacher._id)
      .populate("user", "name email phone role")
      .populate("subjects", "name code")
      .populate("classes", "className section");

    notifyChange("TEACHER_CHANGED", { action: "update", teacher: updatedTeacher });

    res.status(200).json({
      success: true,
      message: "Teacher subjects and classes assigned successfully!",
      data: updatedTeacher
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};