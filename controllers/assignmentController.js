const Assignment = require("../models/Assignment");
const User = require("../models/User");
const Student = require("../models/Student");
const Submission = require("../models/Submission");
const { notifyChange } = require("../config/socket");

exports.createAssignment = async (req, res) => {
   try {
        const { title, className, section, dueDate, instructions, userEmail } = req.body;
        
        let teacher = null;
        if (userEmail) {
          teacher = await User.findOne({ 
            email: new RegExp(`^${userEmail.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, "i") 
          });
        }
        if (!teacher && req.user?.id) {
          teacher = await User.findById(req.user.id);
        }
        if (!teacher) return res.status(404).json({ message: "Teacher or Admin user profile not found. Please log in again." });
        
        const givenByStr = `${teacher.name || 'Faculty'} (${(teacher.role || 'Teacher').replace('-', ' ').toUpperCase()})`;
        
        const newAssignment = new Assignment({
            teacher: teacher._id,
            className,
            section,
            title,
            dueDate,
            instructions,
            givenBy: givenByStr
        });

        await newAssignment.save();
        notifyChange("ASSIGNMENT_CHANGED", { action: "create", assignment: newAssignment });
        res.status(201).json({ message: "Assignment created successfully!", data: newAssignment });
    } catch (error) {
        console.error("Create Assignment Error:", error);
        res.status(500).json({ message: error.message });
    }
};

exports.getAssignments = async (req, res) => {
  try {
    const role = (req.user?.role || '').toLowerCase();
    const { email } = req.query;

    let user = null;
    if (email) {
      user = await User.findOne({ 
        email: new RegExp(`^${email.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, "i") 
      });
    }
    if (!user && req.user?.id) {
      user = await User.findById(req.user.id);
    }
    if (!user) return res.status(404).json({ message: "User profile not found." });

    let filter = {};

    if (role === "student") {
      const student = await Student.findOne({ user: user._id });
      if (student && student.className) {
        const classNum = student.className.replace(/class/i, '').replace(/th|rd|nd|st/i, '').trim();
        const regexPattern = new RegExp(`^(${student.className}|Class\\s*${classNum}|${classNum}th|${classNum}rd|${classNum}nd|${classNum}st)$`, 'i');
        filter = { 
          className: { $regex: regexPattern },
          section: student.section 
        };
      }
    } else if (role === "teacher") {
      // Find assignments created by this teacher or all assignments if none found
      const teacherCount = await Assignment.countDocuments({ teacher: user._id });
      if (teacherCount > 0) {
        filter = { teacher: user._id };
      }
    }
    // For admin / super-admin or fallback, filter is {} (returns all assignments)

    const assignments = await Assignment.find(filter).populate("teacher", "name email role").sort({ createdAt: -1 });
    res.json(assignments);
  } catch (error) {
    console.error("Get Assignments Error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.submitAssignment = async (req, res) => {
 try {
        const { assignment, answer, fileUrl, userEmail } = req.body;

        // Try finding user by email first, fallback to token user id
        let user = null;
        if (userEmail) {
          user = await User.findOne({ email: userEmail });
        }
        if (!user && req.user?.id) {
          user = await User.findById(req.user.id);
        }
        if (!user) return res.status(404).json({ message: "User not found. Please log out and log in again." });

        // Find student profile - try by user._id, or fallback search by className/section
        let student = await Student.findOne({ user: user._id });
        if (!student) {
          // Try finding student by name or email match
          student = await Student.findOne({ 
            $or: [
              { email: user.email },
              { name: new RegExp(`^${user.name}$`, 'i') }
            ]
          });
          if (student && !student.user) {
            student.user = user._id;
            await student.save();
          }
        }
        if (!student) return res.status(404).json({ message: "Student profile not found. Contact your admin to link your account." });
        
        // Prevent duplicate submissions
        const alreadySubmitted = await Submission.findOne({ assignment, student: student._id });
        if (alreadySubmitted) {
          return res.status(400).json({ message: "You have already submitted this assignment." });
        }

        // Create new submission
        const newSubmission = new Submission({
            assignment: assignment,
            student: student._id,
            answer,
            fileUrl: fileUrl || '',
            status: "Submitted"
        });

        await newSubmission.save();
        notifyChange("ASSIGNMENT_CHANGED", { action: "submit", submission: newSubmission });
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
    const { marks, remarks, userEmail } = req.body;

    let gradedBy = '';
    if (req.user?.id) {
      const u = await User.findById(req.user.id);
      if (u) {
        gradedBy = `${u.name} (${(u.role || 'Teacher').replace('-', ' ').toUpperCase()})`;
      }
    }
    if (!gradedBy && userEmail) {
      const u = await User.findOne({ email: userEmail });
      if (u) {
        gradedBy = `${u.name} (${(u.role || 'Teacher').replace('-', ' ').toUpperCase()})`;
      }
    }

    const updatedSubmission = await Submission.findByIdAndUpdate(
      submissionId,
      { 
        marks: marks,
        remarks: remarks || "Good effort!",
        gradedBy: gradedBy || "Faculty Evaluator",
        status: "Graded" 
      },
      { new: true }
    );

    if (!updatedSubmission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    notifyChange("ASSIGNMENT_CHANGED", { action: "grade", submission: updatedSubmission });
    res.json(updatedSubmission);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findByIdAndDelete(id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    await Submission.deleteMany({ assignment: id });
    notifyChange("ASSIGNMENT_CHANGED", { action: "delete", id });
    res.json({ message: "Assignment deleted successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};