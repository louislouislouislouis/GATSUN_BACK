const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  firstname: { type: String, required: true },
  bio: { type: String },
  posts: [{ type: mongoose.Types.ObjectId, required: true, ref: "Post" }],
  likes: [{ type: String, required: true }],
  password: { type: String, required: true, minlength: 6 },
  convs: [{ type: mongoose.Types.ObjectId, required: true, ref: "Conv" }],
  demandes: [{ type: mongoose.Types.ObjectId, required: true, ref: "Demande" }],
  email: { type: String, required: true, unique: true },
  role: {
    type: String,
    enum: ["NC", "C-VA", "C-NVA", "responsable", "bureau", "Master"],
  },
  image: { type: String, required: true },
  status: { type: String, enum: ["public", "private"] },
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
