import axios from 'axios';

const aiBaseURL = import.meta.env.VITE_AI_BASE_URL || '';
const isLocalAI = (import.meta.env.VITE_AI_LOCAL === '1' || import.meta.env.VITE_AI_LOCAL === 'true') || !!import.meta.env.VITE_OLLAMA_MODEL;
const ollamaBase = import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434';
const ollamaModel = import.meta.env.VITE_OLLAMA_MODEL || 'llama3.1';

export const IS_LOCAL_AI = isLocalAI;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export async function sendChatMessage(sessionId: string, text: string) {
  if (isLocalAI) {
    // IA Local vía Ollama (no streaming)
    const { data } = await axios.post(`${ollamaBase}/api/generate`, {
      model: ollamaModel,
      prompt: text,
      stream: false,
      options: { temperature: 0.2 }
    });
    const content: string = data?.response ?? '';
    const message: ChatMessage = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: Date.now(),
    };
    return { message };
  } else {
    const { data } = await axios.post(`${aiBaseURL}/chat/send`, { sessionId, text });
    return data as { message: ChatMessage };
  }
}

export async function uploadData(sessionId: string, file: File) {
  if (isLocalAI) {
    // No soportado en modo local por defecto
    return { status: 'unsupported' } as { status: string };
  } else {
    const form = new FormData();
    form.append('sessionId', sessionId);
    form.append('file', file);
    const { data } = await axios.post(`${aiBaseURL}/chat/upload`, form);
    return data as { status: string };
  }
}
