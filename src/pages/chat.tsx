import Dashboard from "../components/ui/Dashboard";

import React, { useState, useEffect, useRef, ChangeEvent, KeyboardEvent } from 'react';
import io, { Socket } from 'socket.io-client';
import { AnimatePresence } from "framer-motion";
import {MessageSquare, SendHorizonal, Tent, User} from "lucide-react";
import { motion } from "framer-motion";


interface ChatChannel {
  id: string;
  lastMessage: string;
  lastActive: Date;
}

interface ChatMessage {
  user: string;
  message: string;
  timestamp: string;
}

const DashboardAdminWebChat: React.FC = () => {
  const [chatList, setChatList] = useState<ChatChannel[]>([{
    id:"sdfasdfasdfasdfasdf",
    lastMessage:"Hola",
    lastActive:new Date(2024,6,12)
  }]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      user:"admin",
      message:"hola",
      timestamp:"20241202"
    },
    {
      user:"user",
      message:"hola2",
      timestamp:"20241202"
    },
  ]);
  const socketRef = useRef<Socket | null>(null);

  // Ref for the messages container
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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


  const [input, setInput] = useState<string>("");

  const handleSendMessage = (): void => {
    if (input.trim()) {
      const newMessage: ChatMessage = { message: input, user: "admin", timestamp:"" };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      socketRef.current?.emit('sendMessage', input);
      setInput("");
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (

    <Dashboard>
        <AnimatePresence>
          <div className="grid grid-cols-8 gap-4 row-span-7">
            <div className="col-span-2 flex flex-col border rounded-xl py-4 px-2">
              <h2 className="text-tertiary font-primary text-lg mb-4">Active Chats</h2>
              <ul className="w-full flex flex-col h-full">
                {chatList.map(chat => (
                  <li key={chat.id} className="border rounded-xl p-3 bg-white hover:bg-secondary cursor-pointer transition-all duration-300 group active:scale-95">
                    <div className="w-full h-auto flex flex-row justify-between group-hover:text-white">
                      <p className="font-primary text-sm group-hover:text-white">Usuario: {chat.id}</p>
                      <p className="font-secondary text-xs group-hover:text-white">{new Date(chat.lastActive).toISOString().split("T")[0]}</p>
                    </div>
                    <p className="font-secondary text-xs group-hover:text-white">Last Message: {chat.lastMessage}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-6 flex flex-col border rounded-xl py-2 px-2">

              <div className="w-full h-12 flex flex-row justify-between px-4 py-2 bg-secondary text-white p-4 rounded-t-lg cursor-pointer">
              
                <h2 className="text-sm font-primary flex flex-row items-center gap-x-2"><User/>{"User: 12312312312312312312"}</h2>
                <span className="text-xl cursor-pointer"><MessageSquare/></span>
              </div>


              <ul className="py-4 px-2 h-full overflow-y-auto no-scroll-bar flex flex-col">
                {messages.map((msg, index) => (
                  <div key={`message_${index}`} className={`flex w-full ${ msg.user !== "user" ? "flex-row-reverse justify-start" : "flex-row justify-start" } gap-x-2`}>
                    <div className={`${ msg.user === "user" ? "bg-secondary " : "bg-white border-2 border-secondary" } w-8 h-8 rounded-full flex items-center justify-center`}>
                      {msg.user !== "user" ?
                        <Tent className="text-secondary h-5 w-5"/>
                      :
                        <User className="text-white h-6 w-6"/>
                      }
                    </div>
                    <motion.div
                      initial={{
                          scale: 0,
                          originX: msg.user !== "user" ? 1 : 0, // Right bottom for user, left bottom for bot
                          originY: 1, // Bottom scale
                        }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                      key={index}
                      className={`mb-2 p-2 text-xs w-auto max-w-[70%] h-auto bg-secondary text-white ${
                        msg.user !== "user"
                          ? "text-right rounded-l-lg rounded-tr-lg"
                          : "text-left rounded-r-lg rounded-tl-lg"
                      }`}
                    >
                      {msg.message}
                    </motion.div>
                  </div>
                ))}
              </ul>

              <div className="flex p-2 border-t h-14">
                <input
                  type="text"
                  className="flex-grow border border-gray-300 p-2 rounded-l-lg text-sm font-secondary text-secondary focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
                  placeholder={"Type a message..."}
                  value={input}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                />
                <button
                  className="bg-secondary text-white p-2 rounded-r-lg active:scale-95 duration-300 "
                  onClick={handleSendMessage}
                >
                  <SendHorizonal  className="h-5 w-5"/>
                </button>
              </div>
              <div ref={messagesEndRef} />
            </div>
          </div>
        </AnimatePresence>
    </Dashboard>
  );
};

export default DashboardAdminWebChat;
