import React, { useState } from 'react';
import axios from 'axios';

function RegisterModal({ onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/register', 
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
      alert('Регистрация успешна! Теперь вы можете войти.');
      onClose();
    } catch (err) {
      console.error('Ошибка при регистрации:', err);
      setError('Ошибка при регистрации');
    }
  };

  return (
    <div className="modal">
      <form onSubmit={handleRegister}>
        <h2>Регистрация</h2>
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
        <button type="submit">Зарегистрироваться</button>
        <button type="button" onClick={onClose}>Отмена</button>
      </form>
    </div>
  );
}

export default RegisterModal;
