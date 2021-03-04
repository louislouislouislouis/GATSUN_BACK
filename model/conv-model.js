const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const convSchema = new Schema({
  image: [{ type: String, required: true }],
  participants: [
    { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  ],
  messages: [
    {
      from: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
      date: { type: Date },
      body: { type: String },
    },
  ],
});

module.exports = mongoose.model("Conv", convSchema);
