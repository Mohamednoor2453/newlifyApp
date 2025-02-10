const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();

const express = require("express");
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');

const app = express();
const session = require('express-session');
const flash = require('express-flash');

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Set the directory where your views are located
app.set('views', path.join(__dirname, 'views'));

// Session middleware
app.use(
    session({
        secret: process.env.SESSION_SECRET_KEY,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl: process.env.dbURL }),
        cookie: {
            secure: false, // Set 'true' if using HTTPS
            httpOnly: true,
            maxAge: 30 * 60 * 1000, // Session cookies expire after 30 minutes
        },
    })
);

// Set up flash middleware
app.use(flash());

// Middleware to pass flash messages to all views
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Middleware to parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const userRouter = require("./Routes/userRoutes.js");

// Authentication middleware
const isAuthenticated = require('./middlewares/authMiddleware.js');

app.use('/', userRouter);

// Database connection
const dbURL = process.env.dbURL;
mongoose.connect(dbURL)
    .then(() => console.log("Database connected successfully"))
    .catch((err) => console.log(err));

// Rendering 404 page for missing paths
// app.use((req, res) => {
//     console.log('404 handler triggered');
//     res.status(404).render('404'); // Make sure a `404.ejs` file exists in your `views` folder
// });

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const port = process.env.PORT;
app.listen(port, () => {
    console.log("Server is listening for requests on port", port);
});
