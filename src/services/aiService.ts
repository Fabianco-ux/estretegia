import axios from 'axios';

const provider = (import.meta.env.VITE_AI_PROVIDER || '').toLowerCase();
const aiBaseURL = import.meta.env.VITE_AI_BASE_URL || '';

// Local (Ollama)
const isLocalAI = (import.meta.env.VITE_AI_LOCAL === '1' || import.meta.env.VITE_AI_LOCAL === 'true') || provider === 'ollama' || !!import.meta.env.VITE_OLLAMA_MODEL;
const ollamaBase = import.meta.env.VITE_OLLAMA_BASE_URL || 'http://localhost:11434';
const ollamaModel = import.meta.env.VITE_OLLAMA_MODEL || 'llama3.1';

// DeepSeek
const isDeepSeek = provider === 'deepseek';
const deepseekBase = import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const deepseekModel = import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-chat';
const deepseekKey = import.meta.env.VITE_DEEPSEEK_API_KEY || '';

export const IS_LOCAL_AI = isLocalAI;

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export async function sendChatMessage(sessionId: string, text: string) {
  if (isDeepSeek && deepseekKey) {
    const { data } = await axios.post(
      `${deepseekBase}/v1/chat/completions`,
      {
        model: deepseekModel,
        messages: [
          { role: 'system', content: 'Eres un asistente útil y conciso.' },
          { role: 'user', content: text }
        ],
        temperature: 0.4,
        stream: false
      },
      {
        headers: { Authorization: `Bearer ${deepseekKey}` }
      }
    );
    const content: string = data?.choices?.[0]?.message?.content ?? '';
    const message: ChatMessage = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: Date.now(),
    };
    return { message };
  }

  if (isLocalAI) {
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
  }

  const { data } = await axios.post(`${aiBaseURL}/chat/send`, { sessionId, text });
  return data as { message: ChatMessage };
}

export async function uploadData(sessionId: string, file: File) {
  if (isLocalAI || isDeepSeek) {
    // No soportado en local ni DeepSeek directo
    return { status: 'unsupported' } as { status: string };
  }
  const form = new FormData();
  form.append('sessionId', sessionId);
  form.append('file', file);
  const { data } = await axios.post(`${aiBaseURL}/chat/upload`, form);
  return data as { status: string };
}
