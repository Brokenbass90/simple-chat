// client/src/components/Chat/Chat.js

import React, { useState, useEffect } from 'react';
import { initiateSocket, getSocket } from '../../socket';
import Message from '../Message/Message';
import RegisterModal from '../RegisterModal/RegisterModal';
import Profile from '../Profile/Profile';
import axios from '../axiosConfig';
import './Chat.css';

// Импорт Howler
import { Howl, Howler } from 'howler';
import sendSound from '../../assets/sounds/send.mp3';
import receiveSound from '../../assets/sounds/rec.mp3'; // Убедитесь, что файл называется receive.mp3

function Chat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]); // Список участников
  const [showRegister, setShowRegister] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [error, setError] = useState('');
  const generalChat = { _id: 'general', username: 'Общий чат' };
  const [selectedChat, setSelectedChat] = useState(null); // Инициализация без выбранного чата
  const [soundsEnabled, setSoundsEnabled] = useState(true); // Переключатель звуков
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480); // Определение мобильного устройства

  // Создание объектов Howl
  const sendAudio = new Howl({
    src: [sendSound],
    volume: 0.5,
  });

  const receiveAudio = new Howl({
    src: [receiveSound],
    volume: 0.5,
  });

  // Базовый URL сервера
  const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

  // Обработчик изменения размера окна для определения мобильного устройства
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Обработка разрешения AudioContext после пользовательского взаимодействия
  useEffect(() => {
    const resumeAudio = () => {
      Howler.ctx.resume();
      document.removeEventListener('click', resumeAudio);
      document.removeEventListener('keydown', resumeAudio);
    };

    document.addEventListener('click', resumeAudio);
    document.addEventListener('keydown', resumeAudio);

    return () => {
      document.removeEventListener('click', resumeAudio);
      document.removeEventListener('keydown', resumeAudio);
    };
  }, []);

  // Функция для настройки сокета
  function setupSocket(token) {
    initiateSocket(token);

    const socket = getSocket();

    if (!socket) {
      console.error('Socket не инициализирован');
      return;
    }

    if (socket.connected) {
      socket.emit('requestChatHistory');
      socket.emit('getUsers'); // Запрос текущих пользователей
    } else {
      socket.on('connect', () => {
        socket.emit('requestChatHistory');
        socket.emit('getUsers'); // Запрос текущих пользователей при подключении
      });
    }

    socket.on('chatHistory', (msgs) => {
      setMessages(msgs);
    });

    socket.on('chatMessage', (msg) => {
      // Избегаем дублирования сообщений
      if (!messages.some(existingMsg => existingMsg._id === msg._id)) {
        setMessages((prevMessages) => [...prevMessages, msg]);

        // Воспроизведение звука получения, если сообщение от другого пользователя
        if (soundsEnabled && msg.from.username !== user.username) {
          receiveAudio.play();
        }
      }
    });

    socket.on('deleteMessage', (messageId) => {
      setMessages((prevMessages) => prevMessages.filter(msg => msg._id !== messageId));
    });

    socket.on('errorMessage', (errorMsg) => {
      alert(errorMsg);
    });

    // Обработка события получения списка пользователей
    socket.on('usersList', (usersList) => {
      // Исключаем текущего пользователя из списка
      const filteredUsers = usersList.filter(u => u._id !== user._id);
      setUsers(filteredUsers);
    });

    socket.on('connect_error', (err) => {
      if (err.message === 'Authentication error') {
        alert('Ошибка аутентификации. Пожалуйста, войдите заново.');
        handleLogout();
      } else {
        console.error('Ошибка подключения:', err);
      }
    });
  }

  // Инициализация пользователя при загрузке компонента
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('/api/user', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log('Данные пользователя:', res.data); 
        setUser(res.data);
      })
      .catch((err) => {
        console.error('Ошибка при получении данных пользователя:', err);
        setUser(null);
      });
    }
    // eslint-disable-next-line
  }, []);

  // Инициализация сокета при изменении пользователя или переключении звуков
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      if (token) {
        setupSocket(token);
      }
    } else {
      setMessages([]);
      setUsers([]); // Очистка списка пользователей при выходе
      setSelectedChat(null); // Сброс выбранного чата
      const socket = getSocket();
      if (socket) {
        socket.off('chatHistory');
        socket.off('chatMessage');
        socket.off('deleteMessage');
        socket.off('errorMessage');
        socket.off('usersList'); // Отключаем слушатель
        socket.off('connect_error');
        if (socket.connected) {
          socket.disconnect();
        }
      }
    }

    // Возвращаем функцию очистки при размонтировании компонента или изменении пользователя
    return () => {
      const socket = getSocket();
      if (socket) {
        socket.off('chatHistory');
        socket.off('chatMessage');
        socket.off('deleteMessage');
        socket.off('errorMessage');
        socket.off('usersList'); // Отключаем слушатель
        socket.off('connect_error');
        if (socket.connected) {
          socket.disconnect();
        }
      }
    };
    // eslint-disable-next-line
  }, [user, soundsEnabled]);

  // Вход пользователя
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/login', { username, password });
      localStorage.setItem('token', res.data.accessToken);
      setUser({ username: res.data.username, avatar: res.data.avatar, admin: res.data.admin });
      setUsername('');
      setPassword('');
      setError('');
    } catch (err) {
      console.error('Ошибка при входе:', err);
      setError('Неверное имя пользователя или пароль');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Отправка сообщения
  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && selectedChat) {
      const socket = getSocket();
      if (socket && socket.connected) {
        const msg = {
          text: message,
          to: selectedChat._id !== 'general' ? selectedChat._id : null, // null для общего чата
        };
        socket.emit('chatMessage', msg);
        setMessage('');
        
        // Воспроизведение звука отправки, если звуки включены
        if (soundsEnabled) {
          sendAudio.play();
        }
      } else {
        console.error('Socket не подключен');
      }
    }
  };

  // Удаление сообщения
  const deleteMessage = (messageId) => {
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit('deleteMessage', messageId);
    } else {
      console.error('Socket не подключен');
    }
  };

  // Обновление профиля
  const handleUpdateProfile = (updatedUser) => {
    setUser((prevUser) => ({ ...prevUser, ...updatedUser }));
  };

  // Удаление профиля
  const handleDeleteProfile = () => {
    handleLogout();
  };

  // Выбор чата
  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
  };

  // Фильтрация сообщений по выбранному чату
  const filteredMessages = selectedChat && selectedChat._id === 'general'
    ? messages.filter(msg => msg.to === null)
    : selectedChat
      ? messages.filter(msg => 
          (msg.from && msg.from._id === selectedChat._id) ||
          (msg.to && msg.to === selectedChat._id)
        )
      : [];

  // Функция для проверки дублирования сообщений
  const isMessageDuplicate = (msg) => {
    return messages.some(existingMsg => existingMsg._id === msg._id);
  };

  return (
    <div className="chat">
      {!user && (
        <div className="chat__auth">
          <form className="chat__login-form" onSubmit={handleLogin}>
            {error && <p className="chat__error">{error}</p>}
            <input
              className="chat__input-login"
              type="text"
              placeholder="Имя пользователя"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              className="chat__input-login"
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="chat__auth-buttons">
              <button className="chat__button" type="submit">
                Войти
              </button>
              <button
                className="chat__button"
                type="button"
                onClick={() => setShowRegister(true)}
              > 
                Регистрация
              </button>
            </div>
          </form>
        </div>
      )}

      {!user && showRegister && (
        <RegisterModal onClose={() => setShowRegister(false)} />
      )}

      {user && (
        <div className="chat__container">
          {/* Панель участников */}
          {(!isMobile || !selectedChat) && (
            <div className="chat__sidebar">
              <div className="chat__participants">
                <ul className="chat__users-list">
                  {/* Кнопка для общего чата */}
                  <li
                    className={`chat__user-item ${selectedChat && selectedChat._id === 'general' ? 'active' : ''}`}
                    onClick={() => handleSelectChat(generalChat)}
                  >
                    <span className="chat__user-name">Общий чат</span>
                  </li>
                  {/* Список пользователей */}
                  {users.map((u) => (
                    <li
                      key={u._id}
                      className={`chat__user-item ${selectedChat && selectedChat._id === u._id ? 'active' : ''}`}
                      onClick={() => handleSelectChat(u)}
                    >
                      {u.avatar && (
                        <img 
                          src={`${SERVER_URL}${u.avatar}`} 
                          alt={`${u.username}'s avatar`} 
                          className="chat__user-avatar" 
                        />
                      )}
                      <span className="chat__user-name">{u.username}</span>
                    </li>
                  ))}
                </ul>
                {showProfile && (
                  <Profile
                    user={user}
                    onUpdate={handleUpdateProfile}
                    onDelete={handleDeleteProfile}
                    onClose={() => setShowProfile(false)}
                  />
                )}
              </div>
              <div className="chat__profile">
                <div className="chat__profile-container">
                  {user.avatar && (
                    <img 
                      src={`${SERVER_URL}${user.avatar}`} 
                      alt="Avatar" 
                      className="chat__avatar" 
                    />
                  )}
                  <span className="chat__username">{user.username}</span>
                </div>
                <div className="chat__profile-container space-between">
                  <button className="chat__button" onClick={() => setShowProfile(true)}>Профиль</button>
                  <button className="chat__button" onClick={handleLogout}>Выйти</button>
                </div>
              </div>
            </div>
          )}

          {/* Основная область для сообщений */}
          {selectedChat ? (
            <div className={`chat__main ${isMobile ? 'chat__main--mobile' : ''}`}>
              {/* Стрелочка назад для мобильных устройств */}
              {isMobile && (
                <button className="back-button" onClick={() => setSelectedChat(null)}>
                  &larr; Назад
                </button>
              )}
              <div className="chat__header">
                {selectedChat._id === 'general' ? 'Общий чат' : `Чат с ${selectedChat.username}`}
              </div>
              <div className="chat__messages">
                {filteredMessages.map((msg) => (
                  <Message
                    key={msg._id}
                    message={msg}
                    currentUser={user.username}
                    onDelete={deleteMessage}
                  />
                ))}
              </div>
              <form className="chat__form" onSubmit={sendMessage}>
                <input
                  className="chat__input"
                  type="text"
                  placeholder="Введите сообщение..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
                <button className="chat__button chat__button--send" type="submit">
                  Отправить
                </button>
              </form>
              {/* Переключатель звуков */}
              <div className="chat__settings">
                <label>
                  <input
                    type="checkbox"
                    checked={soundsEnabled}
                    onChange={() => setSoundsEnabled(!soundsEnabled)}
                  />
                  Включить звуки
                </label>
              </div>
            </div>
          ) : (
            <div className="chat__main no-chat-selected">
              <p>Пожалуйста, выберите чат для начала общения.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Chat;
