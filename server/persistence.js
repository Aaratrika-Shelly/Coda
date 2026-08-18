const Y = require("yjs");
const Room = require("./models/Room");

const persistence = {
  // Load document from MongoDB into Yjs
  async bindState(roomName, ydoc) {
    const room = await Room.findOne({ name: roomName });

    if (room && room.content.length > 0) {
      Y.applyUpdate(ydoc, room.content);
      console.log(`Loaded room "${roomName}" from MongoDB`);
    } else {
      console.log(`Created new room "${roomName}"`);
    }

     ydoc.on('update', async () => {
      console.log(`Changes detected in ${roomName}, saving...`);
      await this.writeState(roomName, ydoc);
    });
  },

  // Save current Yjs document to MongoDB
  async writeState(roomName, ydoc) {
    const update = Buffer.from(Y.encodeStateAsUpdate(ydoc));

    await Room.findOneAndUpdate(
      { name: roomName },
      {
        name: roomName,
        content: update,
      },
      {
        upsert: true,
        new: true,
      }
    );

    console.log(`Saved room "${roomName}"`);
  },
};

module.exports = persistence;