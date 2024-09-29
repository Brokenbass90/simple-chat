import React, { useState } from 'react';
import axios from '../axiosConfig';
import './profile.css';

function Profile({ user, onUpdate, onDelete, onClose }) {
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('username', username);
    if (avatar) {
      formData.append('avatar', avatar);
    }
    try {
      await axios.put('/api/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      onUpdate({
        username,
        avatar: avatar ? URL.createObjectURL(avatar) : user.avatar,
      });
      onClose(); // Закрываем окно после успешного обновления
    } catch (err) {
      console.error('Ошибка при обновлении профиля:', err);
      setError('Не удалось обновить профиль');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete('/api/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      onDelete();
    } catch (err) {
      console.error('Ошибка при удалении профиля:', err);
      setError('Не удалось удалить профиль');
    }
  };

  return (
    <div className="profile-modal">
      <div className="profile-modal__overlay" onClick={onClose}></div>
      <div className="profile-modal__content">
        <button className="profile-modal__close" onClick={onClose}>
          &times;
        </button>
        <form onSubmit={handleUpdate}>
          <h2 className="profile-modal__title">Редактирование профиля</h2>
          {error && <p className="profile-modal__error">{error}</p>}
          <input
            className="profile-modal__input"
            type="text"
            placeholder="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="profile-modal__input"
            type="file"
            accept="image/*"
            onChange={(e) => setAvatar(e.target.files[0])}
          />
          <div className="profile-modal__buttons">
            <button type="submit">Сохранить</button>
            <button type="button" onClick={handleDelete}>Удалить профиль</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile;
