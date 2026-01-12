import React from 'react';
import Header from '../components/Layout/Header';
import Sidebar from '../components/Layout/Sidebar';
import ChatWindow from '../components/ChatIA/ChatWindow';
import TasksPanel from '../components/ChatIA/TasksPanel';
import { isEmbedMode } from '../utils/embed';

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className={isEmbedMode() ? "container flex py-0" : "container flex gap-6 py-6"}>
        <Sidebar />
        <main className={isEmbedMode() ? "flex-1 grid grid-cols-1 gap-4" : "flex-1 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4"}>
          <div className="bg-white shadow-soft rounded p-0 h-[70vh]">
            <ChatWindow />
          </div>
          <div className="h-[70vh]">
            <TasksPanel />
          </div>
        </main>
      </div>
    </div>
  );
}
