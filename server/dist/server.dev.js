"use strict";

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

mongoose.connect(mongoDB).then(function () {
  return console.log('Successfully connected to MongoDB');
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


app.post('/api/register', function _callee(req, res) {
  var _req$body, username, password, hashedPassword, user;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _req$body = req.body, username = _req$body.username, password = _req$body.password;
          _context.prev = 1;
          _context.next = 4;
          return regeneratorRuntime.awrap(bcrypt.hash(password, 10));

        case 4:
          hashedPassword = _context.sent;
          user = new User({
            username: username,
            password: hashedPassword
          });
          _context.next = 8;
          return regeneratorRuntime.awrap(user.save());

        case 8:
          res.status(201).send('User registered successfully');
          _context.next = 15;
          break;

        case 11:
          _context.prev = 11;
          _context.t0 = _context["catch"](1);
          console.error('Registration error:', _context.t0);
          res.status(400).send('Error during registration');

        case 15:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[1, 11]]);
}); // User login

app.post('/api/login', function _callee2(req, res) {
  var _req$body2, username, password, user, accessToken;

  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _req$body2 = req.body, username = _req$body2.username, password = _req$body2.password;
          _context2.prev = 1;
          _context2.next = 4;
          return regeneratorRuntime.awrap(User.findOne({
            username: username
          }));

        case 4:
          user = _context2.sent;

          if (!(user == null)) {
            _context2.next = 7;
            break;
          }

          return _context2.abrupt("return", res.status(400).send('Invalid username or password'));

        case 7:
          _context2.next = 9;
          return regeneratorRuntime.awrap(bcrypt.compare(password, user.password));

        case 9:
          if (!_context2.sent) {
            _context2.next = 14;
            break;
          }

          accessToken = jwt.sign({
            id: user._id
          }, JWT_SECRET);
          res.json({
            accessToken: accessToken,
            username: user.username,
            avatar: user.avatar
          });
          _context2.next = 15;
          break;

        case 14:
          res.status(400).send('Invalid username or password');

        case 15:
          _context2.next = 21;
          break;

        case 17:
          _context2.prev = 17;
          _context2.t0 = _context2["catch"](1);
          console.error('Login error:', _context2.t0);
          res.status(500).send('Server error');

        case 21:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[1, 17]]);
}); // Update user profile

app.put('/api/profile', authenticateToken, upload.single('avatar'), function _callee3(req, res) {
  var updates;
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          updates = {};
          if (req.body.username) updates.username = req.body.username;
          if (req.file) updates.avatar = "/uploads/".concat(req.file.filename);
          _context3.next = 6;
          return regeneratorRuntime.awrap(User.findByIdAndUpdate(req.userId, updates));

        case 6:
          res.send('Profile updated');
          _context3.next = 13;
          break;

        case 9:
          _context3.prev = 9;
          _context3.t0 = _context3["catch"](0);
          console.error('Profile update error:', _context3.t0);
          res.status(400).send('Error updating profile');

        case 13:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 9]]);
}); // Delete user profile

app["delete"]('/api/profile', authenticateToken, function _callee4(req, res) {
  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          _context4.next = 3;
          return regeneratorRuntime.awrap(User.findByIdAndDelete(req.userId));

        case 3:
          res.send('Profile deleted');
          _context4.next = 10;
          break;

        case 6:
          _context4.prev = 6;
          _context4.t0 = _context4["catch"](0);
          console.error('Profile deletion error:', _context4.t0);
          res.status(400).send('Error deleting profile');

        case 10:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[0, 6]]);
}); // Get user info

app.get('/api/user', authenticateToken, function _callee5(req, res) {
  var user;
  return regeneratorRuntime.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          _context5.prev = 0;
          _context5.next = 3;
          return regeneratorRuntime.awrap(User.findById(req.userId));

        case 3:
          user = _context5.sent;
          res.json({
            username: user.username,
            avatar: user.avatar
          });
          _context5.next = 10;
          break;

        case 7:
          _context5.prev = 7;
          _context5.t0 = _context5["catch"](0);
          res.status(500).send('Server error');

        case 10:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[0, 7]]);
});
app.use(express["static"](path.join(__dirname, 'build')));
app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, '../build', 'index.html'));
}); // Create HTTP server

var server = http.createServer(app); // Initialize Socket.io

var io = socketIO(server, {
  cors: {
    origin: '*'
  }
}); // Middleware для аутентификации сокета

io.use(function (socket, next) {
  var token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error'));
  }

  jwt.verify(token, JWT_SECRET, function _callee6(err, decoded) {
    var user;
    return regeneratorRuntime.async(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            if (!err) {
              _context6.next = 2;
              break;
            }

            return _context6.abrupt("return", next(new Error('Authentication error')));

          case 2:
            _context6.next = 4;
            return regeneratorRuntime.awrap(User.findById(decoded.id));

          case 4:
            user = _context6.sent;

            if (user) {
              _context6.next = 7;
              break;
            }

            return _context6.abrupt("return", next(new Error('Authentication error')));

          case 7:
            socket.user = user;
            next();

          case 9:
          case "end":
            return _context6.stop();
        }
      }
    });
  });
}); // Socket.io connection handling

io.on('connection', function (socket) {
  console.log('Пользователь подключился:', socket.user.username); // Обработка запроса истории чата

  socket.on('requestChatHistory', function _callee7() {
    var messages;
    return regeneratorRuntime.async(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.prev = 0;
            _context7.next = 3;
            return regeneratorRuntime.awrap(Message.find().sort({
              timestamp: 1
            }).exec());

          case 3:
            messages = _context7.sent;
            socket.emit('chatHistory', messages);
            _context7.next = 11;
            break;

          case 7:
            _context7.prev = 7;
            _context7.t0 = _context7["catch"](0);
            console.error('Ошибка при загрузке сообщений:', _context7.t0);
            socket.emit('errorMessage', 'Ошибка при загрузке истории чата.');

          case 11:
          case "end":
            return _context7.stop();
        }
      }
    }, null, null, [[0, 7]]);
  }); // Обработка входящих сообщений

  socket.on('chatMessage', function _callee8(msg) {
    var message;
    return regeneratorRuntime.async(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.prev = 0;
            message = new Message({
              username: socket.user.username,
              text: msg.text,
              avatar: socket.user.avatar
            });
            _context8.next = 4;
            return regeneratorRuntime.awrap(message.save());

          case 4:
            io.emit('chatMessage', {
              _id: message._id,
              text: message.text,
              username: message.username,
              avatar: message.avatar
            });
            _context8.next = 11;
            break;

          case 7:
            _context8.prev = 7;
            _context8.t0 = _context8["catch"](0);
            console.error('Ошибка при отправке сообщения:', _context8.t0);
            socket.emit('errorMessage', 'Ошибка при отправке сообщения.');

          case 11:
          case "end":
            return _context8.stop();
        }
      }
    }, null, null, [[0, 7]]);
  }); // Получение списка всех пользователей

  app.get('/api/users', authenticateToken, function _callee9(req, res) {
    var users;
    return regeneratorRuntime.async(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.prev = 0;
            _context9.next = 3;
            return regeneratorRuntime.awrap(User.find({}, 'username avatar'));

          case 3:
            users = _context9.sent;
            // Получаем только имя пользователя и аватар
            res.json(users);
            _context9.next = 11;
            break;

          case 7:
            _context9.prev = 7;
            _context9.t0 = _context9["catch"](0);
            console.error('Ошибка при получении списка пользователей:', _context9.t0);
            res.status(500).send('Ошибка сервера');

          case 11:
          case "end":
            return _context9.stop();
        }
      }
    }, null, null, [[0, 7]]);
  }); // Обработка удаления сообщений

  socket.on('deleteMessage', function _callee10(messageId) {
    var message;
    return regeneratorRuntime.async(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            _context10.prev = 0;
            _context10.next = 3;
            return regeneratorRuntime.awrap(Message.findById(messageId));

          case 3:
            message = _context10.sent;

            if (!(message.username === socket.user.username)) {
              _context10.next = 10;
              break;
            }

            _context10.next = 7;
            return regeneratorRuntime.awrap(Message.deleteOne({
              _id: messageId
            }));

          case 7:
            io.emit('deleteMessage', messageId);
            _context10.next = 11;
            break;

          case 10:
            socket.emit('errorMessage', 'Вы не можете удалить это сообщение.');

          case 11:
            _context10.next = 17;
            break;

          case 13:
            _context10.prev = 13;
            _context10.t0 = _context10["catch"](0);
            console.error('Ошибка при удалении сообщения:', _context10.t0);
            socket.emit('errorMessage', 'Ошибка при удалении сообщения.');

          case 17:
          case "end":
            return _context10.stop();
        }
      }
    }, null, null, [[0, 13]]);
  }); // Обработка отключения

  socket.on('disconnect', function () {
    console.log('Пользователь отключился');
  });
}); // Start the server

server.listen(PORT, function () {
  console.log("Server is running on port ".concat(PORT));
});