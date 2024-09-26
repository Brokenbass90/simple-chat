import React, { useState, useEffect } from 'react';
import { initiateSocket, getSocket } from '../../socket'; 
import Message from '../Message/Message';
import LoginModal from '../LoginModal/LoginModal';
import RegisterModal from '../RegisterModal/RegisterModal';
import Profile from '../Profile/Profile';
import axios from '../axiosConfig';
import './Chat.css';

function Chat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Инициализация сокета и получение истории сообщений
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('/user', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUser(res.data);
        initiateSocket(token);

        const socket = getSocket();
        socket.connect();
        socket.emit('requestChatHistory');

        // Слушатели событий сокета
        socket.on('chatHistory', (messages) => {
          setMessages(messages);
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
      })
      .catch((err) => {
        console.error('Ошибка при получении данных пользователя:', err);
        setShowLogin(true);
      });
    } else {
      setShowLogin(true);
    }

    return () => {
      try {
        const socket = getSocket();
        if (socket) {
          // Отключение всех событий и сокета при размонтировании компонента
          socket.off('chatHistory');
          socket.off('chatMessage');
          socket.off('deleteMessage');
          socket.off('errorMessage');
          socket.off('connect_error');
          socket.disconnect();
        }
      } catch (error) {
        console.error('Socket error during cleanup:', error.message);
      }
    };
  }, []);

  // Вход пользователя
  const handleLogin = (username, avatar) => {
    setUser({ username, avatar });
    setShowLogin(false);

    const token = localStorage.getItem('token');
    initiateSocket(token);
    const socket = getSocket();
    socket.connect();
    socket.emit('requestChatHistory');
  };

  // Выход пользователя
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setShowLogin(true);
    const socket = getSocket();
    socket.disconnect();
  };

  // Отправка сообщения
  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const msg = { text: message };
      const socket = getSocket();
      socket.emit('chatMessage', msg);
      setMessage('');
    }
  };

  // Удаление сообщения
  const deleteMessage = (messageId) => {
    const socket = getSocket();
    socket.emit('deleteMessage', messageId);
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
      {!user && showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} onLogin={handleLogin} />
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
              <div className='chat__profile-container'>
                {user.avatar && (
                  <img src={user.avatar} alt="Avatar" className="chat__avatar" />
                )}
                <span className="chat__username">{user.username}</span>
                
              </div>
              
              <div className='chat__profile-container space-between'>
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
              />
              <button className="chat__button chat__button--send" type="submit">
                Отправить
              </button>
            </form>
          </div>
        </div>
      )}
      {!user && (
        <div className="chat__auth-options">
          <button className="chat__button" onClick={() => setShowLogin(true)}>Войти</button>
          <button className="chat__button" onClick={() => setShowRegister(true)}>Регистрация</button>
        </div>
      )}
      
    </div>
  );
  
  
}

export default Chat;
