const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const psycSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  specialization: {
    type: String,
    required: true
  }
});

const Psyc = mongoose.model("Psyc", psycSchema);
module.exports = Psyc;
