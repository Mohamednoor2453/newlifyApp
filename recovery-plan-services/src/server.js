const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require("express");
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('express-flash');

const app = express();

// session middleware
app.use(
    session({
      secret: process.env.SESSION_SECRET_KEY,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: process.env.USERSESSIONDATA }),
      cookie: {
        secure: false, // Set 'true' if using HTTPS
        httpOnly: true,
        maxAge: 30 * 60 * 1000 // session cookies expire after 30 minutes
      }
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

// database connection
const dbURL = process.env.dbURL;
mongoose.connect(dbURL)
.then(() => console.log("database connected successfully"))
.catch((err) => console.log(err));

// Import routes
const recoveryPlanRouter = require("./Routes/recoveryPlanRoutes.js");

app.use('/', recoveryPlanRouter);

// Rendering 404 page for mispath
app.use((req, res) => {
    console.log('404 handler triggered');
    res.status(404).render('404');
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const port = process.env.PORT;
app.listen(port, () => {
    console.log("server connected successfully");
});