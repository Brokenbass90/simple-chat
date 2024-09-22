const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  avatar: String, // Путь к файлу аватара
});

module.exports = mongoose.model('User', userSchema);
