const mongoose = require("mongoose");

const MoodLogSchema = new mongoose.Schema({
  pseudonym: {
    type: String,
    required: true,
  },
  moodScore: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  aiNudge: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("MoodLog", MoodLogSchema);