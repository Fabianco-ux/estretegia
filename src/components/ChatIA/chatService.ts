import { sendChatMessage, uploadData, ChatMessage } from '../../services/aiService';

export async function sendText(sessionId: string, text: string) {
  return sendChatMessage(sessionId, text);
}

export async function sendFile(sessionId: string, file: File) {
  return uploadData(sessionId, file);
}

export type { ChatMessage };
