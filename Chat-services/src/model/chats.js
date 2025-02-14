const { Timestamp } = require("bson")
const mongoose= require("mongoose")
const Schema = mongoose.Schema

const ChatSchema = new mongoose.Schema({
    members: [{ type: String, required: true }], // Stores userIds
    messages: [
        {
            sender: { type: String, required: true }, // userId of sender
            text: { type: String, required: true },
            timestamp: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

const Chats = mongoose.model('Chats', ChatSchema)
module.exports =Chats