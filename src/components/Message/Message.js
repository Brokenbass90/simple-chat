import React from 'react';
import './Message.css';

function Message({ message, currentUser, onDelete }) {
  const isOwnMessage = message.username === currentUser;

  return (
    <div className={`message ${isOwnMessage ? 'message--self' : 'message--other'}`}>
      {!isOwnMessage && message.avatar && (
        <img
          src={message.avatar}
          alt="Avatar"
          className="message__avatar"
        />
      )}
      <div className="message__content">
        <p className="message__username">{message.username}</p>
        <p className="message__text">{message.text}</p>
      </div>
      {isOwnMessage && (
        <>
          {message.avatar && (
            <img
              src={message.avatar}
              alt="Avatar"
              className="message__avatar"
            />
          )}
          <button
            className="message__delete-button"
            onClick={() => onDelete(message._id)}
          >
            &times;
          </button>
        </>
      )}
    </div>
  );
}

export default Message;
