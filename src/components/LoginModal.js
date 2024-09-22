import React, { useState } from 'react';
import axios from 'axios';

function LoginModal({ onClose, onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/login', { username, password });
      localStorage.setItem('token', res.data.accessToken);
      onLogin(res.data.username, res.data.avatar);
      onClose();
    } catch (err) {
      setError('Неверное имя пользователя или пароль');
    }
  };

  return (
    <div className="modal">
      <form onSubmit={handleLogin}>
        <h2>Вход</h2>
        {error && <p className="error">{error}</p>}
        <input type="text" placeholder="Имя пользователя" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Войти</button>
        <button type="button" onClick={onClose}>Отмена</button>
      </form>
    </div>
  );
}

export default LoginModal;
