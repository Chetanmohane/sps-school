const mongoose = require("mongoose");

const connectDB = async () => {
  const maxRetries = 5;
  const retryDelay = 3000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(process.env.DB_URL, {
        serverSelectionTimeoutMS: 15000
      });
      console.log("✅ Database connected successfully (Atlas)");
      return;
    } catch (error) {
      console.warn(`⚠️ Atlas attempt ${attempt}/${maxRetries} failed:`, error.message);
      if (attempt < maxRetries) {
        console.log(`🔄 Retrying in ${retryDelay / 1000}s...`);
        await new Promise(res => setTimeout(res, retryDelay));
      }
    }
  }

  // Fallback to Local MongoDB
  console.warn("⚠️ All Atlas attempts failed. Trying Local MongoDB...");
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/sps_school', {
      serverSelectionTimeoutMS: 3000
    });
    console.log("✅ Database connected successfully (Local MongoDB)");
  } catch (localErr) {
    console.error("⚠️ Local DB Error:", localErr.message);
    console.log("ℹ️ Server is running, but database features will be unavailable until DB connection is established.");
  }
};

module.exports = connectDB;