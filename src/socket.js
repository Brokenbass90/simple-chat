import { io } from 'socket.io-client';

let socket;

export const initiateSocket = (token) => {
  if (!socket) { // Проверяем, что сокет еще не инициализирован
    socket = io('/', {
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
  }
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized');
  }
  return socket;
};

export default socket;
