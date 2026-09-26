const express = require("express");
const Contact = require("../models/Contact");

const router = express.Router();

// Get all contacts
router.get("/", async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load contacts",
      error: error.message,
    });
  }
});

// Add new contact
router.post("/", async (req, res) => {
  try {
    const { name, phone, primary } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        message: "Name and phone are required",
      });
    }

    const contact = await Contact.create({
      name,
      phone,
      primary: primary || false,
    });

    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({
      message: "Failed to add contact",
      error: error.message,
    });
  }
});

// Update contact
router.put("/:id", async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!contact) {
      return res.status(404).json({
        message: "Contact not found",
      });
    }

    res.json(contact);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update contact",
      error: error.message,
    });
  }
});

// Delete contact
router.delete("/:id", async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        message: "Contact not found",
      });
    }

    res.json({
      message: "Contact deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete contact",
      error: error.message,
    });
  }
});

module.exports = router;