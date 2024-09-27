require('dotenv').config(); 

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import models
const Message = require('./models/Message');
const User = require('./models/User');

// Constants
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || '435472';
const mongoDB = process.env.MONGODB_URI || 'mongodb://127.0.0.1/chat';

// Connect to MongoDB
mongoose.connect(mongoDB)
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); 

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
app.use('/uploads', express.static(uploadsDir)); 

// Set up multer for file uploads (avatars)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${req.userId}-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });


// JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); 
    req.userId = user.id;
    next();
  });
}

// User registration
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).send('User registered successfully');
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).send('Error during registration');
  }
});

// User login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (user == null) {
      return res.status(400).send('Invalid username or password');
    }
    if (await bcrypt.compare(password, user.password)) {
      const accessToken = jwt.sign({ id: user._id }, JWT_SECRET);
      res.json({ accessToken, username: user.username, avatar: user.avatar });
    } else {
      res.status(400).send('Invalid username or password');
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error');
  }
});

// Update user profile
app.put('/api/profile', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    const updates = {};
    if (req.body.username) updates.username = req.body.username;
    if (req.file) updates.avatar = `/uploads/${req.file.filename}`;
    await User.findByIdAndUpdate(req.userId, updates);
    res.send('Profile updated');
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(400).send('Error updating profile');
  }
});

// Delete user profile
app.delete('/api/profile', authenticateToken, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.userId);
    res.send('Profile deleted');
  } catch (err) {
    console.error('Profile deletion error:', err);
    res.status(400).send('Error deleting profile');
  }
});

// Get user info
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ username: user.username, avatar: user.avatar });
  } catch (err) {
    res.status(500).send('Server error');
  }
});


app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
});


// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIO(server, {
  cors: {
    origin: '*',
  },
});

// Middleware для аутентификации сокета
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    const user = await User.findById(decoded.id);
    if (!user) return next(new Error('Authentication error'));
    socket.user = user;
    next();
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Пользователь подключился:', socket.user.username);

  // Обработка запроса истории чата
  socket.on('requestChatHistory', async () => {
    try {
      const messages = await Message.find().sort({ timestamp: 1 }).exec();
      socket.emit('chatHistory', messages);
    } catch (err) {
      console.error('Ошибка при загрузке сообщений:', err);
      socket.emit('errorMessage', 'Ошибка при загрузке истории чата.');
    }
  });

  // Обработка входящих сообщений
  socket.on('chatMessage', async (msg) => {
    try {
      const message = new Message({
        username: socket.user.username,
        text: msg.text,
        avatar: socket.user.avatar,
      });
      await message.save();
      io.emit('chatMessage', {
        _id: message._id,
        text: message.text,
        username: message.username,
        avatar: message.avatar,
      });
    } catch (err) {
      console.error('Ошибка при отправке сообщения:', err);
      socket.emit('errorMessage', 'Ошибка при отправке сообщения.');
    }
  });

  // Получение списка всех пользователей
  app.get('/api/users', authenticateToken, async (req, res) => {
    try {
      const users = await User.find({}, 'username avatar'); // Получаем только имя пользователя и аватар
      res.json(users);
    } catch (err) {
      console.error('Ошибка при получении списка пользователей:', err);
      res.status(500).send('Ошибка сервера');
    }
  });

  // Обработка удаления сообщений
  socket.on('deleteMessage', async (messageId) => {
    try {
      const message = await Message.findById(messageId);
      if (message.username === socket.user.username) {
        await Message.deleteOne({ _id: messageId });
        io.emit('deleteMessage', messageId);
      } else {
        socket.emit('errorMessage', 'Вы не можете удалить это сообщение.');
      }
    } catch (err) {
      console.error('Ошибка при удалении сообщения:', err);
      socket.emit('errorMessage', 'Ошибка при удалении сообщения.');
    }
  });

  // Обработка отключения
  socket.on('disconnect', () => {
    console.log('Пользователь отключился');
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

