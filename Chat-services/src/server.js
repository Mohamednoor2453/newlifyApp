const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

const Chat = require("./model/chats.js");
const chatRoutes = require("./Routes/chatRoutes.js");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());
app.use("/", chatRoutes);

// Setting EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// MongoDB Connection
mongoose.connect(process.env.dbURL)
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.log(err));

// Socket.io logic
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  
  socket.on("joinRoom", ({ chatId }) => {
    socket.join(chatId);
    console.log(`User joined room ${chatId}`);
  });

  socket.on("sendMessage", async ({ chatId, senderId, text }) => {
    try {
      const chat = await Chat.findById(chatId);
      if (!chat) {
        return console.log("Chat not found");
      }
      const newMessage = { sender: senderId, text, timestamp: new Date() };
      chat.messages.push(newMessage);
      await chat.save();
      io.to(chatId).emit("receiveMessage", newMessage);
    } catch (error) {
      console.error("Error sending message:", error.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Start Server
const PORT = process.env.PORT || 5002;
server.listen(PORT, () => console.log(`Chat Service running on port ${PORT}`));

module.exports = { app, io };
