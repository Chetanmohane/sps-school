const Event = require("../models/event");
const { notifyChange } = require("../config/socket");

exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, endDate, type, location } = req.body;
    if (!title || !date) {
      return res.status(400).json({ message: "Title and start date are required" });
    }

    const eventData = {
      title: String(title).trim(),
      description: description ? String(description).trim() : "",
      date: new Date(date),
      type: type || "Event",
      location: location ? String(location).trim() : "",
    };

    if (endDate && String(endDate).trim() !== "") {
      eventData.endDate = new Date(endDate);
    } else {
      eventData.endDate = null;
    }

    if (req.user?.id) {
      eventData.createdBy = req.user.id;
    }

    const event = new Event(eventData);

    await event.save();
    notifyChange("EVENT_CHANGED", { action: "create", event });
    return res.status(201).json({
      message: "Event created successfully",
      event
    });
  } 
  catch (error) {
    console.error("createEvent Error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    return res.status(200).json(events);
  } catch (error) {
    console.error("getEvents Error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    if (updateData.endDate && String(updateData.endDate).trim() !== "") {
      updateData.endDate = new Date(updateData.endDate);
    } else {
      updateData.endDate = null;
    }

    const event = await Event.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    notifyChange("EVENT_CHANGED", { action: "update", event });
    return res.json({ message: "Event updated successfully", event });
  } 
  catch (error) {
    console.error("updateEvent Error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    notifyChange("EVENT_CHANGED", { action: "delete", id: req.params.id });
    return res.json({ message: "Event deleted successfully" });
  } 
  catch (error) {
    console.error("deleteEvent Error:", error);
    return res.status(500).json({ message: error.message || "Server error" });
  }
};