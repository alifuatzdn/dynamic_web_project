const mongoose = require("mongoose");

// Minimal city model for dropdowns and validation.
const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  plateCode: {
    type: Number,
    required: true,
    unique: true
  }
});

module.exports = mongoose.model("City", citySchema);