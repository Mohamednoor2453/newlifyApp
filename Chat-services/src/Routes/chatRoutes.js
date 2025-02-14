const express = require("express");
const router = express.Router();
const { chatRoom, sendMessage } = require("../controller/chatController.js");
const validateSession = require("../Middleware/validateSession.js");

// Apply session validation middleware to all routes
router.use(validateSession);

router.post("/chat", chatRoom);
router.post("/message", sendMessage);

router.get("/chat", async (req, res) => {
    try {
        const senderId = req.user.userId;
        const receiverId = req.query.receiverId || "default_receiver_id";

        res.render("chat", { senderId, receiverId });
    } catch (error) {
        console.error("Error fetching chat:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
