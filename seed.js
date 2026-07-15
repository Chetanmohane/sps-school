const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/sps_school').then(async () => {
  try {
    // Delete existing admins to avoid duplication
    await User.deleteMany({ email: { $in: ['admin@sps.edu', 'finance@sps.edu', 'teacheradmin@sps.edu'] } });

    // Super Admin
    const superAdminPassword = await bcrypt.hash('Admin@123', 10);
    const superAdmin = new User({
      name: 'Super Admin',
      email: 'admin@sps.edu',
      password: superAdminPassword,
      phone: '+919999999999',
      role: 'super-admin'
    });
    await superAdmin.save();
    console.log('✅ Super Admin created successfully!');

    // Finance Admin
    const financePassword = await bcrypt.hash('Finance@123', 10);
    const financeAdmin = new User({
      name: 'Finance Admin',
      email: 'finance@sps.edu',
      password: financePassword,
      phone: '+918888888888',
      role: 'finance-admin'
    });
    await financeAdmin.save();
    console.log('✅ Finance Admin created successfully!');

    // Academic Admin
    const academicPassword = await bcrypt.hash('Teacher@123', 10);
    const academicAdmin = new User({
      name: 'Academic Admin',
      email: 'teacheradmin@sps.edu',
      password: academicPassword,
      phone: '+917777777777',
      role: 'academic-admin'
    });
    await academicAdmin.save();
    console.log('✅ Academic Admin created successfully!');

  } catch (err) {
    console.error('❌ Error seeding database:', err);
  }
  process.exit(0);
});
