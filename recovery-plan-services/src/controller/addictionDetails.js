//addictionDetails.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const RecoveryPlan= require("../model/recoveryPlan.js")
const Detail = require("../model/addictionDetails.js");
const User = require("../../../user-service/src/model/user.js"); // Adjust the path according to your project structure
const axios = require('axios');
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});




// Addiction Details Route
const addictionDetails = async (req, res) => {
    try {
        // Call the user-service session validation API
        const response = await axios.get("http://localhost:3001/session", {
            headers: {
                Cookie: req.headers.cookie, // Pass the session cookie from the request
            },
        });

        if (!response.data.isValid) {
            return res.status(401).json({ message: 'Unauthorized: Session expired or not found.' });
        }

        // Extract user ID from the session
        const userId = response.data.user.userId;

        const { addictionType, period, age, gender, workingwithpsychiatrist, recoveryAttempt } = req.body;

        // Save addiction details to the database
        const userDetail = new Detail({
            userId,
            addictionType,
            period,
            age,
            gender,
            workingwithpsychiatrist,
            recoveryAttempt,
        });

        await userDetail.save();
        res.status(200).json({ message: "User addiction details saved to db" });
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message);
    }
};

// Get Form Route
const getForm = async (req, res) => {
    try {
        const response = await axios.get("http://localhost:3001/session", {
            headers: {
                Cookie: req.headers.cookie
            }
        });
        console.log('API Response:', response.data);

        if (!response.data.isValid) {
            return res.status(401).json({ message: 'Unauthorized: Session expired or not found.' });
        }

        const userId = response.data.user.userId;

        res.status(200).render('addiction-form.ejs', { userId });
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error.message);
    }
};

//Recovery Plan Response Route

const recoveryPlanResponse = async (req, res) => {
    try {
        // Validate session
        const response = await axios.get("http://localhost:3001/session", {
            headers: {
                Cookie: req.headers.cookie,
            },
        });

        if (!response.data.isValid) {
            return res.status(401).json({ message: "Unauthorized: Session expired or not found." });
        }

        const userId = response.data.user.userId;

        // Retrieve user addiction details
        const user_details = await Detail.findOne({ userId }).select(
            "addictionType period age gender workingwithpsychiatrist recoveryAttempt"
        );

        if (!user_details) {
            return res.status(404).json({ message: "User details not found." });
        }

        // Creating the OpenAI messages array
const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
        { role: "developer", content: "You are a helpful assistant." },
        {
            role: "user",
            content: `Generate a 21-day personalized recovery plan for a user with the following details: ${JSON.stringify(user_details)}Provide a step-by-step guide with actionable advice.`,
        },
    ],
    store: true,
});

console.log(completion.choices[0].message);

       

        // Check if choices exist in the response
        if (!completion.data.choices || completion.data.choices.length === 0) {
            return res.status(500).json({ error: "No response from OpenAI API." });
        }

        const recoveryPlan = completion.data.choices[0].message.content;

        // Save the prompt and response in the database as a separate document
        const recoveryPlanDoc = new RecoveryPlan({
            userId,
            prompt: messages[1].content, // Store the user prompt for reference
            recoveryPlan,
        });

        await recoveryPlanDoc.save();

        res.status(200).json({
            message: "Recovery plan generated successfully",
            recoveryPlan,
        });
    } catch (error) {
        console.error("Error generating recovery plan:", error.message);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    addictionDetails,
    recoveryPlanResponse,
    getForm,
};
