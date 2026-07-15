const User = require("../models/User");
const bcrypt = require("bcryptjs");

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
    
    const existingUser = await User.findOne({ email });
    if (existingUser) 
      return res.status(400).json({ message: "User already exists" });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      role
    });

    await newAdmin.save();
    res.status(201).json({ message: `${role} created successfully`, user: newAdmin });
  } catch (error) {
    res.status(500).json({ message: "Error creating admin", error: error.message });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const admin = await User.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Admin deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting admin" });
  }
};