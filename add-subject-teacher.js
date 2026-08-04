require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Teacher = require('./models/Teacher');

const addSubjectTeacher = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log('Connected to Atlas...');

    const email = 'teacher1@sps.edu';
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Subject Teacher already exists.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('Password@123', 10);
    const user = await User.create({
      name: 'Subject Teacher',
      email: email,
      phone: '+919999900002',
      password: hashedPassword,
      role: 'teacher'
    });

    await Teacher.create({
      user: user._id,
      specialization: 'Science',
      department: 'Science',
      designation: 'Subject Teacher',
      joiningDate: new Date()
    });

    console.log('✅ Subject Teacher created successfully (teacher1@sps.edu / Password@123)');
    process.exit(0);
  } catch (error) {
    console.error('Error adding subject teacher:', error);
    process.exit(1);
  }
};

addSubjectTeacher();
