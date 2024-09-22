// server/models/Message.js

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  username: String,
  text: String,
  avatar: String,
  timestamp: { type: Date, default: Date.now, index: true }
});

// Добавляем TTL индекс для автоматического удаления сообщений через 24 часа
messageSchema.index({ "timestamp": 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Message', messageSchema);
