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
    notifyChange("USER_CHANGED", { action: "create", role, user: { _id: newAdmin._id, name, email: cleanEmail, phone: formattedPhone, role, visiblePassword: password, createdBy: newAdmin.createdBy, remarks: newAdmin.remarks } });
    res.status(201).json({ message: `${role} created successfully`, user: newAdmin });
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

    if (!password || password.trim().length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.visiblePassword = password;
    user.updatedBy = req.user?.name ? `${req.user.name} (${req.user.role || 'Super Admin'})` : "Super Admin";
    await user.save();

    notifyChange("USER_CHANGED", { action: "update-password", userId: user._id, role: user.role });
    res.status(200).json({
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
    res.status(500).json({ message: "Error updating user password", error: error.message });
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