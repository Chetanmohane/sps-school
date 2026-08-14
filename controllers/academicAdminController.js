const User = require("../models/User");
const Teacher = require("../models/Teacher");
const Subject = require("../models/Subject");
const Class = require("../models/Class");
const { notifyChange } = require("../config/socket");


// ==================== DASHBOARD STATS ====================
exports.getDashboardStats = async (req, res) => {
  try {
    const totalTeachers = await Teacher.countDocuments({ status: "active" });
    const totalSubjects = await Subject.countDocuments({ status: "active" });
    const totalClasses = await Class.countDocuments({ status: "active" });

    res.status(200).json({
      message: "Dashboard stats retrieved successfully",
      data: {
        totalTeachers,
        totalSubjects,
        totalClasses,
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving dashboard stats", error: error.message });
  }
};

// ==================== TEACHER MANAGEMENT ====================

// Get all teachers
exports.getAllTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate("user", "name email phone role visiblePassword")
      .populate("subjects", "name code")
      .populate("classes", "className section")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Teachers retrieved successfully",
      data: teachers,
      count: teachers.length
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving teachers", error: error.message });
  }
};


// Get teacher by ID
exports.getTeacherById = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const teacher = await Teacher.findById(teacherId)
      .populate("user", "name email phone")
      .populate("subjects", "name code")
      .populate("classes", "className section");

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.status(200).json({
      message: "Teacher retrieved successfully",
      data: teacher
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving teacher", error: error.message });
  }
};

// Create teacher
exports.createTeacher = async (req, res) => {
  try {
    const { name, email, phone, password, specialization, qualifications, experience, subjects, classes, department } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password || !specialization) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    let formattedPhone = (phone || "").trim();
    if (!formattedPhone || !/^\+91\d{10}$/.test(formattedPhone)) {
      if (/^\d{10}$/.test(formattedPhone)) {
        formattedPhone = `+91${formattedPhone}`;
      } else {
        formattedPhone = `+9199999${Math.floor(10000 + Math.random() * 90000)}`;
      }
    }

    // Create user with teacher role
    let creatorName = "Super Admin";
    if (req.user && req.user.id) {
      const creator = await User.findById(req.user.id);
      if (creator) {
        creatorName = `${creator.name} (${creator.role.toUpperCase()})`;
      }
    }

    const hashedPassword = require("bcryptjs").hashSync(password, 10);
    const user = new User({
      name,
      email,
      phone: formattedPhone,
      password: hashedPassword,
      visiblePassword: password,
      role: "teacher",
      createdBy: creatorName,
      remarks: "Subject Teacher Account Registered"
    });

    const savedUser = await user.save();

    // Create teacher record
    const teacher = new Teacher({
      user: savedUser._id,
      specialization,
      qualifications,
      experience,
      subjects: subjects || [],
      classes: classes || [],
      department,
      phone
    });

    const savedTeacher = await teacher.save();
    const populatedTeacher = await Teacher.findById(savedTeacher._id)
      .populate("user", "name email phone role visiblePassword")
      .populate("subjects", "name code")
      .populate("classes", "className section");

    notifyChange("TEACHER_CHANGED", { action: "create", teacher: populatedTeacher });
    res.status(201).json({
      message: "Teacher created successfully",
      data: {
        user: savedUser,
        teacher: populatedTeacher
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating teacher", error: error.message });
  }
};

// Update teacher
exports.updateTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { specialization, qualifications, experience, subjects, classes, department, status, name, phone, password } = req.body;

    const teacherDoc = await Teacher.findById(teacherId);
    if (!teacherDoc) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Update associated User model if name, phone, or password were provided
    if (teacherDoc.user) {
      const user = await User.findById(teacherDoc.user);
      if (user) {
        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (password && password.trim().length >= 6) {
          const bcrypt = require("bcryptjs");
          user.password = await bcrypt.hash(password.trim(), 10);
          user.visiblePassword = password.trim();
        }
        await user.save({ validateBeforeSave: false });
      }
    }

    // Build update object with only provided fields
    const updateData = {
      updatedAt: Date.now()
    };

    if (specialization !== undefined) updateData.specialization = specialization;
    if (qualifications !== undefined) updateData.qualifications = qualifications;
    if (experience !== undefined) updateData.experience = experience;
    if (subjects !== undefined) updateData.subjects = subjects;
    if (classes !== undefined) updateData.classes = classes;
    if (department !== undefined) updateData.department = department;
    if (status !== undefined) updateData.status = status;

    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      updateData,
      { new: true }
    )
      .populate("user", "name email phone role visiblePassword")
      .populate("subjects", "name code")
      .populate("classes", "className section");

    notifyChange("TEACHER_CHANGED", { action: "update", teacher });
    res.status(200).json({
      message: "Teacher updated successfully",
      data: teacher
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating teacher", error: error.message });
  }
};

// Delete teacher
exports.deleteTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await Teacher.findByIdAndDelete(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Delete associated user
    await User.findByIdAndDelete(teacher.user);
    notifyChange("TEACHER_CHANGED", { action: "delete", id: teacherId });

    res.status(200).json({
      message: "Teacher deleted successfully",
      data: teacher
    });
  } catch (error) {
    res.status(500).json({ message: "Error deleting teacher", error: error.message });
  }
};

// ==================== SUBJECT MANAGEMENT ====================

// Get all subjects
exports.getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ name: 1 });

    res.status(200).json({
      message: "Subjects retrieved successfully",
      data: subjects,
      count: subjects.length
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving subjects", error: error.message });
  }
};

// Get subject by ID
exports.getSubjectById = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const subject = await Subject.findById(subjectId);

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    res.status(200).json({
      message: "Subject retrieved successfully",
      data: subject
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving subject", error: error.message });
  }
};

// Create subject
exports.createSubject = async (req, res) => {
  try {
    const { name, code, description, credits, syllabus } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: "Subject name and code are required" });
    }

    // Check if subject already exists
    const existingSubject = await Subject.findOne({ $or: [{ name }, { code: code.toUpperCase() }] });
    if (existingSubject) {
      return res.status(400).json({ message: "Subject with this name or code already exists" });
    }

    const subject = new Subject({
      name,
      code: code.toUpperCase(),
      description,
      credits: credits || 3,
      syllabus
    });

    const savedSubject = await subject.save();
    notifyChange("SUBJECT_CHANGED", { action: "create", subject: savedSubject });

    res.status(201).json({
      message: "Subject created successfully",
      data: savedSubject
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating subject", error: error.message });
  }
};

// Update subject
exports.updateSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { name, code, description, credits, syllabus, status } = req.body;

    const subject = await Subject.findByIdAndUpdate(
      subjectId,
      {
        name,
        code: code ? code.toUpperCase() : undefined,
        description,
        credits,
        syllabus,
        status,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    notifyChange("SUBJECT_CHANGED", { action: "update", subject });
    res.status(200).json({
      message: "Subject updated successfully",
      data: subject
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating subject", error: error.message });
  }
};

// Delete subject
exports.deleteSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const subject = await Subject.findByIdAndDelete(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }
    notifyChange("SUBJECT_CHANGED", { action: "delete", id: subjectId });

    res.status(200).json({
      message: "Subject deleted successfully",
      data: subject
    });
  } catch (error) {
    res.status(500).json({ message: "Error deleting subject", error: error.message });
  }
};

// ==================== CLASS MANAGEMENT ====================

// Get all classes
exports.getAllClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate({
        path: "classTeacher",
        populate: { path: "user", select: "name email" }
      })
      .populate("subjects", "name code")
      .sort({ className: 1, section: 1 });

    res.status(200).json({
      message: "Classes retrieved successfully",
      data: classes,
      count: classes.length
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving classes", error: error.message });
  }
};

// Get class by ID
exports.getClassById = async (req, res) => {
  try {
    const { classId } = req.params;
    const schoolClass = await Class.findById(classId)
      .populate({
        path: "classTeacher",
        populate: { path: "user", select: "name email" }
      })
      .populate("subjects", "name code");

    if (!schoolClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.status(200).json({
      message: "Class retrieved successfully",
      data: schoolClass
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving class", error: error.message });
  }
};

// Helper to get formatted admin identity string
const getAdminUserString = (req) => {
  if (req.body && req.body.updatedBy) {
    return req.body.updatedBy;
  }
  if (req.user) {
    const r = (req.user.role || "").toLowerCase();
    if (r.includes("manager")) return "Manager Admin";
    if (r.includes("super")) return "Super Admin";
    if (r.includes("academic")) return "Academic Admin";
    if (r.includes("teacher")) return "Teacher Admin";
    if (r.includes("operations")) return "Operations Admin";
  }
  return "Super Admin";
};

// Create class
exports.createClass = async (req, res) => {
  try {
    const { className, section, academicYear, classTeacher, subjects, capacity, startTime, endTime, room, updatedBy } = req.body;

    if (!className || !academicYear) {
      return res.status(400).json({ message: "Class name and academic year are required" });
    }

    // Check if class already exists
    const existingClass = await Class.findOne({ className, section, academicYear });
    if (existingClass) {
      return res.status(400).json({ message: "This class already exists for the selected academic year" });
    }

    const adminUser = getAdminUserString(req);

    const schoolClass = new Class({
      className,
      section: section,
      academicYear,
      classTeacher: classTeacher && classTeacher !== '' ? classTeacher : null,
      subjects: subjects || [],
      capacity: capacity || 50,
      startTime: startTime,
      endTime: endTime,
      room: room,
      updatedBy: adminUser
    });

    const savedClass = await schoolClass.save();
    await savedClass.populate({
      path: "classTeacher",
      populate: { path: "user", select: "name email" }
    });
    await savedClass.populate("subjects", "name code");
    notifyChange("CLASS_CHANGED", { action: "create", class: savedClass });

    res.status(201).json({
      message: "Class created successfully",
      data: savedClass
    });
  } catch (error) {
    res.status(500).json({ message: "Error creating class", error: error.message });
  }
};

// Update class
exports.updateClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { className, section, classTeacher, subjects, capacity, status, startTime, endTime, room, updatedBy } = req.body;

    const adminUser = getAdminUserString(req);

    const schoolClass = await Class.findByIdAndUpdate(
      classId,
      {
        className,
        section,
        classTeacher: classTeacher && classTeacher !== '' ? classTeacher : null,
        subjects,
        capacity,
        status,
        startTime,
        endTime,
        room,
        updatedBy: adminUser,
        updatedAt: Date.now()
      },
      { new: true }
    )
      .populate({
        path: "classTeacher",
        populate: { path: "user", select: "name email" }
      })
      .populate("subjects", "name code");

    if (!schoolClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.status(200).json({
      message: "Class updated successfully",
      data: schoolClass
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating class", error: error.message });
  }
};

// Delete class
exports.deleteClass = async (req, res) => {
  try {
    const { classId } = req.params;

    const schoolClass = await Class.findByIdAndDelete(classId);
    if (!schoolClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.status(200).json({
      message: "Class deleted successfully",
      data: schoolClass
    });
  } catch (error) {
    res.status(500).json({ message: "Error deleting class", error: error.message });
  }
};

// Bulk Update Global Class Timings for all classes at once
exports.updateGlobalClassTimings = async (req, res) => {
  try {
    const { startTime, endTime, updatedBy } = req.body;
    if (!startTime || !endTime) {
      return res.status(400).json({ message: "Start time and End time are required" });
    }

    const adminUser = updatedBy || "Super Admin";

    const result = await Class.updateMany(
      {},
      {
        $set: {
          startTime: startTime,
          endTime: endTime,
          updatedBy: adminUser,
          updatedAt: Date.now()
        }
      }
    );

    res.status(200).json({
      message: `Global class timings updated to ${startTime} - ${endTime} across all classes successfully!`,
      data: result
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating global class timings", error: error.message });
  }
};

// Assign class teacher to a class
exports.assignClassTeacher = async (req, res) => {
  try {
    const { classId } = req.params;
    const { teacherId } = req.body;

    const adminUser = getAdminUserString(req);

    // If teacherId is empty/null, unassign the class teacher
    const schoolClass = await Class.findByIdAndUpdate(
      classId,
      {
        classTeacher: teacherId && teacherId !== '' ? teacherId : null,
        updatedBy: adminUser,
        updatedAt: Date.now()
      },
      { new: true }
    )
      .populate({
        path: "classTeacher",
        populate: { path: "user", select: "name email phone" }
      })
      .populate("subjects", "name code");

    if (!schoolClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.status(200).json({
      message: teacherId ? "Class teacher assigned successfully" : "Class teacher unassigned successfully",
      data: schoolClass
    });
  } catch (error) {
    res.status(500).json({ message: "Error assigning class teacher", error: error.message });
  }
};

// Get class subject-teacher details (which teachers teach which subjects in a class)
exports.getClassSubjectTeachers = async (req, res) => {
  try {
    const { classId } = req.params;

    // Get the class with its subjects and class teacher
    const schoolClass = await Class.findById(classId)
      .populate({
        path: "classTeacher",
        populate: { path: "user", select: "name email phone" }
      })
      .populate("subjects", "name code description");

    if (!schoolClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Find all teachers who are assigned to this class
    const subjectTeachers = await Teacher.find({
      classes: classId,
      status: "active"
    })
      .populate("user", "name email phone")
      .populate("subjects", "name code");

    // Map each subject in the class to its teacher(s)
    const subjectTeacherMap = schoolClass.subjects.map(subject => {
      const teachersForSubject = subjectTeachers.filter(teacher =>
        teacher.subjects.some(s => s._id.toString() === subject._id.toString())
      );
      return {
        subject: {
          _id: subject._id,
          name: subject.name,
          code: subject.code,
          description: subject.description
        },
        teachers: teachersForSubject.map(t => ({
          _id: t._id,
          name: t.user?.name,
          email: t.user?.email,
          phone: t.user?.phone,
          specialization: t.specialization,
          experience: t.experience
        }))
      };
    });

    res.status(200).json({
      message: "Class subject teachers retrieved successfully",
      data: {
        class: {
          _id: schoolClass._id,
          className: schoolClass.className,
          section: schoolClass.section,
          academicYear: schoolClass.academicYear,
          room: schoolClass.room,
          capacity: schoolClass.capacity
        },
        classTeacher: schoolClass.classTeacher
          ? {
              _id: schoolClass.classTeacher._id,
              name: schoolClass.classTeacher.user?.name,
              email: schoolClass.classTeacher.user?.email,
              phone: schoolClass.classTeacher.user?.phone,
              specialization: schoolClass.classTeacher.specialization,
              experience: schoolClass.classTeacher.experience
            }
          : null,
        subjectTeachers: subjectTeacherMap,
        allSubjectTeachers: subjectTeachers.map(t => ({
          _id: t._id,
          name: t.user?.name,
          specialization: t.specialization,
          subjects: t.subjects
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving class subject teachers", error: error.message });
  }
};

// Assign subjects to class
exports.assignSubjectsToClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { subjects } = req.body;

    if (!subjects || !Array.isArray(subjects)) {
      return res.status(400).json({ message: "Subjects array is required" });
    }

    const schoolClass = await Class.findByIdAndUpdate(
      classId,
      { subjects, updatedAt: Date.now() },
      { new: true }
    ).populate("subjects", "name code");

    if (!schoolClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    res.status(200).json({
      message: "Subjects assigned to class successfully",
      data: schoolClass
    });
  } catch (error) {
    res.status(500).json({ message: "Error assigning subjects", error: error.message });
  }
};