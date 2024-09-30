// server/server.js

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
mongoose.connect(mongoDB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(async () => {
    console.log('Successfully connected to MongoDB');
    // Проверяем, есть ли админ. Если нет, делаем первого пользователя админом
    const adminExists = await User.findOne({ admin: true });
    if (!adminExists) {
      const firstUser = await User.findOne();
      if (firstUser) {
        firstUser.admin = true;
        await firstUser.save();
        console.log(`Пользователь ${firstUser.username} установлен как администратор`);
      }
    }
  })
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
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).send('Username already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    
    // Если это первый зарегистрированный пользователь, делаем его админом
    const adminCount = await User.countDocuments({ admin: true });
    if (adminCount === 0) {
      user.admin = true;
      await user.save();
      console.log(`Пользователь ${user.username} установлен как администратор`);
    }

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
      res.json({ accessToken, username: user.username, avatar: user.avatar, admin: user.admin });
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
    res.json({ username: user.username, avatar: user.avatar, admin: user.admin });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// Serve static files for client in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'), function (err) {
      if (err) {
        res.status(500).send(err);
      }
    });
  });
}

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIO(server, {
  cors: {
    origin: '*', // Replace with your frontend URL in production
    methods: ["GET", "POST"],
    credentials: true
  },
});

// Socket authentication middleware
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

// Structure to store connected users
const connectedUsers = new Map();

// Function to emit users list
function emitUsersList() {
  const usersList = [];
  const userPromises = [];

  connectedUsers.forEach((socketId, userId) => {
    userPromises.push(
      User.findById(userId, 'username avatar').then(user => {
        if (user) {
          usersList.push({
            _id: user._id,
            username: user.username,
            avatar: user.avatar,
          });
        }
      }).catch(err => {
        console.error('Ошибка при получении пользователя:', err);
      })
    );
  });

  Promise.all(userPromises).then(() => {
    io.emit('usersList', usersList);
  });
}

// Handle Socket.io connections
io.on('connection', (socket) => {
  console.log('Пользователь подключился:', socket.user.username);

  // Add user to connected users
  connectedUsers.set(socket.user._id.toString(), socket.id);

  // Emit updated users list
  emitUsersList();

  // Handle chat history request
  socket.on('requestChatHistory', async () => {
    try {
      // Get all messages for general chat
      const messages = await Message.find({ to: null })
        .populate('from', 'username avatar')
        .sort({ timestamp: 1 })
        .exec();
      socket.emit('chatHistory', messages);
    } catch (err) {
      console.error('Ошибка при загрузке сообщений:', err);
      socket.emit('errorMessage', 'Ошибка при загрузке истории чата.');
    }
  });

  // Handle incoming messages
  socket.on('chatMessage', async (msg) => {
    try {
      const { text, to } = msg; // 'to' - null for general chat or userId for private
      const message = new Message({
        from: socket.user._id,
        to: to || null,
        text,
        avatar: socket.user.avatar,
      });
      await message.save();

      // Популяция поля 'from'
      await message.populate('from', 'username avatar');

      if (to) {
        // Private message
        const toSocketId = connectedUsers.get(to);
        if (toSocketId) {
          io.to(toSocketId).emit('chatMessage', {
            _id: message._id,
            from: {
              _id: message.from._id,
              username: message.from.username,
              avatar: message.from.avatar,
            },
            to: message.to,
            text: message.text,
            timestamp: message.timestamp,
          });
        }
        // Send message to sender
        socket.emit('chatMessage', {
          _id: message._id,
          from: {
            _id: message.from._id,
            username: message.from.username,
            avatar: message.from.avatar,
          },
          to: message.to,
          text: message.text,
          timestamp: message.timestamp,
        });
      } else {
        // General message
        io.emit('chatMessage', {
          _id: message._id,
          from: {
            _id: message.from._id,
            username: message.from.username,
            avatar: message.from.avatar,
          },
          to: null,
          text: message.text,
          timestamp: message.timestamp,
        });
      }
    } catch (err) {
      console.error('Ошибка при отправке сообщения:', err);
      socket.emit('errorMessage', 'Ошибка при отправке сообщения.');
    }
  });

  // Handle getUsers request
  socket.on('getUsers', () => {
    emitUsersList();
  });

  // Handle message deletion
  socket.on('deleteMessage', async (messageId) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit('errorMessage', 'Сообщение не найдено.');
        return;
      }

      if (message.from.toString() === socket.user._id.toString()) {
        await Message.deleteOne({ _id: messageId });

        if (message.to) {
          // Private message
          const toSocketId = connectedUsers.get(message.to.toString());
          if (toSocketId) {
            io.to(toSocketId).emit('deleteMessage', messageId);
          }
          socket.emit('deleteMessage', messageId);
        } else {
          // General message
          io.emit('deleteMessage', messageId);
        }
      } else {
        socket.emit('errorMessage', 'Вы не можете удалить это сообщение.');
      }
    } catch (err) {
      console.error('Ошибка при удалении сообщения:', err);
      socket.emit('errorMessage', 'Ошибка при удалении сообщения.');
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('Пользователь отключился:', socket.user.username);
    connectedUsers.delete(socket.user._id.toString());
    emitUsersList();
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
