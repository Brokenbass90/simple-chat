import { io } from 'socket.io-client';

let socket;
export const initiateSocket = (token) => {
  console.log('Инициализация сокета с токеном:', token); // Лог инициализации
  if (!socket || !socket.connected) { 
    socket = io('http://localhost:5000', {
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



// export const initiateSocket = (token) => {
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

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not initialized');
  }
  return socket;
};

export default socket;

