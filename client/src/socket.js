// client/src/socket.js

import { io } from 'socket.io-client';

let socket;

/**
 * Инициализирует сокет с переданным токеном.
 * @param {string} token - JWT токен для аутентификации.
 */
export const initiateSocket = (token) => {
  console.log('Инициализация сокета с токеном:', token); // Лог инициализации

  if (!socket || !socket.connected) {
    // Определяем URL сокета в зависимости от окружения
    const SOCKET_URL = process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:5000';

    socket = io(SOCKET_URL, {
      auth: {
        token: token,
      },
      autoConnect: false,
    });

    socket.on('connect', () => {
      console.log('Подключен к сокету');
    });

    socket.on('disconnect', () => {
      console.log('Отключился от сокета');
    });

    socket.connect();
  } else {
    console.log('Сокет уже инициализирован или подключен');
  }
};

/**
 * Возвращает текущий сокет.
 * @returns {Socket | undefined} - Текущий сокет или undefined, если не инициализирован.
 */
export const getSocket = () => {
  return socket;
};

export default socket;
