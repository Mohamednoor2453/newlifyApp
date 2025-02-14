const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const Chat = require("../model/chats.js");

// Function to create/get a chat room between two users
const chatRoom = async (req, res) => {
    try {
        const senderId = req.user.userId;
        const { receiverId } = req.body;

        if (!receiverId) {
            return res.status(400).json({ error: "Receiver ID is required" });
        }

        // Optimize database query using lean for faster read
        let chat = await Chat.findOne({
            members: { $all: [senderId, receiverId] }
        }).lean();

        // Create chat if not found
        if (!chat) {
            chat = new Chat({ members: [senderId, receiverId], messages: [] });
            await chat.save();
        }

        res.status(200).json(chat);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Function to send a message
const sendMessage = async (req, res) => {
    try {
        const senderId = req.user.userId;
        const { receiverId, text } = req.body;

        if (!receiverId || !text) {
            return res.status(400).json({ error: "Receiver ID and text are required" });
        }

        // Find chat room
        const chat = await Chat.findOne({
            members: { $all: [senderId, receiverId] }
        });

        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }

        const newMessage = {
            sender: senderId,
            text,
            timestamp: new Date(),
        };

        chat.messages.push(newMessage);
        await chat.save();

        res.status(200).json(newMessage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { chatRoom, sendMessage };
