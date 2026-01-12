import axios from 'axios';

const aiBaseURL = import.meta.env.VITE_AI_BASE_URL || '';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export async function sendChatMessage(sessionId: string, text: string) {
  const { data } = await axios.post(`${aiBaseURL}/chat/send`, { sessionId, text });
  return data as { message: ChatMessage };
}

export async function uploadData(sessionId: string, file: File) {
  const form = new FormData();
  form.append('sessionId', sessionId);
  form.append('file', file);
  const { data } = await axios.post(`${aiBaseURL}/chat/upload`, form);
  return data as { status: string };
}
