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
app.use(cors({
  origin: ["https://sps-school-frontend.onrender.com", "http://localhost:3000"], 
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
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

// Serve React static files
app.use(express.static(path.join(__dirname, "build")));

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
  console.log(`Server running on port ${PORT} with Real-Time Socket.IO ⚡`);
});