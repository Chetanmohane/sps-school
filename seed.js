const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const runSeed = async () => {
  const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/sps_school';
  try {
    await mongoose.connect(dbUrl, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to Atlas MongoDB for seeding.');
  } catch (err) {
    console.warn('⚠️ Atlas connection failed, connecting to Local MongoDB...');
    try {
      await mongoose.connect('mongodb://127.0.0.1:27017/sps_school', { serverSelectionTimeoutMS: 5000 });
      console.log('✅ Connected to Local MongoDB for seeding.');
    } catch (localErr) {
      console.error('❌ Could not connect to any MongoDB instance:', localErr.message);
      process.exit(1);
    }
  }

  try {
    // Delete existing users and any student-admin / admission-desk users
    const emailsToSeed = [
      'admin@sps.edu',
      'manager@sps.edu',
      'finance@sps.edu',
      'teacheradmin@sps.edu',
      'studentadmin@sps.edu',
      'classteacher@sps.edu',
      'teacher1@sps.edu',
      'admissiondesk@sps.edu',
      'student8a1@sps.edu'
    ];
    await User.deleteMany({ 
      $or: [
        { email: { $in: emailsToSeed } },
        { role: { $in: ['student-admin', 'admission-desk'] } }
      ]
    });

    // 1. Super Admin
    const superAdminPassword = await bcrypt.hash('Admin@123', 10);
    await new User({
      name: 'Super Admin',
      email: 'admin@sps.edu',
      password: superAdminPassword,
      phone: '+919999999999',
      role: 'super-admin'
    }).save();
    console.log('✅ 1. Super Admin created (admin@sps.edu / Admin@123)');

    // 2. Manager
    const managerPassword = await bcrypt.hash('Manager@123', 10);
    await new User({
      name: 'Manager Admin',
      email: 'manager@sps.edu',
      password: managerPassword,
      phone: '+919876543210',
      role: 'manager-admin'
    }).save();
    console.log('✅ 2. Manager created (manager@sps.edu / Manager@123)');

    // 3. Finance Admin
    const financePassword = await bcrypt.hash('Finance@123', 10);
    await new User({
      name: 'Finance Admin',
      email: 'finance@sps.edu',
      password: financePassword,
      phone: '+918888888888',
      role: 'finance-admin'
    }).save();
    console.log('✅ 3. Finance Admin created (finance@sps.edu / Finance@123)');

    // 4. Teacher & Student Admin (Unified Academic Admin)
    const teacherAdminPassword = await bcrypt.hash('TeacherAdmin@123', 10);
    await new User({
      name: 'Teacher Admin',
      email: 'teacheradmin@sps.edu',
      password: teacherAdminPassword,
      phone: '+917777777777',
      role: 'academic-admin'
    }).save();
    console.log('✅ 4. Teacher Admin created (teacheradmin@sps.edu / TeacherAdmin@123)');

    // 5. Class Teacher Portal
    const classTeacherPassword = await bcrypt.hash('Teacher@123', 10);
    const classTeacherUser = await new User({
      name: 'Class Teacher In-Charge',
      email: 'classteacher@sps.edu',
      password: classTeacherPassword,
      phone: '+919999900001',
      role: 'teacher'
    }).save();

    const Teacher = require('./models/Teacher');
    const Class = require('./models/Class');

    const teacherProfile = await Teacher.create({
      user: classTeacherUser._id,
      specialization: 'Mathematics & Class In-Charge',
      department: 'Academic',
      designation: 'Class Teacher In-Charge',
      experience: 5
    });

    await Class.findOneAndUpdate(
      { className: '10', section: 'A' },
      {
        className: '10',
        section: 'A',
        academicYear: '2025-2026',
        classTeacher: teacherProfile._id,
        startTime: '08:45',
        endTime: '13:50',
        room: '204',
        capacity: 40,
        status: 'active'
      },
      { upsert: true, new: true }
    );
    console.log('✅ 5. Class Teacher created (classteacher@sps.edu / Teacher@123) & assigned to Class 10-A');

    // 6. Subject Teacher
    const subjectTeacherPassword = await bcrypt.hash('Password@123', 10);
    const subjectTeacherUser = await new User({
      name: 'Subject Teacher',
      email: 'teacher1@sps.edu',
      password: subjectTeacherPassword,
      phone: '+919999900002',
      role: 'teacher'
    }).save();
    
    await Teacher.create({
      user: subjectTeacherUser._id,
      specialization: 'Science & Physics',
      department: 'Science',
      designation: 'Subject Instructor',
      experience: 4
    });
    console.log('✅ 6. Subject Teacher created (teacher1@sps.edu / Password@123)');

    // 7. Student / Parent Portal
    const studentPassword = await bcrypt.hash('Password@123', 10);
    await new User({
      name: 'Student 8A1',
      email: 'student8a1@sps.edu',
      password: studentPassword,
      phone: '+918888808001',
      role: 'student'
    }).save();
    console.log('✅ 7. Student / Parent created (student8a1@sps.edu / Password@123)');

  } catch (err) {
    console.error('❌ Error seeding database:', err);
  }
  process.exit(0);
};

runSeed();
