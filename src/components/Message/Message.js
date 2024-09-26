import React from 'react';
import './Message.css';

function Message({ message, currentUser, onDelete }) {
  const isOwnMessage = message.username === currentUser;

  return (
    <div className={`message ${isOwnMessage ? 'message--self' : 'message--other'}`}>
      {isOwnMessage && (
        <button className="message__delete-button" onClick={() => onDelete(message._id)}>
          &times; 
        </button>
      )}
      <div className='message__content'>
        <p className="message__username">{message.username}</p>
        <p className="message__text">{message.text}</p>
      </div>
      {message.avatar && (
        <img
          src={`http://localhost:5000${message.avatar}`}
          alt="Avatar"
          className="message__avatar"
        />
      )}
    </div>
  );
}

export default Message;
