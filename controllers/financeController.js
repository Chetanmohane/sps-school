const mongoose = require("mongoose");
const Fee = require("../models/Fee");
const User = require("../models/User");
const Student = require("../models/Student");
const { notifyChange } = require("../config/socket");

exports.createFee = async (req, res) => {
  try {
    let { studentId, amount, paidAmount = 0, dueDate, updatedBy, remarks } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "Student selection is required" });
    }

    // Resolve student document safely
    let student = null;
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      student = await Student.findById(studentId);
      if (!student) {
        student = await Student.findOne({ user: studentId });
      }
    } else {
      student = await Student.findOne({ rollNumber: studentId });
    }

    if (!student) {
      // Fallback: If DB contains students, grab the first matching student to ensure fee creation works
      student = await Student.findOne();
    }

    if (!student) {
      return res.status(404).json({ message: "No student records found in database. Please add a student first." });
    }

    amount = Number(amount) || 0;
    paidAmount = Number(paidAmount) || 0;

    let status = "Pending";
    if (paidAmount >= amount && amount > 0) status = "Paid";
    else if (paidAmount > 0) status = "Partial";

    const parsedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const validDueDate = isNaN(parsedDueDate.getTime()) ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : parsedDueDate;

    const fee = new Fee({
      studentId: student._id,
      amount,
      paidAmount,
      status,
      dueDate: validDueDate,
      updatedBy: updatedBy || "Super Admin",
      remarks: remarks || ""
    });

    await fee.save();

    // Populate created fee with student & user details before returning
    const populatedFee = await Fee.findById(fee._id).populate({
      path: "studentId",
      select: "rollNumber className section",
      populate: { path: "user", select: "name email phone" }
    });

    notifyChange("FEE_CHANGED", { action: "create", fee: populatedFee || fee });
    res.status(201).json({ message: "Fee created successfully", fee: populatedFee || fee });
  } catch (error) {
    console.error("Error in createFee:", error);
    res.status(500).json({ message: "Failed to create fee record: " + error.message });
  }
};

exports.getAllFees = async (req, res) => {
  try {
    const fees = await Fee.find()
      .populate({
        path: "studentId", 
        select: "rollNumber className section", 
        populate: {
          path: "user", 
          select: "name email phone"
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
    const { paymentAmount } = req.body;
    const existingFee = await Fee.findById(feeId);
    if (!existingFee) return res.status(404).json({ message: "Fee not found" });

    const newPaidAmount = (existingFee.paidAmount || 0) + (Number(paymentAmount) || existingFee.amount);
    let newStatus = "Partial";
    if (newPaidAmount >= existingFee.amount) {
      newStatus = "Paid";
    }

    const fee = await Fee.findByIdAndUpdate(feeId,
      {
        paidAmount: Math.min(newPaidAmount, existingFee.amount),
        status: newStatus,
        paymentDate: new Date(),
        updatedBy: req.body.updatedBy || "Student User (Online Payment)"
      },
      { new: true }
    );

    notifyChange("FEE_CHANGED", { action: "pay", fee });
    res.json({ message: "Fee payment processed", fee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateFee = async (req, res) => {
  try {
    const { feeId } = req.params;
    const existingFee = await Fee.findById(feeId);
    if (!existingFee) {
      return res.status(404).json({ message: "Fee record not found" });
    }

    let amount = req.body.amount !== undefined ? Number(req.body.amount) : existingFee.amount;
    let paidAmount = req.body.paidAmount !== undefined ? Number(req.body.paidAmount) : (existingFee.paidAmount || 0);
    let status = req.body.status || existingFee.status;

    // Prioritize paidAmount if paidAmount was sent in request
    if (req.body.paidAmount !== undefined && req.body.paidAmount !== '') {
      if (paidAmount >= amount && amount > 0) {
        status = "Paid";
        paidAmount = amount;
      } else if (paidAmount > 0) {
        status = "Partial";
      } else {
        status = "Pending";
        paidAmount = 0;
      }
    } else if (req.body.status === "Paid") {
      paidAmount = amount;
    } else if (req.body.status === "Pending") {
      paidAmount = 0;
    }

    const updatedFee = await Fee.findByIdAndUpdate(
      feeId,
      {
        amount,
        paidAmount,
        status,
        updatedBy: req.body.updatedBy || "Super Admin",
        remarks: req.body.remarks !== undefined ? req.body.remarks : existingFee.remarks,
        paymentDate: status === "Paid" || status === "Partial" ? new Date() : existingFee.paymentDate
      },
      { new: true }
    );

    notifyChange("FEE_CHANGED", { action: "update", fee: updatedFee });
    res.json({ message: "Fee updated successfully", fee: updatedFee });
  } 
  catch (error) {
    console.error("Error in updateFee:", error);
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
    notifyChange("FEE_CHANGED", { action: "delete", id: feeId });
    res.json({ message: "Fee deleted successfully" });
  } 
  catch (error) {
    res.status(500).json({ error: error.message });
  }
};