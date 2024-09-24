const mongoose = require('mongoose');
require('dotenv').config();

const mongoDB = process.env.MONGODB_URI || 'mongodb://127.0.0.1/chat';

mongoose.connect(mongoDB)
  .then(() => {
    console.log('Успешно подключились к MongoDB');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Ошибка подключения к MongoDB:', err);
  });
