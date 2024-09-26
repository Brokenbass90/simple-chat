"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.getSocket = exports.initiateSocket = void 0;

var _socket = require("socket.io-client");

var socket;

var initiateSocket = function initiateSocket(token) {
  console.log('Инициализация сокета с токеном:', token); // Лог инициализации

  if (!socket || !socket.connected) {
    socket = (0, _socket.io)('http://localhost:5000', {
      auth: {
        token: token
      },
      autoConnect: false
    });
    socket.on('connect', function () {
      console.log('Подключен к сокету');
    });
    socket.on('disconnect', function () {
      console.log('Отключился от сокета');
    });
    socket.connect();
  } else {
    console.log('Сокет уже инициализирован или подключен');
  }
}; // export const initiateSocket = (token) => {
//   if (!socket) { 
//     socket = io('/', {
//       auth: {
//         token: token,
//       },
//       autoConnect: false,
//     });
//     socket.on('connect', () => {
//       console.log('Подключен к сокету');
//     });
//     socket.on('disconnect', () => {
//       console.log('Отключился от сокета');
//     });
//   }
// };


exports.initiateSocket = initiateSocket;

var getSocket = function getSocket() {
  if (!socket) {
    throw new Error('Socket not initialized');
  }

  return socket;
};

exports.getSocket = getSocket;
var _default = socket;
exports["default"] = _default;