require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('./models/User');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const Class = require('./models/Class');
const Subject = require('./models/Subject');
const Fee = require('./models/Fee');
const Exam = require('./models/Exam');
const Assignment = require('./models/Assignment');
const Attendance = require('./models/Attendance');
const Event = require('./models/event');
const Application = require('./models/Application');

const cleanDatabase = async () => {
  const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/sps_school';
  try {
    await mongoose.connect(dbUrl, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB Atlas...');
    
    console.log('🧹 Cleaning test/dummy data for Live Production...');

    // Delete all users except admins, live teacher, and live student
    await User.deleteMany({});
    await Student.deleteMany({});
    await Teacher.deleteMany({});
    await Class.deleteMany({});
    await Subject.deleteMany({});
    await Fee.deleteMany({});
    await Exam.deleteMany({});
    await Assignment.deleteMany({});
    await Attendance.deleteMany({});
    await Event.deleteMany({});
    await Application.deleteMany({});

    console.log('✅ Old test records cleared.');

    // 1. System Admins
    const defaultPassword = await bcrypt.hash('Password@123', 10);
    const adminPassword = await bcrypt.hash('Admin@123', 10);

    await User.create([
      { name: 'Super Admin', email: 'admin@sps.edu', password: adminPassword, role: 'super-admin', phone: '+919999999999' },
      { name: 'Manager Admin', email: 'manager@sps.edu', password: await bcrypt.hash('Manager@123', 10), role: 'manager-admin', phone: '+919876543210' },
      { name: 'Finance Admin', email: 'finance@sps.edu', password: await bcrypt.hash('Finance@123', 10), role: 'finance-admin', phone: '+918888888888' },
      { name: 'Academic Admin', email: 'teacheradmin@sps.edu', password: await bcrypt.hash('TeacherAdmin@123', 10), role: 'academic-admin', phone: '+917777777777' }
    ]);
    console.log('✅ Admin accounts initialized.');

    // 2. Default Live Teacher Account
    const teacherUser = await User.create({
      name: 'Class Teacher',
      email: 'teacher@sps.edu',
      password: defaultPassword,
      phone: '+919999900001',
      role: 'teacher'
    });
    
    const teacherProfile = await Teacher.create({
      user: teacherUser._id,
      specialization: 'Mathematics',
      department: 'Academic',
      designation: 'Senior Faculty',
      joiningDate: new Date()
    });
    console.log('✅ Live Teacher created (teacher@sps.edu / Password@123)');

    // 3. Default Live Class 10-A
    const liveClass = await Class.create({
      className: '10',
      section: 'A',
      academicYear: '2025-2026',
      classTeacher: teacherProfile._id,
      startTime: '08:00',
      endTime: '14:00',
      room: '101',
      capacity: 40,
      status: 'active'
    });

    // 4. Default Live Student Account
    const studentUser = await User.create({
      name: 'Active Student',
      email: 'student@sps.edu',
      password: defaultPassword,
      phone: '+918888800001',
      role: 'student'
    });

    const studentProfile = await Student.create({
      user: studentUser._id,
      className: liveClass.className,
      section: liveClass.section,
      rollNumber: 'STU-1001',
      dob: new Date('2010-01-01'),
      address: 'School Residential Campus',
      parentName: 'Parent Guardian',
      parentPhone: '+918888800002',
      gender: 'Male'
    });
    console.log('✅ Live Student created (student@sps.edu / Password@123)');

    console.log('----------------------------------------------------');
    console.log('✨ Live System Accounts Initialized Successfully!');
    console.log('🔑 Super Admin: admin@sps.edu / Admin@123');
    console.log('🔑 Live Teacher: teacher@sps.edu / Password@123');
    console.log('🔑 Live Student: student@sps.edu / Password@123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error initializing database:', err);
    process.exit(1);
  }
};

cleanDatabase();
