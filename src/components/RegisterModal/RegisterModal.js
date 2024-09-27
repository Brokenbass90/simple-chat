import React, { useState } from 'react';
import axios from '../axiosConfig';
import './RegisterModal.css';

function RegisterModal({ onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/register', { username, password });
      alert('Регистрация успешна! Теперь вы можете войти.');
      onClose();
    } catch (err) {
      console.error('Ошибка при регистрации:', err);
      setError('Ошибка при регистрации');
    }
  };

  return (
    <div className="register-modal">
      <div className="register-modal__overlay" onClick={onClose}></div>
      <div className="register-modal__content">
        <form onSubmit={handleRegister}>
          <h2 className="register-modal__title">Регистрация</h2>
          {error && <p className="error">{error}</p>}
          <input
            type="text"
            placeholder="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="register-modal__buttons">
            <button type="submit">Зарегистрироваться</button>
            <button type="button" onClick={onClose}>
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterModal;
