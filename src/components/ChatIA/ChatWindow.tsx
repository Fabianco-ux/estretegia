import React, { useEffect, useMemo, useState } from 'react';
import UploadButton from './UploadButton';
import ChatMessageView from './ChatMessage';
import { sendFile, sendText, ChatMessage } from './chatService';
import { defaultStrategyMetrics, generateStrategy, StrategyTask } from './strategyBot';
import { EXPERT_PROMPT } from './strategyPrompt';
import TaskBoard, { TaskBoardItem, TaskStatus } from './TaskBoard';
import { useAuth } from '../../contexts/AuthContext';
import { subscribeTasks, addTask, updateTask as updateTaskDoc, deleteTask as deleteTaskDoc } from '../../services/tasksService';

export default function ChatWindow() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [tasks, setTasks] = useState<TaskBoardItem[]>([]);
  const [usePrompt, setUsePrompt] = useState(true);
  const messagesRef = React.useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeTasks(currentUser.uid, (items) => {
      setTasks(items.map(i => ({ id: i.id, title: i.title, detail: i.detail, status: i.status })));
    }, (err) => {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: `Error cargando tareas: ${err?.message || 'desconocido'}`, timestamp: Date.now() }]);
    });
    return () => { try { unsub(); } catch {} };
  }, [currentUser]);
  const sessionId = useMemo(() => {
    let id = sessionStorage.getItem('chat_session');
    if (!id) {
      id = Math.random().toString(36).slice(2);
      sessionStorage.setItem('chat_session', id);
    }
    return id;
  }, []);

  useEffect(() => {
    // restore messages from session if needed
    const raw = sessionStorage.getItem('chat_messages');
    if (raw) setMessages(JSON.parse(raw));
  }, []);

  useEffect(() => {
    sessionStorage.setItem('chat_messages', JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Primear la sesión con el prompt experto (una sola vez)
  useEffect(() => {
    const primedKey = `chat_prompt_primed_${sessionId}`;
    const already = sessionStorage.getItem(primedKey);
    if (usePrompt && !already) {
      (async () => {
        try {
          await sendText(sessionId, EXPERT_PROMPT);
          sessionStorage.setItem(primedKey, '1');
          setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'Contexto experto aplicado. Comparte tus métricas o preguntas.', timestamp: Date.now() }]);
        } catch {}
      })();
    }
  }, [sessionId, usePrompt]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    try {
      const payload = usePrompt ? `${EXPERT_PROMPT}\n\nEntrada\n${userMsg.content}` : userMsg.content;
      const { message } = await sendText(sessionId, payload);
      setMessages(prev => [...prev, message]);
    } catch (e) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'Error enviando mensaje', timestamp: Date.now() }]);
    }
  };

  const handleDeleteMessage = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const handleClearChat = () => {
    setMessages([]);
    sessionStorage.removeItem('chat_messages');
  };

  const handleUpload = async (file: File) => {
    try {
      await sendFile(sessionId, file);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'Archivo recibido y en análisis', timestamp: Date.now() }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'Error al subir archivo', timestamp: Date.now() }]);
    }
  };

  // Eliminado: la generación de estrategia y tareas se movió al TasksPanel

  return (
    <div className="relative flex flex-col h-full w-full">
      <div className="flex items-center justify-between border-b p-2 bg-white">
        <div className="font-medium">Chat IA</div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 text-sm text-gray-700">
            <input type="checkbox" checked={usePrompt} onChange={e => setUsePrompt(e.target.checked)} />
            Usar prompt experto
          </label>
          <button onClick={handleClearChat} className="px-2 py-1 text-sm rounded bg-green-700 text-white hover:bg-green-800">Limpiar Chat</button>
          <UploadButton onFileSelected={handleUpload} />
        </div>
      </div>
      <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-gray-100">
        {messages.map(m => (
          <ChatMessageView key={m.id} msg={m} onDelete={handleDeleteMessage} />
        ))}
      </div>
      <div className="p-3 bg-white border-t flex items-end gap-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={1}
          placeholder="Escribe tu mensaje... (Ctrl+Enter para enviar)"
          className="flex-1 border rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-sm"
        />
        <button onClick={handleSend} className="px-3 py-2 bg-blue-700 text-white rounded-xl hover:bg-blue-800 shadow-sm">Enviar</button>
      </div>

    </div>
  );
}
