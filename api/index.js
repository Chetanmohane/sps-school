const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("../config/db");

dotenv.config();
const app = express();

console.log("✅ API Serverless Handler initialized...");

const allowedOrigins = [
  "https://sps-school-frontend.onrender.com",
  "https://sps-school.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5000",
  "http://localhost:5001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:5000"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      origin.includes("vercel.app") ||
      origin.includes("onrender.com")
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  }, 
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
connectDB();

app.use("/api/auth", require("../routes/authRoutes"));
app.use("/api/teacher", require("../routes/teacherRoutes"));
app.use("/api/student", require("../routes/studentRoutes"));
app.use("/api/attendance", require("../routes/attendanceRoutes"));
app.use("/api/assignment", require("../routes/assignmentRoutes"));
app.use("/api/application", require("../routes/applicationRoutes"));
app.use("/api/finance", require("../routes/financeRoutes"));
app.use("/api/events", require("../routes/eventRoutes"));
app.use("/api/super-admin", require("../routes/superAdminRoutes"));
app.use("/api/admin", require("../routes/adminRoutes"));
app.use("/api/academic-admin", require("../routes/academicAdminRoutes"));
app.use("/api/exams", require("../routes/examRoutes"));
app.use("/api/notifications", require("../routes/notificationRoutes"));
app.use("/api/timetable", require("../routes/timetableRoutes"));

module.exports = app;
