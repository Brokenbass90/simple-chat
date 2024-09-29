import React, { useState, useEffect } from 'react';
import { initiateSocket, getSocket } from '../../socket';
import Message from '../Message/Message';
import RegisterModal from '../RegisterModal/RegisterModal';
import Profile from '../Profile/Profile';
import axios from '../axiosConfig';
import './Chat.css';

function Chat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [username, setUsername] = useState(''); 
  const [password, setPassword] = useState(''); 
  const [error, setError] = useState(''); 

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
    } else {
      socket.on('connect', () => {
        socket.emit('requestChatHistory');
      });
    }

    socket.on('chatHistory', (msgs) => {
      setMessages(msgs);
    });

    socket.on('chatMessage', (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    socket.on('deleteMessage', (messageId) => {
      setMessages((prevMessages) => prevMessages.filter(msg => msg._id !== messageId));
    });

    socket.on('errorMessage', (errorMsg) => {
      alert(errorMsg);
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

  // Инициализация сокета при изменении пользователя
  useEffect(() => {
    if (user) {

      const token = localStorage.getItem('token');
      if (token) {
        setupSocket(token);
      }
    } else {

      setMessages([]);
      const socket = getSocket();
      if (socket) {
        socket.off('chatHistory');
        socket.off('chatMessage');
        socket.off('deleteMessage');
        socket.off('errorMessage');
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
        socket.off('connect_error');
        if (socket.connected) {
          socket.disconnect();
        }
      }
    };
    // eslint-disable-next-line
  }, [user]);

  // Вход пользователя
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/login', { username, password });
      localStorage.setItem('token', res.data.accessToken);
      setUser({ username: res.data.username, avatar: res.data.avatar });
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
    if (message.trim()) {
      const msg = { text: message };
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit('chatMessage', msg);
        setMessage('');
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
                Зарегистрироваться
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
          <div className="chat__sidebar">
            <div className="chat__participants">
              <h3>Участники чата</h3>
              {/* Добавьте список участников */}
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
                  <img src={user.avatar} alt="Avatar" className="chat__avatar" />
                )}
                <span className="chat__username">{user.username}</span>
              </div>
              <div className="chat__profile-container space-between">
                <button className="chat__button" onClick={() => setShowProfile(true)}>Профиль</button>
                <button className="chat__button" onClick={handleLogout}>Выйти</button>
              </div>
            </div>
          </div>
          <div className="chat__main">
            <div className="chat__messages">
              {messages.map((msg) => (
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
          </div>
        </div>
      )}
    </div>
  );
}

export default Chat;
