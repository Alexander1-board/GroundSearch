import { v4 as uuidv4 } from 'uuid';
import { loadConfig } from '../config/user-config.js';
import { appendMessage, getMessages } from '../lib/chat-storage.js';
import { LLMClient } from '../types/llm.js';
import { getLLM } from '../providers/registry.js';
import { INTERVIEW_PROMPT } from '../spec/prompts.js';
import { logger } from '../lib/logger.js';
import { z } from 'zod';
import { ResearchBriefSchema } from '../spec/schemas.js';

const OutlineSchema = ResearchBriefSchema.partial();
const ReplySchema = z.object({ reply: z.string(), outline: OutlineSchema });

export async function startSession(llm?: LLMClient){
  const cfg = await loadConfig();
  const sessionId = uuidv4();
  const client = llm || getLLM(cfg.default_provider as any, cfg.default_model);
  const pre = cfg.interview_preprompt;
  const systemMsg = { role: 'system', content: pre + '\n' + INTERVIEW_PROMPT };
  await appendMessage(sessionId, systemMsg);
  await appendMessage(sessionId, { role: 'meta', content: JSON.stringify({ provider: client.provider, model: client.model }) });
  const { reply, outline } = await client.generateJSON(systemMsg.content, ReplySchema, {
    mockData: { reply: 'Hello, what is your research objective?', outline: {} }
  });
  const firstMsg = { role: 'assistant', content: reply, outline } as any;
  await appendMessage(sessionId, firstMsg);
  logger.info('chat session started', { sessionId, provider: client.provider });
  return { sessionId, message: reply, outline };
}

export async function replySession(sessionId: string, userMsg: string, llm?: LLMClient, preprompt?: string){
  const cfg = await loadConfig();
  const client = llm || getLLM(cfg.default_provider as any, cfg.default_model);
  const pre = preprompt || cfg.interview_preprompt;
  await appendMessage(sessionId, { role: 'user', content: userMsg });
  const transcript = await getMessages(sessionId);
  const conv = transcript.filter(m=>m.role!=='meta').map(m=>`${m.role.toUpperCase()}: ${m.content}`).join('\n');
  const prompt = pre + '\n' + INTERVIEW_PROMPT + '\n\n' + conv;
  const out = await client.generateJSON(prompt, ReplySchema, { mockData: { reply: 'Ok.', outline: { objective: userMsg } } });
  await appendMessage(sessionId, { role: 'assistant', content: out.reply, outline: out.outline } as any);
  logger.debug('chat reply', { sessionId, len: transcript.length });
  return out;
}
