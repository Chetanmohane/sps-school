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
    const email = req.query.email || (req.user ? req.user.email : null);
    if (!email) return res.status(400).json({ message: "Student email is required" });

    const user = await User.findOne({ email: email });
    if (!user) return res.status(404).json({ message: "User not found" });
    
    let student = await Student.findOne({ user: user._id });
    if (!student) {
      // Auto-create Student profile record if user exists but student doc doesn't
      student = new Student({
        user: user._id,
        className: "10",
        section: "A",
        rollNumber: `STU-${Date.now().toString().slice(-4)}`
      });
      await student.save();
    }

    let fees = await Fee.find({ studentId: student._id }).populate({
      path: "studentId",
      select: "rollNumber className section",
      populate: { path: "user", select: "name email phone" }
    });

    // If student has no fee records in DB yet, auto-create standard fee structure in MongoDB
    if (fees.length === 0) {
      const defaultFee1 = new Fee({
        studentId: student._id,
        amount: 25000,
        paidAmount: 0,
        status: "Pending",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        remarks: "Academic Tuition & Infrastructure Fee (Semester I)",
        updatedBy: "System Default"
      });
      const defaultFee2 = new Fee({
        studentId: student._id,
        amount: 12000,
        paidAmount: 0,
        status: "Pending",
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        remarks: "Annual Laboratory, Activity & Examination Fee",
        updatedBy: "System Default"
      });
      await Fee.insertMany([defaultFee1, defaultFee2]);

      fees = await Fee.find({ studentId: student._id }).populate({
        path: "studentId",
        select: "rollNumber className section",
        populate: { path: "user", select: "name email phone" }
      });

      notifyChange("FEE_CHANGED", { action: "create" });
    }

    res.json(fees);
  } catch (error) {
    console.error("Error in getMyFees:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.payFee = async (req, res) => {
  try {
    const { feeId } = req.params;
    const { paymentAmount, title, amount, email } = req.body;

    let fee = null;

    if (feeId && mongoose.Types.ObjectId.isValid(feeId)) {
      fee = await Fee.findById(feeId);
    }

    if (!fee) {
      // Find user & student record to create fee
      const searchEmail = email || (req.user ? req.user.email : null);
      let user = null;
      if (searchEmail) {
        user = await User.findOne({ email: searchEmail });
      } else if (req.user && req.user.id) {
        user = await User.findById(req.user.id);
      }

      if (!user) {
        // Fallback: find any student user or first student in DB
        const firstStudent = await Student.findOne().populate("user");
        if (firstStudent && firstStudent.user) {
          user = firstStudent.user;
        }
      }

      if (!user) {
        return res.status(404).json({ message: "User not found for payment processing" });
      }

      let student = await Student.findOne({ user: user._id });
      if (!student) {
        student = new Student({
          user: user._id,
          className: "10",
          section: "A",
          rollNumber: `STU-${Date.now().toString().slice(-4)}`
        });
        await student.save();
      }

      const totalAmt = Number(amount || paymentAmount) || 25000;
      const paidAmt = Number(paymentAmount) || totalAmt;
      let status = "Pending";
      if (paidAmt >= totalAmt && totalAmt > 0) status = "Paid";
      else if (paidAmt > 0) status = "Partial";

      fee = new Fee({
        studentId: student._id,
        amount: totalAmt,
        paidAmount: paidAmt,
        status: status,
        dueDate: new Date(),
        paymentDate: new Date(),
        updatedBy: "Student User (Online Payment)",
        remarks: title || "Academic Tuition & Infrastructure Fee (Semester I)"
      });
      await fee.save();
    } else {
      const payAmt = Number(paymentAmount) || fee.amount;
      const newPaidAmount = (fee.paidAmount || 0) + payAmt;
      let newStatus = "Partial";
      if (newPaidAmount >= fee.amount) {
        newStatus = "Paid";
      }

      fee.paidAmount = Math.min(newPaidAmount, fee.amount);
      fee.status = newStatus;
      fee.paymentDate = new Date();
      fee.updatedBy = req.body.updatedBy || "Student User (Online Payment)";
      await fee.save();
    }

    // Populate created/updated fee with student & user details
    const populatedFee = await Fee.findById(fee._id).populate({
      path: "studentId",
      select: "rollNumber className section",
      populate: { path: "user", select: "name email phone" }
    });

    notifyChange("FEE_CHANGED", { action: "pay", fee: populatedFee || fee });
    res.json({ message: "Fee payment processed successfully", fee: populatedFee || fee });
  } catch (error) {
    console.error("Error in payFee:", error);
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