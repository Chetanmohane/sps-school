const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { notifyChange } = require("../config/socket");

exports.getAdminsByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const admins = await User.find({ role }).select('-password');
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: "Error fetching admins", error: error.message });
  }
};

exports.createSpecializedAdmin = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role are required." });
    }

    const cleanEmail = (email || "").trim().toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }
    
    // Auto-format 10-digit Indian phone numbers
    let formattedPhone = (phone || "").trim();
    if (/^\d{10}$/.test(formattedPhone)) {
      formattedPhone = `+91${formattedPhone}`;
    }

    if (!formattedPhone) {
      return res.status(400).json({ message: "Phone number is required. Format: +919876543210" });
    }

    if (!/^\+91\d{10}$/.test(formattedPhone)) {
      return res.status(400).json({ message: "Invalid phone number! Must be +91 followed by 10 digits (e.g. +919876543210)." });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(password || '')) {
      return res.status(400).json({ message: "Password must be at least 8 characters long and include an uppercase letter, lowercase letter, number, and special character (e.g. Admin@123)." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new User({
      name,
      email: cleanEmail,
      password: hashedPassword,
      visiblePassword: password,
      phone: formattedPhone,
      role,
      createdBy: req.body.createdBy || "Super Admin",
      remarks: req.body.remarks || "Account Registered"
    });

    await newAdmin.save();

    if (role === 'class-teacher' || role === 'teacher') {
      try {
        const Teacher = require("../models/Teacher");
        const Class = require("../models/Class");

        let teacherDoc = await Teacher.findOne({ user: newAdmin._id });
        if (!teacherDoc) {
          teacherDoc = new Teacher({
            user: newAdmin._id,
            specialization: req.body.specialization || "Class In-Charge & Academic Management",
            qualifications: req.body.qualifications || "M.Sc / B.Ed",
            experience: Number(req.body.experience) || 3,
            department: req.body.department || "Academic In-Charge",
            phone: formattedPhone
          });
          await teacherDoc.save();
        }

        // If className & section provided, assign classTeacher on Class model (creating Class if it doesn't exist yet)
        if (req.body.className && req.body.section) {
          const targetClassName = String(req.body.className).trim();
          const targetSection = String(req.body.section).trim().toUpperCase();
          let classDoc = await Class.findOne({
            className: targetClassName,
            section: targetSection
          });
          if (!classDoc) {
            const currentYear = new Date().getFullYear();
            classDoc = new Class({
              className: targetClassName,
              section: targetSection,
              academicYear: `${currentYear}-${currentYear + 1}`,
              classTeacher: teacherDoc._id,
              startTime: "08:00",
              endTime: "14:00",
              capacity: 40
            });
            await classDoc.save();
          } else {
            classDoc.classTeacher = teacherDoc._id;
            await classDoc.save();
          }
          if (!teacherDoc.classes.includes(classDoc._id)) {
            teacherDoc.classes.push(classDoc._id);
            await teacherDoc.save();
          }
        }
      } catch (tErr) {
        console.warn("Notice: Created user but teacher doc binding encountered warning:", tErr.message);
      }
    }

    notifyChange("USER_CHANGED", { action: "create", role, user: { _id: newAdmin._id, name, email: cleanEmail, phone: formattedPhone, role, visiblePassword: password, createdBy: newAdmin.createdBy, remarks: newAdmin.remarks } });
    notifyChange("TEACHER_CHANGED", { action: "create", role });
    res.status(201).json({ message: `${role} account created successfully`, user: newAdmin });
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(400).json({ message: error.message || "Error creating admin" });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    await User.findByIdAndDelete(req.params.id);
    notifyChange("USER_CHANGED", { action: "delete", id: req.params.id });
    res.status(200).json({ message: "Admin deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting admin" });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    const { name, phone, role, password } = req.body;
    const admin = await User.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (name) admin.name = name;
    if (phone !== undefined) admin.phone = phone;
    if (role) admin.role = role;
    if (password && password.trim().length >= 6) {
      admin.password = await bcrypt.hash(password, 10);
      admin.visiblePassword = password;
    }
    if (req.body.updatedBy) admin.updatedBy = req.body.updatedBy;
    if (req.body.remarks !== undefined) admin.remarks = req.body.remarks;

    await admin.save();
    notifyChange("USER_CHANGED", { action: "update", user: { _id: admin._id, name: admin.name, role: admin.role, updatedBy: admin.updatedBy, remarks: admin.remarks } });
    res.status(200).json({ message: "Admin updated successfully", user: admin });
  } catch (error) {
    res.status(500).json({ message: "Error updating admin", error: error.message });
  }
};

// Update password for ANY user (Student, Teacher, Admin) by Super Admin
exports.updateUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const cleanPassword = (password || "").trim();

    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ message: "Invalid User ID provided." });
    }

    if (!cleanPassword || cleanPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const mongoose = require("mongoose");
    const Teacher = require("../models/Teacher");
    const Student = require("../models/Student");

    let user = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await User.findById(id);

      if (!user) {
        // Search if 'id' was a Teacher document ID
        const teacherDoc = await Teacher.findById(id);
        if (teacherDoc) {
          if (teacherDoc.user) {
            user = await User.findById(teacherDoc.user);
          }
          if (!user && (teacherDoc.email || teacherDoc.name)) {
            user = await User.findOne({ 
              $or: [
                { email: (teacherDoc.email || '').toLowerCase() },
                { name: new RegExp(`^${teacherDoc.name}$`, "i") }
              ] 
            });
          }
          if (!user) {
            // Auto-create missing User account for this Teacher document
            const hashedPassword = await bcrypt.hash(cleanPassword, 10);
            user = new User({
              name: teacherDoc.name || 'Teacher',
              email: (teacherDoc.email || `teacher_${teacherDoc._id}@sps.edu`).toLowerCase(),
              phone: teacherDoc.phone || '+919876543210',
              password: hashedPassword,
              visiblePassword: cleanPassword,
              role: 'teacher'
            });
            await user.save({ validateBeforeSave: false });
            teacherDoc.user = user._id;
            await teacherDoc.save();
          } else if (!teacherDoc.user) {
            teacherDoc.user = user._id;
            await teacherDoc.save();
          }
        }
      }

      if (!user) {
        // Search if 'id' was a Student document ID
        const studentDoc = await Student.findById(id);
        if (studentDoc) {
          if (studentDoc.user) {
            user = await User.findById(studentDoc.user);
          }
          if (!user && (studentDoc.email || studentDoc.name)) {
            user = await User.findOne({ 
              $or: [
                { email: (studentDoc.email || '').toLowerCase() },
                { name: new RegExp(`^${studentDoc.name}$`, "i") }
              ] 
            });
          }
          if (!user) {
            // Auto-create missing User account for this Student document
            const hashedPassword = await bcrypt.hash(cleanPassword, 10);
            user = new User({
              name: studentDoc.name || 'Student',
              email: (studentDoc.email || `student_${studentDoc._id}@sps.edu`).toLowerCase(),
              phone: studentDoc.phone || '+919876543210',
              password: hashedPassword,
              visiblePassword: cleanPassword,
              role: 'student'
            });
            await user.save({ validateBeforeSave: false });
            studentDoc.user = user._id;
            await studentDoc.save();
          } else if (!studentDoc.user) {
            studentDoc.user = user._id;
            await studentDoc.save();
          }
        }
      }
    } else {
      user = await User.findOne({ $or: [{ email: id.toLowerCase() }, { name: new RegExp(`^${id}$`, "i") }] });
    }

    if (!user) {
      return res.status(404).json({ message: `User account not found for ID: ${id}` });
    }

    user.password = await bcrypt.hash(cleanPassword, 10);
    user.visiblePassword = cleanPassword;
    user.updatedBy = req.user?.name ? `${req.user.name} (${req.user.role || 'Super Admin'})` : "Super Admin";
    await user.save({ validateBeforeSave: false });

    notifyChange("USER_CHANGED", { action: "update-password", userId: user._id, role: user.role });
    res.status(200).json({
      success: true,
      message: `Password for ${user.name} (${user.role}) updated successfully!`,
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        visiblePassword: user.visiblePassword
      }
    });
  } catch (error) {
    console.error("Error updating user password:", error);
    res.status(500).json({ message: error.message || "Failed to update password", error: error.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await User.find()
      .select('name email phone role visiblePassword createdBy remarks createdAt')
      .sort({ createdAt: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching audit logs", error: error.message });
  }
};