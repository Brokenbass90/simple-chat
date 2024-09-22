import React, { useState } from 'react';
import axios from 'axios';

function Profile({ user, onUpdate, onDelete }) {
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(null);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('username', username);
    if (avatar) {
      formData.append('avatar', avatar);
    }
    try {
      await axios.put('http://localhost:5000/api/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Добавили 'Bearer '
        },
      });
      onUpdate({ username, avatar: avatar ? URL.createObjectURL(avatar) : user.avatar });
    } catch (err) {
      console.error('Ошибка при обновлении профиля:', err);
    }
  };
  
  const handleDelete = async () => {
    try {
      await axios.delete('http://localhost:5000/api/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Добавили 'Bearer '
        },
      });
      onDelete();
    } catch (err) {
      console.error('Ошибка при удалении профиля:', err);
    }
  };
  

  return (
    <div className="modal">
      <form onSubmit={handleUpdate}>
        <h2>Редактирование профиля</h2>
        <input type="text" placeholder="Имя пользователя" value={username} onChange={(e) => setUsername(e.target.value)} />
        <input type="file" accept="image/*" onChange={(e) => setAvatar(e.target.files[0])} />
        <button type="submit">Сохранить</button>
        <button type="button" onClick={handleDelete}>Удалить профиль</button>
      </form>
    </div>
  );
}

export default Profile;
