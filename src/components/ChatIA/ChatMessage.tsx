import React from 'react';
import { ChatMessage } from './chatService';

type Props = {
  msg: ChatMessage;
  onDelete?: (id: string) => void;
};

export default function ChatMessageView({ msg, onDelete }: Props) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`relative max-w-[75%] rounded-2xl px-3 py-2 shadow-sm ${
          isUser ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 border border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className={`text-xs ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>{isUser ? 'Tú' : 'Asistente'}</div>
          {onDelete && (
            <button
              aria-label="Eliminar mensaje"
              onClick={() => onDelete(msg.id)}
              className={`text-xs transition-opacity hover:opacity-100 opacity-70 ${isUser ? 'text-blue-100 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
            >
              ×
            </button>
          )}
        </div>
        <div className={`text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'text-white' : 'text-gray-800'}`}>{msg.content}</div>
        <div className={`mt-1 text-[11px] ${isUser ? 'text-blue-100' : 'text-gray-400'}`}>
          {new Date(msg.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
