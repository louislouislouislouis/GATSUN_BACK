const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const postSchema = new Schema({
  from: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  body: { type: String },
  date: { type: Date },
});

module.exports = mongoose.model("Post", postSchema);
