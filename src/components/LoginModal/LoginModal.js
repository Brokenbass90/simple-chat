import React, { useState } from 'react';
import axios from 'axios';
import './LoginModal.css';

function LoginModal({ onClose, onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/login', 
        { 
          username, 
          password 
        }, 
        {
          headers: {
            'Content-Type': 'application/json', // Явно указываем тип контента
          }
        }
      );
      localStorage.setItem('token', res.data.accessToken);
      onLogin(res.data.username, res.data.avatar);
      onClose();
    } catch (err) {
      console.error('Ошибка при входе:', err);
      setError('Неверное имя пользователя или пароль');
    }
  };

  return (
    <div className="login-modal">
      <div className="login-modal__content">
        <form onSubmit={handleLogin}>
          <h2>Вход</h2>
          {error && <p className="error">{error}</p>}
          <input 
            className='login-modal__input'
            type="text" 
            placeholder="Имя пользователя" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
          />
          <input 
            className='login-modal__input'
            type="password" 
            placeholder="Пароль" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
          <button className='login-modal__button' type="submit">Войти</button>
          <button className='login-modal__button' type="button" onClick={onClose}>Отмена</button>
        </form>
      </div>
      
    </div>
  );
}

export default LoginModal;
