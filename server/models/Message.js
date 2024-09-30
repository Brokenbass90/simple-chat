// server/models/Message.js

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null для общего чата
  text: { type: String, required: true },
  avatar: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now, index: true }
});

// Добавляем TTL индекс для автоматического удаления сообщений через 24 часа
messageSchema.index({ "timestamp": 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('Message', messageSchema);
