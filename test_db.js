const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Student = require('./models/Student');
const Application = require('./models/Application');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/school-erp')
.then(async () => {
  const apps = await Application.find({ type: "Admission" }).sort({createdAt: -1}).limit(2).populate({
    path: 'student', populate: { path: 'user' }
  });
  console.log("=== RECENT APPLICATIONS ===");
  console.log(JSON.stringify(apps, null, 2));
  
  const users = await User.find({ role: 'student' }).sort({createdAt: -1}).limit(2);
  console.log("=== RECENT USERS ===");
  console.log(JSON.stringify(users, null, 2));

  process.exit();
}).catch(console.error);
