const User = require("../models/User");
const Student = require("../models/Student");
const Application = require("../models/Application");
const Fee = require("../models/Fee");
const Attendance = require("../models/Attendance");
const Submission = require("../models/Submission");
const bcrypt = require("bcryptjs");
const { notifyChange } = require("../config/socket");


// ==================== ADMISSIONS MANAGEMENT ====================
// Get all pending admissions (application requests)
exports.getPendingAdmissions = async (req, res) => {
  try {
    const admissions = await Application.find({ status: "Pending" })
      .populate({
        path: "student",
        populate: { path: "user", select: "name email phone" }
      })
      .sort({ appliedDate: -1 });

    res.status(200).json({
      message: "Pending admissions retrieved successfully",
      data: admissions,
      count: admissions.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving admissions", error: error.message });
  }
};

// Get all admissions (including approved/rejected)
exports.getAllAdmissions = async (req, res) => {
  try {
    const admissions = await Application.find({ $or: [{ type: "Admission" }, { type: { $exists: false } }] })
      .populate({
        path: "student",
        populate: { path: "user", select: "name email phone role" }
      })
      .sort({ appliedDate: -1 });

    res.status(200).json({
      message: "All admissions retrieved successfully",
      data: admissions,
      count: admissions.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving admissions", error: error.message });
  }
};

// Create new admission application (Pending)
exports.createAdmission = async (req, res) => {
  try {
    const {
      studentName, studentEmail, studentPhone, dob, gender,
      guardianName, guardianPhone, applyingClass, remark, submittedBy
    } = req.body;

    if (!studentName || !studentEmail) {
      return res.status(400).json({ message: "Student Name and Email are required" });
    }

    const application = new Application({
      type: "Admission",
      subject: `Admission Request for ${studentName} (${applyingClass || "General"})`,
      description: remark || `New Student Admission application for Class ${applyingClass}`,
      studentName,
      studentEmail,
      studentPhone,
      dob,
      gender,
      guardianName,
      guardianPhone,
      applyingClass: applyingClass || "1st",
      submittedBy: submittedBy || req.user?.name || "Admin",
      remark,
      status: "Pending",
      appliedDate: new Date(),
    });

    await application.save();
    notifyChange("ADMISSION_CHANGED", { action: "create", application });

    res.status(201).json({
      message: "Admission application submitted successfully",
      data: application,
    });
  } catch (error) {
    console.error("Error creating admission:", error);
    res.status(500).json({ message: "Error submitting admission application", error: error.message });
  }
};

// Create direct admission (Instant Approval + Create Student Profile)
exports.createDirectAdmission = async (req, res) => {
  try {
    const {
      name, email, phone, dob, gender, parentName, parentPhone,
      className, section, rollNumber, address, bloodGroup, password, profileImage, submittedBy
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Student Name and Email are required" });
    }

    let formattedPhone = (phone || "").trim();
    if (!formattedPhone || !/^\+91\d{10}$/.test(formattedPhone)) {
      if (/^\d{10}$/.test(formattedPhone)) {
        formattedPhone = `+91${formattedPhone}`;
      } else {
        formattedPhone = `+9199999${Math.floor(10000 + Math.random() * 90000)}`;
      }
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password || "Student@123", 10);
    user = new User({
      name,
      email,
      phone: formattedPhone,
      password: hashedPassword,
      role: "student",
    });
    await user.save();


    let student = await Student.findOne({ user: user._id });
    if (!student) {
      const finalRoll = rollNumber || `STU-${Date.now().toString().slice(-4)}`;
      const parsedDob = (dob && !isNaN(new Date(dob).getTime())) ? new Date(dob) : undefined;
      student = new Student({
        user: user._id,
        className: className || "1st",
        section: section || "A",
        rollNumber: finalRoll,
        ...(parsedDob ? { dob: parsedDob } : {}),
        address: address || "",
        parentName: parentName || "",
        parentPhone: parentPhone || "",
        bloodGroup: bloodGroup || "",
        gender: gender || "Male",
        profileImage: profileImage || "",
        allocationDate: new Date(),
      });
      await student.save();
    } else {
      if (className) student.className = className;
      if (section) student.section = section;
      await student.save();
    }

    const application = new Application({
      student: student._id,
      type: "Admission",
      subject: `Direct Admission for ${name} (${className || "1st"}-${section || "A"})`,
      description: `Directly admitted student with Roll No: ${student.rollNumber}`,
      studentName: name,
      studentEmail: email,
      studentPhone: phone,
      dob,
      gender,
      guardianName: parentName,
      guardianPhone: parentPhone,
      applyingClass: className || "1st",
      allocatedClass: className || "1st",
      allocatedSection: section || "A",
      submittedBy: submittedBy || req.user?.name || "Admin",
      approvedBy: submittedBy || req.user?.name || "Admin",
      processedBy: submittedBy || req.user?.name || "Admin",
      status: "Approved",
      approvedAt: new Date(),
      appliedDate: new Date(),
    });
    await application.save();
    notifyChange("STUDENT_CHANGED", { action: "create", student });
    notifyChange("ADMISSION_CHANGED", { action: "direct", application });

    res.status(201).json({
      message: `Student ${name} directly admitted and assigned to Class ${className || "1st"}-${section || "A"}`,
      data: { application, student, user },
    });
  } catch (error) {
    console.error("Error creating direct admission:", error);
    res.status(500).json({ message: "Error creating direct admission", error: error.message });
  }
};

// Approve an admission
exports.approveAdmission = async (req, res) => {
  try {
    const { admissionId } = req.params;
    const { className, section, processedBy, approvedBy } = req.body;

    // Find the application
    const application = await Application.findById(admissionId);
    if (!application) {
      return res.status(404).json({ message: "Admission not found" });
    }

    const adminUser = processedBy || approvedBy || "Super Admin";

    let student = null;
    if (application.student) {
      student = await Student.findById(application.student);
    }

    // If student record doesn't exist yet for this applicant, create user & student profile
    if (!student && (application.studentEmail || application.studentName)) {
      const email = application.studentEmail || `student_${Date.now()}@school.com`;
      const name = application.studentName || "New Student";

      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: "Account with this email already exists" });
      }

      const hashedPassword = await bcrypt.hash("Student@123", 10);
      user = new User({
        name,
        email,
        phone: application.studentPhone || "",
        password: hashedPassword,
        visiblePassword: "Student@123",
        role: "student",
      });
      await user.save();


      student = await Student.findOne({ user: user._id });
      if (!student) {
        const rollNumber = `STU-${Date.now().toString().slice(-4)}`;
        const parsedDob = (application.dob && !isNaN(new Date(application.dob).getTime())) ? new Date(application.dob) : undefined;
        student = new Student({
          user: user._id,
          className: className || application.applyingClass || "1st",
          section: section || "A",
          rollNumber,
          ...(parsedDob ? { dob: parsedDob } : {}),
          parentName: application.guardianName || "",
          parentPhone: application.guardianPhone || "",
          gender: application.gender || "Male",
          allocationDate: new Date(),
        });
        await student.save();
      }

      application.student = student._id;
    } else if (student) {
      student.className = className || student.className;
      student.section = section || student.section;
      student.allocationDate = new Date();
      await student.save();
    }

    // Update application status
    application.status = "Approved";
    application.approvedAt = new Date();
    application.approvedBy = adminUser;
    application.processedBy = adminUser;
    application.allocatedClass = className || application.applyingClass || "";
    application.allocatedSection = section || "A";
    await application.save();
    notifyChange("ADMISSION_CHANGED", { action: "approve", application, student });
    notifyChange("STUDENT_CHANGED", { action: "create", student });

    res.status(200).json({
      message: "Admission approved successfully",
      data: { application, student },
    });
  } catch (error) {
    res.status(500).json({ message: "Error approving admission", error: error.message });
  }
};

// Reject an admission
exports.rejectAdmission = async (req, res) => {
  try {
    const { admissionId } = req.params;
    const { reason, processedBy } = req.body;

    const application = await Application.findById(admissionId);
    if (!application) {
      return res.status(404).json({ message: "Admission not found" });
    }

    const adminUser = processedBy || "Super Admin";

    application.status = "Rejected";
    application.rejectionReason = reason || "No reason provided";
    application.rejectedAt = new Date();
    application.processedBy = adminUser;
    await application.save();
    notifyChange("ADMISSION_CHANGED", { action: "reject", application });

    res.status(200).json({
      message: "Admission rejected successfully",
      data: application,
    });
  } catch (error) {
    res.status(500).json({ message: "Error rejecting admission", error: error.message });
  }
};

// Delete an admission application
exports.deleteAdmission = async (req, res) => {
  try {
    const { admissionId } = req.params;

    let application = await Application.findById(admissionId);
    let studentId = null;
    let userId = null;
    let email = null;

    if (application) {
      if (application.student) {
        studentId = typeof application.student === "object" && application.student._id ? application.student._id : application.student;
      }
      if (application.studentEmail) {
        email = application.studentEmail;
      }
    } else {
      // Fallback 1: Try finding Student by admissionId
      const studentObj = await Student.findById(admissionId);
      if (studentObj) {
        studentId = studentObj._id;
        userId = studentObj.user;
        application = await Application.findOne({ student: studentObj._id });
      } else {
        // Fallback 2: Try finding User by admissionId
        const userObj = await User.findById(admissionId);
        if (userObj) {
          userId = userObj._id;
          email = userObj.email;
          const s = await Student.findOne({ user: userObj._id });
          if (s) studentId = s._id;
          application = await Application.findOne({ $or: [{ student: s?._id }, { studentEmail: userObj.email }] });
        }
      }
    }

    if (!application && !studentId && !userId) {
      return res.status(404).json({ message: "Admission record not found" });
    }

    if (!studentId && userId) {
      const s = await Student.findOne({ user: userId });
      if (s) studentId = s._id;
    }
    if (studentId && !userId) {
      const s = await Student.findById(studentId);
      if (s) userId = s.user;
    }
    if (!email && userId) {
      const u = await User.findById(userId);
      if (u) email = u.email;
    }

    // Clean up linked models
    if (studentId) {
      await Fee.deleteMany({ studentId });
      await Attendance.deleteMany({ student: studentId });
      await Submission.deleteMany({ student: studentId });
      await Student.findByIdAndDelete(studentId);
    }

    if (userId) {
      await User.findByIdAndDelete(userId);
    }

    if (application) {
      await Application.findByIdAndDelete(application._id);
    }
    if (email || studentId) {
      const query = [];
      if (studentId) query.push({ student: studentId });
      if (email) query.push({ studentEmail: email });
      if (query.length > 0) {
        await Application.deleteMany({ $or: query });
      }
    }

    notifyChange("ADMISSION_CHANGED", { action: "delete", id: admissionId });
    notifyChange("APPLICATION_CHANGED", { action: "delete", id: admissionId });
    notifyChange("STUDENT_CHANGED", { action: "delete", id: studentId || admissionId });

    res.status(200).json({
      message: "Admission record deleted successfully",
      data: { id: admissionId },
    });
  } catch (error) {
    console.error("Error deleting admission:", error);
    res.status(500).json({ message: "Error deleting admission application", error: error.message });
  }
};

// ==================== STUDENT PROFILES ====================

exports.createStudent = async (req, res) => {
  try {
    const { name, email, phone, password, className, section, rollNumber, address, dob, parentName, parentPhone, bloodGroup, gender, profileImage } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Account with this email already exists" });
    }
    
    const existingProfile = await Student.findOne({ rollNumber });
    if (existingProfile) {
      return res.status(400).json({ message: "Student with this Roll Number already exists" });
    }
    
    let formattedPhone = (phone || "").trim();
    if (!formattedPhone || !/^\+91\d{10}$/.test(formattedPhone)) {
      if (/^\d{10}$/.test(formattedPhone)) {
        formattedPhone = `+91${formattedPhone}`;
      } else {
        formattedPhone = `+9199999${Math.floor(10000 + Math.random() * 90000)}`;
      }
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password || "Student@123", 10);

    // Create normal user
    const newUser = new User({
      name,
      email,
      phone: formattedPhone,
      password: hashedPassword,
      visiblePassword: password || "Student@123",
      role: 'student'
    });
    const savedUser = await newUser.save();

    // Create Student
    const newProfile = new Student({
      user: savedUser._id,      // This is the Foreign Key
      className,
      section,
      rollNumber,
      dob,
      address,
      parentName,
      parentPhone,
      bloodGroup,
      gender,
      profileImage: profileImage || ""
    });
    const savedProfile = await newProfile.save();

    notifyChange("STUDENT_CHANGED", { action: "create", student: savedProfile });
    res.status(201).json({
      message: "Student Profile Created Successfully",
      data: {
        user: savedUser,
        student: savedProfile
      }
    });
  } catch (error) {
    console.error("Error in createStudent:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Get all student profiles
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate("user", "name email phone role visiblePassword")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "All students retrieved successfully",
      data: students,
      count: students.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving students", error: error.message });
  }
};

// Get a single student profile
exports.getStudentProfile = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId).populate(
      "user",
      "name email phone address"
    );

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({
      message: "Student profile retrieved successfully",
      data: student,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving student", error: error.message });
  }
};

// Update student profile
exports.updateStudentProfile = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { name, email, phone, password, address, dob, className, section, rollNumber, parentName, parentPhone, bloodGroup, gender, profileImage } = req.body;

    // Update student record
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (className) student.className = className;
    if (section) student.section = section;
    if (dob) student.dob = dob;
    if (address) student.address = address;
    if (rollNumber) student.rollNumber = rollNumber;
    if (parentName !== undefined) student.parentName = parentName;
    if (parentPhone !== undefined) student.parentPhone = parentPhone;
    if (bloodGroup !== undefined) student.bloodGroup = bloodGroup;
    if (gender !== undefined) student.gender = gender;
    if (profileImage !== undefined) student.profileImage = profileImage;

    await student.save();

    // Update user record if provided
    if (name || email || phone || password) {
      const user = await User.findById(student.user);
      if (user) {
        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) {
          let formattedPhone = phone.trim();
          if (!formattedPhone || !/^\+91\d{10}$/.test(formattedPhone)) {
            if (/^\d{10}$/.test(formattedPhone)) {
              formattedPhone = `+91${formattedPhone}`;
            } else {
              formattedPhone = `+9199999${Math.floor(10000 + Math.random() * 90000)}`;
            }
          }
          user.phone = formattedPhone;
        }
        if (password) {
          user.password = await bcrypt.hash(password, 10);
        }
        await user.save();
      }
    }

    const updatedStudent = await Student.findById(studentId).populate(
      "user",
      "name email phone"
    );

    notifyChange("STUDENT_CHANGED", { action: "update", student: updatedStudent });
    res.status(200).json({
      message: "Student profile updated successfully",
      data: updatedStudent,
    });
  } catch (error) {
    console.error("Error in updateStudentProfile:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: "Error updating student profile", error: error.message });
  }
};

// Delete student profile
exports.deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    let student = await Student.findById(studentId);
    let userId = null;
    let email = null;
    let targetStudentId = studentId;

    if (student) {
      userId = student.user;
    } else {
      // Fallback 1: check if studentId is actually an Application ID
      const appObj = await Application.findById(studentId);
      if (appObj) {
        if (appObj.student) {
          targetStudentId = typeof appObj.student === "object" && appObj.student._id ? appObj.student._id : appObj.student;
          student = await Student.findById(targetStudentId);
          if (student) userId = student.user;
        }
        email = appObj.studentEmail;
        await Application.findByIdAndDelete(studentId);
      } else {
        // Fallback 2: check if studentId is a User ID
        const userObj = await User.findById(studentId);
        if (userObj) {
          userId = userObj._id;
          email = userObj.email;
          student = await Student.findOne({ user: userObj._id });
          if (student) targetStudentId = student._id;
        }
      }
    }

    if (!student && !userId && !email) {
      return res.status(404).json({ message: "Student record not found" });
    }

    if (userId && !email) {
      const u = await User.findById(userId);
      if (u) email = u.email;
    }

    // Delete linked Application records
    const appQuery = [];
    if (targetStudentId) appQuery.push({ student: targetStudentId });
    if (email) appQuery.push({ studentEmail: email });
    if (appQuery.length > 0) {
      await Application.deleteMany({ $or: appQuery });
    }

    if (userId) {
      await User.findByIdAndDelete(userId);
    }

    if (targetStudentId) {
      await Fee.deleteMany({ studentId: targetStudentId });
      await Attendance.deleteMany({ student: targetStudentId });
      await Submission.deleteMany({ student: targetStudentId });
      await Student.findByIdAndDelete(targetStudentId);
    }

    notifyChange("STUDENT_CHANGED", { action: "delete", id: targetStudentId || studentId });
    notifyChange("ADMISSION_CHANGED", { action: "delete", id: targetStudentId || studentId });

    res.status(200).json({
      message: "Student record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ message: "Error deleting student", error: error.message });
  }
};

// ==================== CLASS ALLOCATION ====================

// Get students by class
exports.getStudentsByClass = async (req, res) => {
  try {
    const { className } = req.params;

    const students = await Student.find({ className })
      .populate("user", "name email phone")
      .sort({ rollNumber: 1 });

    res.status(200).json({
      message: `Students in ${className} retrieved successfully`,
      data: students,
      count: students.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving students by class",
      error: error.message,
    });
  }
};

// Get unallocated students (without class assignment)
exports.getUnallocatedStudents = async (req, res) => {
  try {
    const unallocated = await Student.find({
      $or: [{ className: null }, { className: "" }],
    }).populate("user", "name email phone");

    res.status(200).json({
      message: "Unallocated students retrieved successfully",
      data: unallocated,
      count: unallocated.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving unallocated students",
      error: error.message,
    });
  }
};

// Allocate student to class
exports.allocateToClass = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { className, section, rollNumber } = req.body;

    if (!className || !section) {
      return res
        .status(400)
        .json({ message: "Class and section are required" });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if roll number is unique within class
    if (rollNumber) {
      const existing = await Student.findOne({
        _id: { $ne: studentId },
        className,
        section,
        rollNumber,
      });
      if (existing) {
        return res
          .status(400)
          .json({ message: "Roll number already exists in this class" });
      }
      student.rollNumber = rollNumber;
    }

    student.className = className;
    student.section = section;
    student.allocationDate = new Date();

    await student.save();

    const updated = await Student.findById(studentId).populate(
      "user",
      "name email"
    );

    res.status(200).json({
      message: "Student allocated to class successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error allocating student to class",
      error: error.message,
    });
  }
};

// ==================== PROMOTIONS ====================

// Get promotion history
exports.getPromotionHistory = async (req, res) => {
  try {
    const promotions = await Student.find({ promotionHistory: { $exists: true, $ne: [] } })
      .populate("user", "name email")
      .select("user className section promotionHistory createdAt");

    res.status(200).json({
      message: "Promotion history retrieved successfully",
      data: promotions,
      count: promotions.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving promotion history",
      error: error.message,
    });
  }
};

// Promote students (bulk promotion by class)
exports.promoteStudents = async (req, res) => {
  try {
    const { currentClass, currentSection, newClass, newSection, studentIds } = req.body;

    if (!newClass) {
      return res
        .status(400)
        .json({ message: "New class is required" });
    }

    // Find all students or by studentIds
    const query = {};
    if (studentIds && Array.isArray(studentIds) && studentIds.length > 0) {
      query._id = { $in: studentIds };
    } else {
      if (!currentClass) {
        return res
          .status(400)
          .json({ message: "Current class is required when studentIds is not provided" });
      }
      query.className = currentClass;
      if (currentSection) query.section = currentSection;
    }

    const students = await Student.find(query);

    if (students.length === 0) {
      return res
        .status(404)
        .json({ message: "No students found matching selection criteria" });
    }

    // Update each student
    const promotionRecords = [];
    for (let student of students) {
      const oldClass = `${student.className}-${student.section}`;
      student.previousClassName = student.className;
      student.previousSection = student.section;
      student.className = newClass;
      student.section = newSection || student.section;

      // Track promotion in history
      if (!student.promotionHistory) {
        student.promotionHistory = [];
      }
      student.promotionHistory.push({
        from: oldClass,
        to: `${newClass}-${student.section}`,
        promotedAt: new Date(),
        promotedBy: req.user.id, // Admin user ID from auth middleware
      });

      await student.save();
      promotionRecords.push(student);
    }

    res.status(200).json({
      message: `${students.length} students promoted successfully`,
      data: promotionRecords,
      count: students.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error promoting students",
      error: error.message,
    });
  }
};

// Promote a single student
exports.promoteSingleStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { newClass, newSection } = req.body;

    if (!newClass) {
      return res.status(400).json({ message: "New class is required" });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const oldClass = `${student.className}-${student.section}`;
    student.previousClassName = student.className;
    student.previousSection = student.section;
    student.className = newClass;
    student.section = newSection || student.section;

    if (!student.promotionHistory) {
      student.promotionHistory = [];
    }
    student.promotionHistory.push({
      from: oldClass,
      to: `${newClass}-${student.section}`,
      promotedAt: new Date(),
      promotedBy: req.user.id,
    });

    await student.save();

    const updated = await Student.findById(studentId).populate(
      "user",
      "name email"
    );

    res.status(200).json({
      message: "Student promoted successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error promoting student",
      error: error.message,
    });
  }
};

// Get all unique class names
exports.getAllClassNames = async (req, res) => {
  try {
    const classes = await Student.distinct("className");
    res.status(200).json({
      message: "Class names retrieved successfully",
      data: classes.filter(cls => cls && cls.trim() !== ""), // Filter out null/empty
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving class names",
      error: error.message,
    });
  }
};

// Get student admin dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const pendingAdmissions = await Application.countDocuments({
      status: "Pending",
    });
    const unresolvedAdmissions = await Application.countDocuments({
      status: { $in: ["Pending", "Processing"] },
    });

    // Count students without proper class allocation
    const unallocatedStudents = await Student.countDocuments({
      $or: [{ className: null }, { className: "" }],
    });

    res.status(200).json({
      message: "Dashboard stats retrieved successfully",
      data: {
        totalStudents,
        pendingAdmissions,
        unresolvedAdmissions,
        unallocatedStudents,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving dashboard stats",
      error: error.message,
    });
  }
};

// Get student results
exports.getStudentResults = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId).select("results");
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.status(200).json({ data: student.results || {} });
  } catch (error) {
    res.status(500).json({ message: "Error fetching student results", error: error.message });
  }
};

// Update student results
exports.updateStudentResults = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { results } = req.body;
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    student.results = results || {};
    student.markModified('results');
    await student.save();
    res.status(200).json({ message: "Results updated successfully", data: student.results });
  } catch (error) {
    res.status(500).json({ message: "Error updating student results", error: error.message });
  }
};