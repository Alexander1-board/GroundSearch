import { v4 as uuidv4 } from 'uuid';
import { loadConfig } from '../config/user-config.js';
import { appendMessage, getMessages } from '../lib/chat-storage.js';
import { LLMClient } from '../types/llm.js';
import { getLLM } from '../providers/registry.js';
import { INTERVIEW_PROMPT } from '../spec/prompts.js';
import { logger } from '../lib/logger.js';

export async function startSession(llm?: LLMClient){
  const cfg = await loadConfig();
  const sessionId = uuidv4();
  const client = llm || getLLM(cfg.default_provider as any, cfg.default_model);
  const first = { role: 'system', content: cfg.interview_preprompt };
  await appendMessage(sessionId, first);
  // Persist provider info for the session (not used yet)
  await appendMessage(sessionId, { role: 'meta', content: JSON.stringify({ provider: client.provider, model: client.model }) });
  logger.info('chat session started', { sessionId, provider: client.provider });
  return { sessionId, firstMessage: first };
}

export async function replySession(sessionId: string, userMsg: string, llm?: LLMClient){
  const cfg = await loadConfig();
  const client = llm || getLLM(cfg.default_provider as any, cfg.default_model);
  await appendMessage(sessionId, { role: 'user', content: userMsg });
  const transcript = await getMessages(sessionId);
  // simple mock: return outline when 3 messages reached
  const outline = transcript.length > 3 ? { objective: transcript[1]?.content || 'Research objective' } : undefined;
  const reply = { role: 'assistant', content: 'Acknowledged.' };
  await appendMessage(sessionId, reply);
  logger.debug('chat reply', { sessionId, len: transcript.length });
  return { reply, outline };
}
