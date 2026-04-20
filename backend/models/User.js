const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  pseudonym: {
    type: String,
    required: [true, "Pseudonym is required"],
    unique: true,
    trim: true,
    minlength: [3, "Pseudonym must be at least 3 characters"],
    maxlength: [30, "Pseudonym cannot exceed 30 characters"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
