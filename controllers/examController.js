const Exam = require("../models/Exam");
const { notifyChange } = require("../config/socket");

exports.createExam = async (req, res) => {
  try {
    const { title, date, startTime, endTime, roomNumber, maxMarks, className, subject } = req.body;
    const newExam = new Exam({ 
      title, 
      date, 
      startTime: startTime || "10:00 AM", 
      endTime: endTime || "01:00 PM", 
      roomNumber: roomNumber || "Hall-1", 
      maxMarks: maxMarks ? Number(maxMarks) : 100, 
      className, 
      subject 
    });
    await newExam.save();
    notifyChange("EXAM_CHANGED", { action: "create", exam: newExam });
    res.status(201).json({ success: true, message: "Exam created successfully", exam: newExam });
  } catch (error) {
    res.status(500).json({ message: "Error creating exam", error: error.message });
  }
};

exports.getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find().sort({ date: 1 });
    res.status(200).json({ success: true, exams });
  } catch (error) {
    res.status(500).json({ message: "Error fetching exams", error: error.message });
  }
};

exports.deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    await Exam.findByIdAndDelete(id);
    notifyChange("EXAM_CHANGED", { action: "delete", id });
    res.status(200).json({ success: true, message: "Exam deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting exam", error: error.message });
  }
};
