import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Login from './components/Login';
import './App.css'; // Import external CSS

const SOCKET_URL = 'https://real-time-chat-socket-server.onrender.com';

function App() {
  // Authentication & Socket state
  const [user, setUser] = useState(null);
  const [jwt, setJwt] = useState(null);
  const [socket, setSocket] = useState(null);

  // For Private Chat (using usernames)
  const [recipientUsername, setRecipientUsername] = useState('');
  const [conversation, setConversation] = useState([]); // Active conversation

  // For Message Server
  const [serverMessages, setServerMessages] = useState([]);
  const [serverMessageInput, setServerMessageInput] = useState('');

  // General message input for private chat
  const [messageInput, setMessageInput] = useState('');

  // Dropdown switch for chat mode: "private" or "server"
  const [chatMode, setChatMode] = useState('server');

  // Key to store/retrieve conversation from localStorage
  const getConversationKey = (recipient) => {
    if (!user || !recipient) return null;
    return `conversation_${user.username}_${recipient}`;
  };

  // Load conversation from localStorage when recipientUsername changes
  useEffect(() => {
    if (user && recipientUsername) {
      const key = getConversationKey(recipientUsername);
      const storedConv = localStorage.getItem(key);
      if (storedConv) {
        setConversation(JSON.parse(storedConv));
      } else {
        setConversation([]); // Start with an empty conversation if none exists
      }
    }
  }, [user, recipientUsername]);

  // Save conversation to localStorage whenever it changes (for the active recipient)
  useEffect(() => {
    if (user && recipientUsername) {
      const key = getConversationKey(recipientUsername);
      localStorage.setItem(key, JSON.stringify(conversation));
    }
  }, [conversation, user, recipientUsername]);

  // Rehydrate login state from localStorage on mount.
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setJwt(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Initialize Socket.IO connection when we have JWT and user.
  useEffect(() => {
    if (jwt && user) {
      const newSocket = io(SOCKET_URL, {
        auth: { token: jwt, username: user.username },
        transports: ['websocket'],
        withCredentials: true
      });
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
      });

      // Listen for private messages.
      newSocket.on('private-message', ({ sender, message }) => {
        // If the incoming message is for the active conversation, update state.
        // (If you want to support notifications for messages from other users,
        // you might store them in a separate "inbox" state.)
        if (sender === recipientUsername) {
          setConversation((prev) => [...prev, { sender, text: message }]);
        }
      });

      // Listen for server replies.
      newSocket.on('server-reply', ({ message }) => {
        setServerMessages((prev) => [...prev, { sender: 'Server', text: message }]);
      });

      return () => newSocket.disconnect();
    }
  }, [jwt, user, recipientUsername]); // Note: recipientUsername dependency is optional for private messages

  // Handle login from the Login component.
  const handleLogin = (userData, token) => {
    setUser(userData);
    setJwt(token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    alert("Please note: The first few messages may take a bit of time to appear due to server lag.")
  };

  // Logout handler.
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setJwt(null);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  // Send a private message (using usernames).
  const handleSendPrivateMessage = () => {
    if (!socket || !recipientUsername || !messageInput.trim()) return;
    const msg = messageInput.trim();
    socket.emit('private-message', {
      sender: user.username,
      recipient: recipientUsername,
      message: msg,
    });
    // Immediately update conversation for fast UI feedback.
    setConversation((prev) => [...prev, { sender: 'me', text: msg }]);
    setMessageInput('');
  };

  // Send a message to the server.
  const handleSendServerMessage = () => {
    if (!socket || !serverMessageInput.trim()) return;
    const msg = serverMessageInput.trim();
    socket.emit('message-server', { message: msg });
    // Optionally add the message locally for immediate feedback.
    setServerMessages((prev) => [...prev, { sender: 'me', text: msg }]);
    setServerMessageInput('');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <div className="chat-mode-container">
        <label htmlFor="chatMode">Chat Mode:</label>
        <select
          id="chatMode"
          value={chatMode}
          onChange={(e) => setChatMode(e.target.value)}
        >
          <option value="private">Private Chat</option>
          <option value="server">Message Server</option>
        </select>
      </div>

      {chatMode === 'private' ? (
        // Private Chat UI
        <div className="private-chat">
          <h2>Private Chat</h2>
          <div className="form-section">
            <input
              type="text"
              placeholder="Enter recipient username"
              value={recipientUsername}
              onChange={(e) => setRecipientUsername(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="chat-window">
            {conversation.map((msg, index) => (
              <div key={index} className="message-container">
                <span className={`message ${msg.sender === 'me' ? 'sent' : 'received'}`}>
                  {msg.text}
                </span>
              </div>
            ))}
          </div>
          <div className="form-section">
            <input
              type="text"
              placeholder="Type your private message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              className="input-field"
            />
            <button onClick={handleSendPrivateMessage} className="send-button">
              Send
            </button>
          </div>
        </div>
      ) : (
        // Server Chat UI
        <div className="server-chat">
          <h2>Message the Server</h2>
          <div className="form-section">
            <input
              type="text"
              placeholder="Type your message to the server..."
              value={serverMessageInput}
              onChange={(e) => setServerMessageInput(e.target.value)}
              className="input-field"
            />
            <button onClick={handleSendServerMessage} className="send-button">
              Send to Server
            </button>
          </div>
          <div className="chat-window server-window">
            {serverMessages.map((msg, index) => (
              <div key={index} className="message-container">
                <span className={`message ${msg.sender === 'me' ? 'sent' : 'received'}`}>
                  {msg.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="logout-container">
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}

export default App;
