import Dashboard from "../components/ui/Dashboard";
import React, { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { AnimatePresence } from "framer-motion";



interface ChatMessage {
  user: string;
  message: string;
  timestamp: string;
}

const DashboardAdminWebChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(`${import.meta.env.VITE_BACKEND_URL}`);

    // Join the channel when component mounts
    socketRef.current.emit('joinChannel', 'someUniqueChannelId');

    // Listen for incoming messages
    socketRef.current.on('receiveMessage', (message: ChatMessage) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Clean up on component unmount
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (messageInput.trim()) {
      // Emit the message
      socketRef.current?.emit('sendMessage', messageInput);
      // Clear the input field
      setMessageInput('');
    }
  };

  return (

    <Dashboard>
        <AnimatePresence>
            <div>
              <div>
                <ul>
                  {messages.map((msg, index) => (
                    <li key={index}>
                      {msg.message} <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
                    </li>
                  ))}
                </ul>
              </div>
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type your message"
              />
              <button onClick={sendMessage}>Send</button>
            </div>
        </AnimatePresence>
    </Dashboard>
  );
};

export default DashboardAdminWebChat;
