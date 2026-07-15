const Assignment = require("../models/Assignment");
const User = require("../models/User");
const Student = require("../models/Student");
const Submission = require("../models/Submission");

exports.createAssignment = async (req, res) => {
   try {
        const { title, className, section, dueDate, instructions, userEmail } = req.body;
        const teacher = await User.findOne({ email: userEmail });
        if (!teacher) return res.status(404).json({ message: "Teacher not found" });
        
        const newAssignment = new Assignment({
            teacher: teacher._id,
            className,
            section,
            title,
            dueDate,
            instructions 
        });

        await newAssignment.save();
        res.status(201).json({ message: "Assignment created successfully!", data: newAssignment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAssignments = async (req, res) => {
  try {
    const { role } = req.user;
    const { email } = req.query;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    let filter = {};

    if (role === "student") {
      const student = await Student.findOne({ user: user._id });
      if (!student) {
        return res.status(404).json({ message: "Student profile not found" });
      }

      filter = { 
        className: student.className, 
        section: student.section 
      };
    }
    else if (role === "teacher")
    {
      filter = { teacher: user._id };
    }  
    const assignments = await Assignment.find(filter).sort({ createdAt: 1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.submitAssignment = async (req, res) => {
 try {
        const { assignment, answer, fileUrl, userEmail } = req.body;

        const user = await User.findOne({ email: userEmail });
        if (!user) return res.status(404).json({ message: "User not found" });

        const student = await Student.findOne({ user: user._id });
        if (!student) return res.status(404).json({ message: "Student profile record not found" });
        
        // 2. Prevent duplicate submissions
        const alreadySubmitted = await Submission.findOne({ assignment, student: student._id });
        if (alreadySubmitted) {
          return res.status(400).json({ message: "You have already submitted this assignment." });
        }

        // 3. Create new submission
        const newSubmission = new Submission({
            assignment: assignment,
            student: student._id,
            answer,
            fileUrl,
            status: "Submitted"
        });

        await newSubmission.save();
        res.status(201).json({ message: "Assignment submitted successfully!" });
    } catch (error) {
        console.error("Submission Error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.getMySubmissions = async (req, res) => {
    try {
        const { email } = req.query;
        const user = await User.findOne({ email });
        const student = await Student.findOne({ user: user._id });
        
        // Find all submissions by this student and populate assignment details
        const submissions = await Submission.find({ student: student._id }).populate('assignment');
        res.status(200).json(submissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAssignmentSubmissions = async (req, res) => {
  try {
    const { asgId } = req.query;
    const submissions = await Submission.find({ assignment: asgId })
    .populate({ path: 'student', select: 'rollNumber', 
      populate: { path: 'user', select: 'name email' 
      }
    })
    .sort({ createdAt: 1 }); 

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateMarks = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { marks } = req.body;

    const updatedSubmission = await Submission.findByIdAndUpdate(
      submissionId,
      { 
        marks: marks,
        status: "Graded" 
      },
      { new: true }
    );

    if (!updatedSubmission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.json(updatedSubmission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};