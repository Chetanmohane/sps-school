const Event = require("../models/event");
const { notifyChange } = require("../config/socket");

exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, location } = req.body;
    if (!title || !date) {
      return res.status(400).json({ message: "Title and date required" });
    }

    const event = new Event({
      title,
      description,
      date,
      location,
      createdBy: req.user?.id
    });

    await event.save();
    notifyChange("EVENT_CHANGED", { action: "create", event });
    return res.status(201).json({
      message: "Event created",
      event
    });
  } 
  catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ date: 1 });
    return res.status(200).json(events);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    notifyChange("EVENT_CHANGED", { action: "update", event });
    return res.json({ message: "Event updated", event });
  } 
  catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    notifyChange("EVENT_CHANGED", { action: "delete", id: req.params.id });
    return res.json({ message: "Event deleted" });
  } 
  catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};