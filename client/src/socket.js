// client/src/socket.js
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'ваш_JWT_токен',
  },
});

socket.on('connect', () => {
  console.log('Подключен к сокету');
});

socket.on('chatMessage', (message) => {
  console.log('Новое сообщение:', message);
});

// Экспортируйте сокет для использования в компонентах
export default socket;
