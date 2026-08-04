const Student = require("../models/Student");
const User = require('../models/User');

exports.getStudent = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const profile = await Student.findOne({ user: user._id })
      .populate('user', 'name email phone');
  
    if (!profile) {
      return res.status(200).json({
        _id: user._id,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone || 'N/A'
        },
        className: user.role && user.role.includes('admin') ? 'Administration' : '10',
        section: user.role && user.role.includes('admin') ? 'Staff' : 'A',
        rollNumber: user.role && user.role.includes('admin') ? 'ADM-01' : 'STU-1001',
        dob: new Date('2010-01-01'),
        parentName: 'Parent Guardian',
        address: 'School Residential Campus'
      });
    }
    res.status(200).json(profile);

  } catch (error) {
    console.error("Fetch Profile Error:", error.message);
    res.status(500).json({ message: "Server Error: " + error.message });
  }
};

exports.updateStudentProfile = async (req, res) => {
  try {
    const { email } = req.params;
    const { phone, address, parentName, parentPhone, bloodGroup, dob, gender, profileImage } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (phone) {
      user.phone = phone;
      await user.save();
    }

    let profile = await Student.findOne({ user: user._id });
    if (!profile) {
      profile = new Student({
        user: user._id,
        className: "10",
        section: "A",
        rollNumber: `STU-${Date.now().toString().slice(-4)}`
      });
    }

    if (address !== undefined) profile.address = address;
    if (parentName !== undefined) profile.parentName = parentName;
    if (parentPhone !== undefined) profile.parentPhone = parentPhone;
    if (bloodGroup !== undefined) profile.bloodGroup = bloodGroup;
    if (gender !== undefined) profile.gender = gender;
    if (profileImage !== undefined) profile.profileImage = profileImage;
    if (dob) profile.dob = new Date(dob);

    await profile.save();
    const updatedProfile = await Student.findById(profile._id).populate('user', 'name email phone');

    res.status(200).json({
      message: "Profile updated successfully!",
      profile: updatedProfile || {
        _id: user._id,
        user: { _id: user._id, name: user.name, email: user.email, phone: user.phone },
        className: profile.className,
        section: profile.section,
        rollNumber: profile.rollNumber,
        address: profile.address,
        parentName: profile.parentName,
        parentPhone: profile.parentPhone,
        bloodGroup: profile.bloodGroup,
        gender: profile.gender,
        dob: profile.dob
      }
    });
  } catch (error) {
    console.error("Update Profile Error:", error.message);
    res.status(500).json({ message: "Error updating profile: " + error.message });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate("user", "name"); 
    res.json(students);
  } catch (err) {
    res.status(500).send("Error fetching students");
  }
};