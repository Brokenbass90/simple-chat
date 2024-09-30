// client/src/components/Message/Message.js

import React from 'react';
import './Message.css';
import { format } from 'date-fns';

function Message({ message, currentUser, onDelete }) {
  if (!message.from) {
    return null; // Или отображайте placeholder
  }

  const isOwnMessage = message.from.username === currentUser;

  // Добавляем логирование объекта сообщения
  console.log('Сообщение:', message);

  // Определяем поле даты
  const messageDate = message.createdAt || message.timestamp;

  return (
    <div className={`message ${isOwnMessage ? 'message--self' : 'message--other'}`}>
      {!isOwnMessage && message.from.avatar && (
        <img
          src={`${process.env.REACT_APP_SERVER_URL || 'http://localhost:5000'}${message.from.avatar}`}
          alt={`${message.from.username}'s avatar`}
          className="message__avatar"
        />
      )}
      <div className="message__content">
        {!isOwnMessage && <p className="message__username">{message.from.username}</p>}
        <p className="message__text">{message.text}</p>
        {/* Используем библиотеку date-fns для форматирования даты */}
        {messageDate ? (
          <span className="message__timestamp">
            {format(new Date(messageDate), 'HH:mm')}
          </span>
        ) : (
          <span className="message__timestamp">Нет даты</span>
        )}
        {isOwnMessage && (
          <button className="message__delete-button" onClick={() => onDelete(message._id)}>
            &times;
          </button>
        )}
      </div>
      {isOwnMessage && message.from.avatar && (
        <img
          src={`${process.env.REACT_APP_SERVER_URL || 'http://localhost:5000'}${message.from.avatar}`}
          alt={`${message.from.username}'s avatar`}
          className="message__avatar"
        />
      )}
    </div>
  );
}

export default Message;
