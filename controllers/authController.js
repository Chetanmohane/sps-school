const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.login = async (req, res) => {
 try {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(400).json({ message: "Wrong password" });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.json({
    token,
    role: user.role,
    name: user.name,
    email: user.email
  });
 } 
 catch (error) {
    res.status(500).json({ message: "Server error during login" });
  }
};

exports.simplePasswordReset = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email address" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: "Password updated successfully! Redirecting to login..." 
    });

  } catch (error) {
    console.error("Reset Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.updateUsername = async (req, res) => {
  try {
    const { email, newName } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email address" });
    }
   
    user.name = newName;
    await user.save();
 

    res.status(200).json({ 
      success: true, 
      message: "Username updated successfully!",
    });

  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};