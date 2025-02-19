const User = require('../model/user.js');
const Psyc = require('../model/psyc.js');
const express = require('express');
const router = express.Router();

// Controller to fetch all users with pagination
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
    const startIndex = (page - 1) * limit;

    // Fetch users with pagination (select only required fields)
    const users = await User.find()
      .select("userName email")
      .skip(startIndex)
      .limit(limit);

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    // Render the users view with the users data
    res.status(200).render('allUsers.ejs', { users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

const viewSpecificUser = async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId).select('userName email');
    if (!user) {
      return res.status(400).json({ message: "Cannot fetch user details" });
    }
    res.status(200).render('specificUser.ejs', { user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete user (respond only once)
const deleteUser = async (req, res) => {
  const userId = req.params.id;
  try {
    // Find and delete the user
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }
    // Respond with JSON message
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Adding a Psychologist/Therapist
const addPsychologist = async (req, res) => {
  try {
    const { name, age, specialization } = req.body;
    // Validate required fields if needed
    const newPsyc = new Psyc({ name, age, specialization });
    await newPsyc.save();
    res.status(201).json({ message: "Psychologist added to DB successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Displaying Psychologists
const getPsychologists = async (req, res) => {
  try {
    const psychologists = await Psyc.find();
    if (!psychologists || psychologists.length === 0) {
      return res.status(400).json({ message: "No Psychologist in the Database" });
    }
    res.status(200).json({ psychologists });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { 
  getAllUsers,
  viewSpecificUser,
  deleteUser,
  addPsychologist,
  getPsychologists
};
