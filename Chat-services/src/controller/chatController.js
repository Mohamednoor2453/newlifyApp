const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });


const Chat = require("../model/chats.js");
const axios = require('axios');


// Function to create/get a chat room between two users (peer-to-peer)
const chatRoom = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({ error: "Receiver ID is required" });
    }

    // Look for an existing chat (for peer-to-peer, type is optional)
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

// Function to send a message in a chat room
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

// Creating a chat room for psychologist and automatic reassignment using round-robin
const assignPsychologistChatRoom = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const USER_SERVICE_URL = process.env.USER_SERVICE_URL;

    // Fetch available psychologists from the user service
    const response = await axios.get(USER_SERVICE_URL);
    // Extract the psychologists array from the response data
    let psychologists = response.data.psychologists;

    // Ensure that psychologists is an array
    if (!Array.isArray(psychologists)) {
      psychologists = [];
    }

    if (psychologists.length === 0) {
      return res.status(400).json({ error: "No psychologist is available at the moment" });
    }

    // Import and instantiate the SequentialRoundRobin with the psychologists array
    const { SequentialRoundRobin } = require("round-robin-js");
    const rr = new SequentialRoundRobin(psychologists);

    // Retrieve the next psychologist in the round-robin sequence
    const assignedPsychologist = rr.next();
    // The psychologist object is in the 'value' property
    const psychologistId = assignedPsychologist.value._id;

    // Find an existing chat room or create a new one
    let chat = await Chat.findOne({
      type: "psychiatrist",
      members: { $all: [senderId, psychologistId] },
    }).lean();

    if (!chat) {
      chat = new Chat({
        type: "psychiatrist",
        members: [senderId, psychologistId],
        messages: [],
      });
      await chat.save();
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error("Error in assignPsychologistChatRoom:", error);
    res.status(500).json({ error: error.message });
  }
};



module.exports = { chatRoom, sendMessage, assignPsychologistChatRoom };
