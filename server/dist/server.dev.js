"use strict";

// server/server.js
require('dotenv').config();

var express = require('express');

var http = require('http');

var socketIO = require('socket.io');

var cors = require('cors');

var mongoose = require('mongoose');

var bcrypt = require('bcrypt');

var jwt = require('jsonwebtoken');

var multer = require('multer');

var path = require('path');

var fs = require('fs'); // Import models


var Message = require('./models/Message');

var User = require('./models/User'); // Constants


var PORT = process.env.PORT || 5000;
var JWT_SECRET = process.env.JWT_SECRET || '435472';
var mongoDB = process.env.MONGODB_URI || 'mongodb://127.0.0.1/chat'; // Connect to MongoDB

mongoose.connect(mongoDB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(function _callee() {
  var adminExists, firstUser;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          console.log('Successfully connected to MongoDB'); // Проверяем, есть ли админ. Если нет, делаем первого пользователя админом

          _context.next = 3;
          return regeneratorRuntime.awrap(User.findOne({
            admin: true
          }));

        case 3:
          adminExists = _context.sent;

          if (adminExists) {
            _context.next = 13;
            break;
          }

          _context.next = 7;
          return regeneratorRuntime.awrap(User.findOne());

        case 7:
          firstUser = _context.sent;

          if (!firstUser) {
            _context.next = 13;
            break;
          }

          firstUser.admin = true;
          _context.next = 12;
          return regeneratorRuntime.awrap(firstUser.save());

        case 12:
          console.log("\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C ".concat(firstUser.username, " \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D \u043A\u0430\u043A \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440"));

        case 13:
        case "end":
          return _context.stop();
      }
    }
  });
})["catch"](function (err) {
  return console.error('MongoDB connection error:', err);
}); // Create Express app

var app = express(); // Middleware

app.use(cors());
app.use(express.json()); // Ensure uploads directory exists

var uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use('/uploads', express["static"](uploadsDir)); // Set up multer for file uploads (avatars)

var storage = multer.diskStorage({
  destination: function destination(req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function filename(req, file, cb) {
    cb(null, "".concat(req.userId, "-").concat(Date.now()).concat(path.extname(file.originalname)));
  }
});
var upload = multer({
  storage: storage
}); // JWT authentication middleware

function authenticateToken(req, res, next) {
  var authHeader = req.headers['authorization'];
  var token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, function (err, user) {
    if (err) return res.sendStatus(403);
    req.userId = user.id;
    next();
  });
} // User registration


app.post('/api/register', function _callee2(req, res) {
  var _req$body, username, password, existingUser, hashedPassword, user, adminCount;

  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _req$body = req.body, username = _req$body.username, password = _req$body.password;
          _context2.prev = 1;
          _context2.next = 4;
          return regeneratorRuntime.awrap(User.findOne({
            username: username
          }));

        case 4:
          existingUser = _context2.sent;

          if (!existingUser) {
            _context2.next = 7;
            break;
          }

          return _context2.abrupt("return", res.status(400).send('Username already exists'));

        case 7:
          _context2.next = 9;
          return regeneratorRuntime.awrap(bcrypt.hash(password, 10));

        case 9:
          hashedPassword = _context2.sent;
          user = new User({
            username: username,
            password: hashedPassword
          });
          _context2.next = 13;
          return regeneratorRuntime.awrap(user.save());

        case 13:
          _context2.next = 15;
          return regeneratorRuntime.awrap(User.countDocuments({
            admin: true
          }));

        case 15:
          adminCount = _context2.sent;

          if (!(adminCount === 0)) {
            _context2.next = 21;
            break;
          }

          user.admin = true;
          _context2.next = 20;
          return regeneratorRuntime.awrap(user.save());

        case 20:
          console.log("\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C ".concat(user.username, " \u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D \u043A\u0430\u043A \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440"));

        case 21:
          res.status(201).send('User registered successfully');
          _context2.next = 28;
          break;

        case 24:
          _context2.prev = 24;
          _context2.t0 = _context2["catch"](1);
          console.error('Registration error:', _context2.t0);
          res.status(400).send('Error during registration');

        case 28:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[1, 24]]);
}); // User login

app.post('/api/login', function _callee3(req, res) {
  var _req$body2, username, password, user, accessToken;

  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _req$body2 = req.body, username = _req$body2.username, password = _req$body2.password;
          _context3.prev = 1;
          _context3.next = 4;
          return regeneratorRuntime.awrap(User.findOne({
            username: username
          }));

        case 4:
          user = _context3.sent;

          if (!(user == null)) {
            _context3.next = 7;
            break;
          }

          return _context3.abrupt("return", res.status(400).send('Invalid username or password'));

        case 7:
          _context3.next = 9;
          return regeneratorRuntime.awrap(bcrypt.compare(password, user.password));

        case 9:
          if (!_context3.sent) {
            _context3.next = 14;
            break;
          }

          accessToken = jwt.sign({
            id: user._id
          }, JWT_SECRET);
          res.json({
            accessToken: accessToken,
            username: user.username,
            avatar: user.avatar,
            admin: user.admin
          });
          _context3.next = 15;
          break;

        case 14:
          res.status(400).send('Invalid username or password');

        case 15:
          _context3.next = 21;
          break;

        case 17:
          _context3.prev = 17;
          _context3.t0 = _context3["catch"](1);
          console.error('Login error:', _context3.t0);
          res.status(500).send('Server error');

        case 21:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[1, 17]]);
}); // Update user profile

app.put('/api/profile', authenticateToken, upload.single('avatar'), function _callee4(req, res) {
  var updates;
  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          updates = {};
          if (req.body.username) updates.username = req.body.username;
          if (req.file) updates.avatar = "/uploads/".concat(req.file.filename);
          _context4.next = 6;
          return regeneratorRuntime.awrap(User.findByIdAndUpdate(req.userId, updates));

        case 6:
          res.send('Profile updated');
          _context4.next = 13;
          break;

        case 9:
          _context4.prev = 9;
          _context4.t0 = _context4["catch"](0);
          console.error('Profile update error:', _context4.t0);
          res.status(400).send('Error updating profile');

        case 13:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[0, 9]]);
}); // Delete user profile

app["delete"]('/api/profile', authenticateToken, function _callee5(req, res) {
  return regeneratorRuntime.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          _context5.next = 3;
          return regeneratorRuntime.awrap(User.findByIdAndDelete(req.userId));

        case 3:
          res.send('Profile deleted');
          _context5.next = 10;
          break;

        case 6:
          _context5.prev = 6;
          _context5.t0 = _context5["catch"](0);
          console.error('Profile deletion error:', _context5.t0);
          res.status(400).send('Error deleting profile');

        case 10:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[0, 6]]);
}); // Get user info

app.get('/api/user', authenticateToken, function _callee6(req, res) {
  var user;
  return regeneratorRuntime.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _context6.prev = 0;
          _context6.next = 3;
          return regeneratorRuntime.awrap(User.findById(req.userId));

        case 3:
          user = _context6.sent;
          res.json({
            username: user.username,
            avatar: user.avatar,
            admin: user.admin
          });
          _context6.next = 10;
          break;

        case 7:
          _context6.prev = 7;
          _context6.t0 = _context6["catch"](0);
          res.status(500).send('Server error');

        case 10:
        case "end":
          return _context6.stop();
      }
    }
  }, null, null, [[0, 7]]);
}); // Serve static files for client in production

if (process.env.NODE_ENV === 'production') {
  app.use(express["static"](path.join(__dirname, '..', 'client', 'build')));
  app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'), function (err) {
      if (err) {
        res.status(500).send(err);
      }
    });
  });
} // Create HTTP server


var server = http.createServer(app); // Initialize Socket.io

var io = socketIO(server, {
  cors: {
    origin: '*',
    // Replace with your frontend URL in production
    methods: ["GET", "POST"],
    credentials: true
  }
}); // Socket authentication middleware

io.use(function (socket, next) {
  var token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error'));
  }

  jwt.verify(token, JWT_SECRET, function _callee7(err, decoded) {
    var user;
    return regeneratorRuntime.async(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            if (!err) {
              _context7.next = 2;
              break;
            }

            return _context7.abrupt("return", next(new Error('Authentication error')));

          case 2:
            _context7.next = 4;
            return regeneratorRuntime.awrap(User.findById(decoded.id));

          case 4:
            user = _context7.sent;

            if (user) {
              _context7.next = 7;
              break;
            }

            return _context7.abrupt("return", next(new Error('Authentication error')));

          case 7:
            socket.user = user;
            next();

          case 9:
          case "end":
            return _context7.stop();
        }
      }
    });
  });
}); // Structure to store connected users

var connectedUsers = new Map(); // Function to emit users list

function emitUsersList() {
  var usersList = [];
  var userPromises = [];
  connectedUsers.forEach(function (socketId, userId) {
    userPromises.push(User.findById(userId, 'username avatar').then(function (user) {
      if (user) {
        usersList.push({
          _id: user._id,
          username: user.username,
          avatar: user.avatar
        });
      }
    })["catch"](function (err) {
      console.error('Ошибка при получении пользователя:', err);
    }));
  });
  Promise.all(userPromises).then(function () {
    io.emit('usersList', usersList);
  });
} // Handle Socket.io connections


io.on('connection', function (socket) {
  console.log('Пользователь подключился:', socket.user.username); // Add user to connected users

  connectedUsers.set(socket.user._id.toString(), socket.id); // Emit updated users list

  emitUsersList(); // Handle chat history request

  socket.on('requestChatHistory', function _callee8() {
    var messages;
    return regeneratorRuntime.async(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.prev = 0;
            _context8.next = 3;
            return regeneratorRuntime.awrap(Message.find({
              to: null
            }).populate('from', 'username avatar').sort({
              timestamp: 1
            }).exec());

          case 3:
            messages = _context8.sent;
            socket.emit('chatHistory', messages);
            _context8.next = 11;
            break;

          case 7:
            _context8.prev = 7;
            _context8.t0 = _context8["catch"](0);
            console.error('Ошибка при загрузке сообщений:', _context8.t0);
            socket.emit('errorMessage', 'Ошибка при загрузке истории чата.');

          case 11:
          case "end":
            return _context8.stop();
        }
      }
    }, null, null, [[0, 7]]);
  }); // Handle incoming messages

  socket.on('chatMessage', function _callee9(msg) {
    var text, to, message, toSocketId;
    return regeneratorRuntime.async(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.prev = 0;
            text = msg.text, to = msg.to; // 'to' - null for general chat or userId for private

            message = new Message({
              from: socket.user._id,
              to: to || null,
              text: text,
              avatar: socket.user.avatar
            });
            _context9.next = 5;
            return regeneratorRuntime.awrap(message.save());

          case 5:
            _context9.next = 7;
            return regeneratorRuntime.awrap(message.populate('from', 'username avatar'));

          case 7:
            if (to) {
              // Private message
              toSocketId = connectedUsers.get(to);

              if (toSocketId) {
                io.to(toSocketId).emit('chatMessage', {
                  _id: message._id,
                  from: {
                    _id: message.from._id,
                    username: message.from.username,
                    avatar: message.from.avatar
                  },
                  to: message.to,
                  text: message.text,
                  timestamp: message.timestamp
                });
              } // Send message to sender


              socket.emit('chatMessage', {
                _id: message._id,
                from: {
                  _id: message.from._id,
                  username: message.from.username,
                  avatar: message.from.avatar
                },
                to: message.to,
                text: message.text,
                timestamp: message.timestamp
              });
            } else {
              // General message
              io.emit('chatMessage', {
                _id: message._id,
                from: {
                  _id: message.from._id,
                  username: message.from.username,
                  avatar: message.from.avatar
                },
                to: null,
                text: message.text,
                timestamp: message.timestamp
              });
            }

            _context9.next = 14;
            break;

          case 10:
            _context9.prev = 10;
            _context9.t0 = _context9["catch"](0);
            console.error('Ошибка при отправке сообщения:', _context9.t0);
            socket.emit('errorMessage', 'Ошибка при отправке сообщения.');

          case 14:
          case "end":
            return _context9.stop();
        }
      }
    }, null, null, [[0, 10]]);
  }); // Handle getUsers request

  socket.on('getUsers', function () {
    emitUsersList();
  }); // Handle message deletion

  socket.on('deleteMessage', function _callee10(messageId) {
    var message, toSocketId;
    return regeneratorRuntime.async(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            _context10.prev = 0;
            _context10.next = 3;
            return regeneratorRuntime.awrap(Message.findById(messageId));

          case 3:
            message = _context10.sent;

            if (message) {
              _context10.next = 7;
              break;
            }

            socket.emit('errorMessage', 'Сообщение не найдено.');
            return _context10.abrupt("return");

          case 7:
            if (!(message.from.toString() === socket.user._id.toString())) {
              _context10.next = 13;
              break;
            }

            _context10.next = 10;
            return regeneratorRuntime.awrap(Message.deleteOne({
              _id: messageId
            }));

          case 10:
            if (message.to) {
              // Private message
              toSocketId = connectedUsers.get(message.to.toString());

              if (toSocketId) {
                io.to(toSocketId).emit('deleteMessage', messageId);
              }

              socket.emit('deleteMessage', messageId);
            } else {
              // General message
              io.emit('deleteMessage', messageId);
            }

            _context10.next = 14;
            break;

          case 13:
            socket.emit('errorMessage', 'Вы не можете удалить это сообщение.');

          case 14:
            _context10.next = 20;
            break;

          case 16:
            _context10.prev = 16;
            _context10.t0 = _context10["catch"](0);
            console.error('Ошибка при удалении сообщения:', _context10.t0);
            socket.emit('errorMessage', 'Ошибка при удалении сообщения.');

          case 20:
          case "end":
            return _context10.stop();
        }
      }
    }, null, null, [[0, 16]]);
  }); // Handle user disconnect

  socket.on('disconnect', function () {
    console.log('Пользователь отключился:', socket.user.username);
    connectedUsers["delete"](socket.user._id.toString());
    emitUsersList();
  });
}); // Start server

server.listen(PORT, function () {
  console.log("Server is running on port ".concat(PORT));
});