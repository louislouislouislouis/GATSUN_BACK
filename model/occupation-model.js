const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const occupationSchema = new Schema({
  dateend: { type: Date, required: true },
  datebegin: { type: Date, required: true },
});

module.exports = mongoose.model("Occupation", occupationSchema);
