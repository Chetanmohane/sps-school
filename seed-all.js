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

const connectDB = async () => {
  try {
    const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/sps_school';
    await mongoose.connect(dbUrl);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const clearData = async () => {
  console.log('Clearing old dummy data...');
  // Delete all users except admins
  await User.deleteMany({ role: { $in: ['student', 'teacher'] } });
  
  await Student.deleteMany();
  await Teacher.deleteMany();
  await Class.deleteMany();
  await Subject.deleteMany();
  await Fee.deleteMany();
  await Exam.deleteMany();
  await Assignment.deleteMany();
  await Attendance.deleteMany();
  await Event.deleteMany();
};

const seedData = async () => {
  await connectDB();
  await clearData();
  
  console.log('Generating Subjects...');
  const subjects = await Subject.insertMany([
    { name: 'Mathematics', code: 'MATH101', credits: 3 },
    { name: 'Science', code: 'SCI101', credits: 3 },
    { name: 'English', code: 'ENG101', credits: 2 },
    { name: 'History', code: 'HIST101', credits: 2 }
  ]);

  console.log('Generating Teachers...');
  const defaultPassword = await bcrypt.hash('Password@123', 10);
  
  const teachers = [];
  for (let i = 1; i <= 4; i++) {
    const user = await User.create({
      name: `Teacher ${i}`,
      email: `teacher${i}@sps.edu`,
      password: defaultPassword,
      phone: `+91999999000${i}`,
      role: 'teacher'
    });
    const teacher = await Teacher.create({
      user: user._id,
      specialization: subjects[i-1].name,
      department: i % 2 === 0 ? 'Science' : 'Arts',
      subjects: [subjects[i-1]._id],
      designation: 'Senior Teacher',
      joiningDate: new Date('2020-01-15')
    });
    teachers.push(teacher);
  }

  console.log('Generating Classes...');
  const classes = [];
  for (let c of ['8', '9', '10']) {
    for (let s of ['A', 'B']) {
      const classTeacher = teachers[Math.floor(Math.random() * teachers.length)];
      const cls = await Class.create({
        className: c,
        section: s,
        academicYear: '2025-2026',
        classTeacher: classTeacher._id,
        subjects: subjects.map(sub => sub._id),
        startTime: '08:00',
        endTime: '14:00',
        capacity: 40
      });
      classes.push(cls);
    }
  }

  console.log('Generating Students & Related Data...');
  const students = [];
  for (let cls of classes) {
    for (let i = 1; i <= 5; i++) {
      const user = await User.create({
        name: `Student ${cls.className}${cls.section}-${i}`,
        email: `student${cls.className}${cls.section}${i}@sps.edu`,
        password: defaultPassword,
        phone: `+9188888${cls.className.padStart(2, '0')}00${i}`,
        role: 'student'
      });
      const student = await Student.create({
        user: user._id,
        className: cls.className,
        section: cls.section,
        rollNumber: `R${cls.className}${cls.section}${i.toString().padStart(2, '0')}`,
        dob: new Date('2010-05-15')
      });
      students.push(student);

      // Generate Fees
      await Fee.create({
        studentId: student._id,
        amount: 25000,
        status: i % 2 === 0 ? 'Paid' : 'Pending',
        dueDate: new Date('2026-07-01'),
        paymentDate: i % 2 === 0 ? new Date('2026-06-15') : null
      });

      // Generate Attendance (Last 5 days)
      const today = new Date();
      for (let d = 1; d <= 5; d++) {
        const attDate = new Date(today);
        attDate.setDate(today.getDate() - d);
        await Attendance.create({
          student: student._id,
          date: attDate,
          status: Math.random() > 0.15 ? 'Present' : 'Absent' // 85% attendance
        });
      }
    }
  }

  console.log('Generating Exams...');
  await Exam.insertMany([
    { title: 'Mid Term Mathematics', date: new Date('2026-09-15'), className: '10', subject: 'Mathematics' },
    { title: 'Final Term Science', date: new Date('2027-03-20'), className: '9', subject: 'Science' }
  ]);

  console.log('Generating Assignments...');
  await Assignment.insertMany([
    { teacher: teachers[0].user, className: '10', section: 'A', title: 'Algebra Worksheet', dueDate: new Date('2026-07-10'), instructions: 'Complete exercises 1 to 15 on page 42.' },
    { teacher: teachers[1].user, className: '9', section: 'B', title: 'Physics Lab Report', dueDate: new Date('2026-07-12'), instructions: 'Submit the pendulum experiment report.' }
  ]);

  console.log('Generating Events...');
  await Event.insertMany([
    {
      title: "Annual Sports Day",
      date: new Date("2026-11-20"),
      description: "Inter-house sports competitions.",
      type: "sports"
    },
    {
      title: "Science Fair",
      date: new Date("2026-10-15"),
      description: "Science exhibition for classes 8 to 12.",
      type: "academic"
    }
  ]);

  console.log('✅ Dummy data successfully seeded! You can login with:');
  console.log('Teacher: teacher1@sps.edu / Password@123');
  console.log('Student: student8A1@sps.edu / Password@123');
  
  process.exit(0);
};

seedData();
