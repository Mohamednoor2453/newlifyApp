const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express')
const User = require('../model/user.js')
const bcrypt = require('bcryptjs');
const { now } = require('mongoose');
const nodemailer = require("nodemailer")


const router = express.Router()

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[@\-_\+&/])[A-Za-z\d@\-_\+&/]{8,}$/

const adminMail = process.env.adminEmail.trim().toLowerCase();
const appPass = process.env.appPassword
COMPANYEMAIL= process.env.COMPANYEMAIL


// Setup Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: COMPANYEMAIL,
        pass: appPass,
    },
});

// Helper function to send email
async function sendEmail(to, subject, text) {
    try {
        await transporter.sendMail({
            from: COMPANYEMAIL,
            to,
            subject,
            text,
        });
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error(`Error sending email: ${error.message}`);
    }
}


const registerUser = async(req, res)=>{

    try {
        const{userName, email, password}= req.body

        if(!emailRegex.test(email)){
            return res.status(400).json({message: "Incorrect email format"})
        }

        if(!passwordRegex.test(password)){
            return res.status(400).json({message: "Password must meet requirements"})
        }

        const adminEmail = process.env.adminEmail.toLowerCase();

        let user = await User.findOne({email: email.trim().toLowerCase()})
        if(user){
            return res.status(400).json({message: "user with that email exist"})

        }

        let hashedPassword = await  bcrypt.hash(password, 12)
        let role = email.trim().toLowerCase() === adminEmail? 'admin' : 'user'

        const newUser = await User({
            userName: userName,
            email: email.trim().toLowerCase(),
            password:hashedPassword,
            role:role
        })

        await newUser.save()
        console.log("new user saved to db")

        res.status(200).redirect('/login')




    } catch (error) {
        res.status(500).json({error: error.message})
        
        
    }
}

const loginUser = async (req, res)=>{
    try {
       const {userName, email, password} = req.body

       const userEmail = email.trim().toLowerCase()

       const user = await User.findOne({email: userEmail})

       if(!user){
        return res.status(400).json({message: "No user with that email please register"})

       }

       const isPasswordMatch = await bcrypt.compare(password, user.password)

       if(!isPasswordMatch){
        return res.status(400).json({message: "Incorrect password"})
       }

       //creating session

       req.session.user = {
        userId: user._id,
        email: user.email,
        role: user.role
       }

       
       console.log("session created successfully", req.session.user)

       if(req.session.user.role === 'admin'){
        console.log("admin logged in")
        res.status(200).redirect('/admin')
       }
       else{
        console.log("user logged in")
        res.status(200).redirect('/FormPage')
       }

    } catch (error) {
        res.status(500).json({error: error.message})
        
    }
}


//forget password logics
const forgetPassword = async(req, res)=>{

    const {email} = req.body

        
    try {
       

        const user = await User.findOne({email: email.trim().toLowerCase()})

        if(!user){
             req.flash("No User with that Email")
             //check if request is an api call(eg from postman)
             if (req.headers.accept === 'application/json') {
                return res.status(404).json({ message: 'No user with that email' });
            }
            return res.status(300).redirect('/forgetPasswordForm')
        }

        const token = Math.random().toString(36).substring(2)
        user.resetToken = token
        user.resetTokenExpiry = Date.now() + 3600000 //token valid for an hour
        await user.save()

        const resetLink = `http://localhost:3001/reseting_password/${token}`
        const subject = 'Password Reset Request';
        const message = `You requested a password reset. Click the link to reset your password: ${resetLink}\nIf you did not request this, please ignore this email.`;

        await sendEmail(user.email, subject, message);//sending reset password 

        req.flash("password reset link sent to your email")
        //sending json incase of api call
        if(req.headers.accept=== 'application/json'){
            return res.status(200).json({message: "password reset link sent to your email"})
        }
        res.status(201).json({message: "reset password link sent to your email"})

    } catch (error) {
        res.status(500).json({error:error.message})
        
    }
}

    // Reset Password Route
const resetPasword = async (req, res) => {
    const { token } = req.params;
    try {
        const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
        if (!user) {
            req.flash('error', 'Invalid or expired token');
            return res.redirect('/forget_password');
        }
        res.render('reset-password.ejs', { token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const changePassword =async (req, res)=>{
    const { token } = req.params;
    const { password } = req.body;
    try {
        const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
        if (!user) {
            req.flash('error', 'Invalid or expired token');
            return res.redirect('/forget_password');
        }

        if (!passwordRegex.test(password)) {
            req.flash('error', 'Password must meet complexity requirements');
            return res.redirect(`/auth/reset-password/${token}`);
        }

        user.password = await bcrypt.hash(password, 12);
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        req.flash('success', 'Password reset successful');
        res.redirect('/login');
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}




const getprofile = async (req, res) => {
    const { userId } = req.params;

    try {
        // Fetch only the required fields
        const user = await User.findById(userId).select('userName email');
        
        if (!user) {
            req.flash("Profile not found");
            // JSON response for API clients
            if (req.headers.accept === 'application/json') {
                return res.status(404).json({ message: "Profile not found" });
            }
            
        }

        // Render profile view with user details
        res.render('ViewProfile.ejs', { 
            userName: user.userName,
            email: user.email 
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
// Route to get product details for updating

const getobeUpdatedngProfile = async (req, res) => {
    const userId = req.params.id; // Get user ID from params

    try {
        const user = await User.findById(userId).select('userName email'); // Fetch user details
        if (!user) {
            req.flash("User profile not found");
            // JSON response for API clients
            if (req.headers.accept === 'application/json') {
                return res.status(404).json({ message: "Profile not found" });
            }
            return res.redirect('/'); // Redirect if not using API
        }

        // Render the profile update page
        res.render('updateProfile.ejs', {
            userName: user.userName,
            email: user.email
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// PUT (Update) a product by ID
const updateProfile = async (req, res) => {
    const userId = req.params.id; // Get user ID from params
    const { email, userName } = req.body; // Extract email and username from body

    // Validate request body
    if (!email || !userName) {
        req.flash("Email and username are required");
        return res.redirect(`/updateProfile/${userId}`); // Redirect to update form
    }

    try {
        // Check if the user exists
        const existingUser = await User.findById(userId).select('email userName');
        if (!existingUser) {
            req.flash("User profile does not exist");
            if (req.headers.accept === 'application/json') {
                return res.status(404).json({ message: "Profile not found" });
            }
            return res.redirect('/'); // Redirect if not using API
        }

        // Update the user profile
        const updatedUserProfile = await User.findByIdAndUpdate(
            userId,
            { email, userName },
            { new: true } // Return the updated document
        );

        req.flash("Profile updated successfully");
        res.render('ViewProfile.ejs', {
            userName: updatedUserProfile.userName,
            email: updatedUserProfile.email
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    forgetPassword,
    resetPasword,
    changePassword,
    getprofile,
    updateProfile,
    getobeUpdatedngProfile
};