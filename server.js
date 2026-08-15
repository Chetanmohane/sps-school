const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const dns = require("dns");
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder("ipv4first");
}
const connectDB = require("./config/db");

dotenv.config();
const app = express();
console.log("✅ Event routes loaded...");
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

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
connectDB();



app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/teacher", require("./routes/teacherRoutes"));
app.use("/api/student", require("./routes/studentRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/assignment", require("./routes/assignmentRoutes"));
app.use("/api/application", require("./routes/applicationRoutes"));
app.use("/api/finance", require("./routes/financeRoutes"));
app.use("/api/events", require("./routes/eventRoutes"));
app.use("/api/super-admin", require("./routes/superAdminRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));                //for student-admin 
app.use("/api/academic-admin", require("./routes/academicAdminRoutes"));
app.use("/api/exams", require("./routes/examRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/timetable", require("./routes/timetableRoutes"));

// Serve React static files with strict no-cache headers so browser always loads fresh JS/CSS
app.use(express.static(path.join(__dirname, "build"), {
  etag: false,
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
}));

// Fallback all non-API GET requests to serve React's index.html
app.get(/(.*)/, (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const http = require("http");
const { initSocket } = require("./config/socket");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} with Real-Time Socket.IO ⚡`);
});