const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const demandeSchema = new Schema({
  from: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  body: { type: String, required: true },
  type: { type: String, required: true },
  askedDatebeg: { type: Date, required: true },
  askedDateend: { type: Date, required: true },
  askingDate: { type: Date, required: true },
  validateby: { type: mongoose.Types.ObjectId, ref: "User" },
  paymentmethod: {
    type: String,
    enum: ["cb", "cash"],
    default: "cash",
    required: true,
  },
  status: { type: String, required: true },
});

module.exports = mongoose.model("Demande", demandeSchema);
