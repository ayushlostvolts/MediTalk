import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const ChatWindow = ({ callId, senderName, senderType }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const socket = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.current = io('http://localhost:5000'); // Connect to backend Socket.IO server

    socket.current.emit('joinCall', { callId, userType: senderType, userId: senderType === 'user' ? 'someUserId' : null, doctorId: senderType === 'doctor' ? 'someDoctorId' : null }); // Dummy IDs for now

    socket.current.on('message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.current.on('callEnded', (data) => {
      setMessages((prevMessages) => [...prevMessages, { sender: 'System', message: `Call ended. Duration: ${data.duration} minutes.` }]);
    });

    return () => {
      socket.current.disconnect();
    };
  }, [callId, senderType]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socket.current.emit('chatMessage', { callId, sender: senderName, message: newMessage });
      setNewMessage('');
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '10px', height: '300px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexGrow: 1, overflowY: 'auto', marginBottom: '10px' }}>
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.sender}:</strong> {msg.message} <small>({new Date(msg.timestamp).toLocaleTimeString()})</small>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} style={{ display: 'flex' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{ flexGrow: 1, marginRight: '10px' }}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatWindow;
