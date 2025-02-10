const User = require('../model/user.js');
const express = require('express');
const router = express.Router();

// Controller to fetch all users with pagination
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page

    const startIndex = (page - 1) * limit;

    // Fetch users with pagination
    const users = await User.find().select("userName email").skip(startIndex).limit(limit);

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }

    // Render the users.ejs template with the users data
    
    // Respond with JSON data
    res.status(200).renser('allUsers.ejs', {users})
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};


const viewSpecificUser = async(req, res)=>{
    const userId = req.params.id

    try {
        const user = await User.findById(userId).select('userName email')
        if(!user){
            res.status(400).json({message: "cannot fetch user detail"})
        }

         res.status(200).render('specificUser.ejs', {user})
    } catch (error) {
        
        res.status(500).json({error: error.message})
    }
}

//delete user
const deleteUser = async (req, res) => {
    const userId = req.params.id;
    try {
        // Find and delete the user
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(400).json({ message: "User does not exist" });
        }

        // Fetch the updated list of users
        const users = await User.find();

        // Send JSON response
        res.status(200).json({ message: "User deleted successfully" });

        // Render the allUsers.ejs with the updated users
        res.render('allUsers.ejs', { users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};




module.exports = { 
    getAllUsers,
    viewSpecificUser,
    deleteUser
 };
