const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    // Room ID / URL slug
    name: {
      type: String,
      required: true,
      unique: true,
    },

    // Serialized Yjs document
    content: {
      type: Buffer,
      required: true,
      default: Buffer.alloc(0),
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Room", roomSchema);