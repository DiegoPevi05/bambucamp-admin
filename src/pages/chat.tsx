import Dashboard from "../components/ui/Dashboard";

import React, { useState, useEffect, useRef, ChangeEvent, KeyboardEvent } from 'react';
import io, { Socket } from 'socket.io-client';
import { AnimatePresence } from "framer-motion";
import {MessageSquare, SendHorizonal, Tent, User} from "lucide-react";
import { motion } from "framer-motion";
import {useAuth} from "../contexts/AuthContext";
import {getAllWebChats, getMessages} from "../db/actions/chats";


interface ChatChannel {
  id: string;
  lastMessage: string;
  lastActive: Date;
}

interface ChatMessage {
  user: string;
  message: string;
  user_type:string;
  userName:string;
  timestamp: string;
}

const DashboardAdminWebChat: React.FC = () => {
  const { user } = useAuth();
  const [chatList, setChatList] = useState<ChatChannel[] | null>([]);
  const [currentChannel, setCurrentChannel] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>("");

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (user) {
      // Initialize socket connection
      socketRef.current = io(`${import.meta.env.VITE_BACKEND_URL}`);

      socketRef.current.emit('authenticate', user.token);

      socketRef.current.on('receiveMessage', (message: ChatMessage) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });

      socketRef.current.on('newChatMessage', (updatedChat: ChatChannel) => {
        setChatList((prevList) => {
          if (prevList) {
            return [...prevList, updatedChat];
          }
          return prevList;
        });
      });

      // Fetch chat list initially
      const fetchChatList = async () => {
        const chats = await getAllWebChats(user.token, 1); // Fetch first page of chats
        setChatList(chats);
      };

      fetchChatList();

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [user]);

  const handleChannelSelect = async(channelId: string) => {
    setCurrentChannel(channelId);
    if(user){
      console.log("this is executed")
      const messages = await getMessages(user.token,channelId);
      if(messages){
        setMessages(messages);
      }
    }
    socketRef.current?.emit('joinChannel', channelId);
  };

  const handleSendMessage = (): void => {
    if (input.trim() && currentChannel) {
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
              <ul className="w-full flex flex-col h-full gap-y-2">
                {chatList && chatList.map(chat => (
                  <li
                    key={chat.id}
                    className={`border rounded-xl p-3  hover:bg-secondary cursor-pointer transition-all duration-300 group ${currentChannel === chat.id ? 'bg-secondary text-white' : 'bg-white text-secondary'}`}
                    onClick={() => handleChannelSelect(chat.id)}
                  >
                    <div className="w-full h-auto flex flex-row justify-between group-hover:text-white">
                      <p className="font-primary text-sm group-hover:text-white">Chat: {chat.id.slice(0,10)+"..."}</p>
                      <p className="font-secondary text-xs group-hover:text-white">{new Date(chat.lastActive).toISOString().split("T")[0]}</p>
                    </div>
                    <p className="font-secondary text-xs group-hover:text-white">Last Message: {chat.lastMessage}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-6 flex flex-col border rounded-xl py-2 px-2">

              <div className="w-full h-12 flex flex-row justify-between px-4 py-2 bg-secondary text-white p-4 rounded-t-lg cursor-pointer">
              
                <h2 className="text-sm font-primary flex flex-row items-center gap-x-2"><User/>{"Informes"}</h2>
                <span className="text-xl cursor-pointer"><MessageSquare/></span>
              </div>


              <ul className="py-4 px-2 h-full overflow-y-auto no-scroll-bar flex flex-col">
                {messages.map((msg, index) => (
                  <div key={`message_${index}`} className={`flex w-full ${ msg.user_type !== "external" ? "flex-row-reverse justify-start" : "flex-row justify-start" } gap-x-2`}>
                    <div className={`${ msg.user_type === "external" ? "bg-secondary " : "bg-white border-2 border-secondary" } w-8 h-8 rounded-full flex items-center justify-center`}>
                      {msg.user_type !== "external" ?
                        <Tent className="text-secondary h-5 w-5"/>
                      :
                        <User className="text-white h-6 w-6"/>
                      }
                    </div>
                    <motion.div
                      initial={{
                          scale: 0,
                          originX: msg.user_type !== "external" ? 1 : 0, // Right bottom for user, left bottom for bot
                          originY: 1, // Bottom scale
                        }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                      key={index}
                      className={`mb-2 p-2 text-xs w-auto max-w-[70%] h-auto bg-secondary text-white ${
                        msg.user_type !== "external"
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
