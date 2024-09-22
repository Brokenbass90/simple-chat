import React, { useState, useEffect } from 'react';
import socket from '../socket';
import Message from './Message';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import Profile from './Profile/Profile'; // Импортируем компонент Profile
import './Chat.css';
import axios from 'axios';

function Chat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showProfile, setShowProfile] = useState(false); // Состояние для отображения профиля

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.get('http://localhost:5000/api/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setUser(res.data);

        socket.auth = { token };
        socket.connect();

        socket.emit('requestChatHistory');
      })
      .catch((err) => {
        console.error('Ошибка при получении данных пользователя:', err);
        setShowLogin(true);
      });
    } else {
      setShowLogin(true);
    }

    // Обработчики событий сокета
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

    return () => {
      socket.off('chatHistory');
      socket.off('chatMessage');
      socket.off('deleteMessage');
      socket.off('errorMessage');
      socket.off('connect_error');
    };
  }, []);

  const handleLogin = (username, avatar) => {
    setUser({ username, avatar });
    setShowLogin(false);
  
    socket.auth = { token: localStorage.getItem('token') };
    socket.connect();
  
    socket.emit('requestChatHistory');
  };
  

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setShowLogin(true);
    socket.disconnect();
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const msg = {
        text: message,
      };
      socket.emit('chatMessage', msg);
      setMessage('');
    }
  };
  

  const deleteMessage = (messageId) => {
    socket.emit('deleteMessage', messageId);
  };

  // Функция для обновления профиля
  const handleUpdateProfile = (updatedUser) => {
    setUser((prevUser) => ({ ...prevUser, ...updatedUser }));
  };

  // Функция для удаления профиля
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
        <>
          <div className="chat__header">
            {user.avatar && (
              <img src={`http://localhost:5000${user.avatar}`} alt="Avatar" className="chat__avatar" />
            )}
            <span>{user.username}</span>
            <button onClick={() => setShowProfile(true)}>Профиль</button> {/* Кнопка для открытия профиля */}
            <button onClick={handleLogout}>Выйти</button>
          </div>
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
            <button className="chat__button" type="submit">
              Отправить
            </button>
          </form>
        </>
      )}
      {!user && (
        <div className="chat__auth-options">
          <button onClick={() => setShowLogin(true)}>Войти</button>
          <button onClick={() => setShowRegister(true)}>Регистрация</button>
        </div>
      )}
      {showProfile && (
        <Profile
          user={user}
          onUpdate={handleUpdateProfile}
          onDelete={handleDeleteProfile}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}

export default Chat;
