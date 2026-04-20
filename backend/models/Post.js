const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  authorPseudonym: {
    type: String,
    required: [true, "Author pseudonym is required"],
    trim: true,
  },
  content: {
    type: String,
    required: [true, "Post content is required"],
    maxlength: [500, "Post cannot exceed 500 characters"],
  },
  toxicityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 1,
  },
  wasBlocked: {
    type: Boolean,
    default: false,
  },
   parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", default: null },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Post", postSchema);