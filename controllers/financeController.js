const Fee = require("../models/Fee");
const User = require("../models/User");
const Student = require("../models/Student");

exports.createFee = async (req, res) => {
  try {
    const { studentId, amount, dueDate } = req.body;
    const fee = new Fee({
      studentId,
      amount,
      dueDate
    });

    await fee.save();
    res.status(201).json({ message: "Fee created", fee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllFees = async (req, res) => {
  try {
    const fees = await Fee.find()
      .populate({
        path: "studentId", 
        select: "rollNumber", 
        populate: {
          path: "user", 
          select: "name"
        }
      });
    res.json(fees);
  } 
  catch (err) {
    console.error("Error fetching fees:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

exports.getMyFees = async (req, res) => {
  try {
    const { email } = req.query;
    const user = await User.findOne({ email: email });
    if (!user) return res.status(404).json({ message: "User not found" });
    
    const student = await Student.findOne({ user: user._id });
    if (!student) return res.status(404).json({ message: "Student profile record not found" });

    const fees = await Fee.find({ studentId: student._id });
    res.json(fees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.payFee = async (req, res) => {
  try {
    const { feeId } = req.params;
    const fee = await Fee.findByIdAndUpdate(feeId,
      {
        status: "Paid",
        paymentDate: new Date()
      },
      { new: true }
    );

    res.json({ message: "Fee paid", fee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateFee = async (req, res) => {
  try {
    const { feeId } = req.params;
    const updatedFee = await Fee.findByIdAndUpdate(
      feeId,
      req.body,
      { new: true }
    );

    if (!updatedFee) {
      return res.status(404).json({ message: "Fee not found" });
    }
    res.json({message: "Fee updated successfully", fee: updatedFee});
  } 
  catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteFee = async (req, res) => {
  try {
    const { feeId } = req.params;
    const fee = await Fee.findByIdAndDelete(feeId);

    if (!fee) {
      return res.status(404).json({ message: "Fee not found" });
    }
    res.json({ message: "Fee deleted successfully" });
  } 
  catch (error) {
    res.status(500).json({ error: error.message });
  }
};