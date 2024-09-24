// src/socket.js

import { io } from 'socket.io-client';

let socket;

export const initiateSocket = (token) => {
  socket = io('/', { // '/' означает текущий домен
    auth: {
      token: token,
    },
    autoConnect: false, // Позволяет контролировать подключение из компонента
  });

  socket.on('connect', () => {
    console.log('Подключен к сокету');
  });

  socket.on('disconnect', () => {
    console.log('Отключился от сокета');
  });
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized');
  }
  return socket;
};

export default socket;
