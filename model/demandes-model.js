const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const demandeSchema = new Schema({
  from: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  body: { type: String },
  type: { type: String },
  askedDate: { type: Date },
  askingDate: { type: Date },
});

module.exports = mongoose.model("Demande", demandeSchema);
