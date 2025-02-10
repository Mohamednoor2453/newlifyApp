const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express')
const User = require('../model/user.js')
const {registerUser, loginUser, forgetPassword, resetPasword, changePassword,getprofile, getobeUpdatedngProfile, updateProfile} = require("../controller/userController.js")
const {getAllUsers, viewSpecificUser, deleteUser} = require("../controller/adminController.js")
const isAuthenticated = require('../middlewares/authMiddleware.js');


const router = express.Router()

//user logics
router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/forget_password', forgetPassword)
router.get('/reseting_password/:token', resetPasword)
router.post('/changePassword/:token', changePassword )

router.get('/profile/:userId', getprofile)
router.get('/updatingProfile/:id', getobeUpdatedngProfile )
router.put('/updateProfile/:id', updateProfile)


//admin routes
router.get('/users', getAllUsers)
router.get('/users/:id',viewSpecificUser)
router.delete('/users/:id', deleteUser)

//session validation route
router.get('/session', isAuthenticated, (req, res) => {
    if (req.session && req.session.user) {
        res.json({ isValid: true, user: req.session.user });
    } else {
        res.json({ isValid: false });
    }
});

module.exports = router