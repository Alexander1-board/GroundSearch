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
  const first = { role: 'system', content: cfg.interview_preprompt + '\n' + INTERVIEW_PROMPT };
  await appendMessage(sessionId, first);
  const greet = { role: 'assistant', content: 'Hello, what is your research objective?' };
  await appendMessage(sessionId, greet);
  // Persist provider info for the session (not used yet)
  await appendMessage(sessionId, { role: 'meta', content: JSON.stringify({ provider: client.provider, model: client.model }) });
  logger.info('chat session started', { sessionId, provider: client.provider });
  return { sessionId, firstMessage: greet };
}

export async function replySession(sessionId: string, userMsg: string, llm?: LLMClient){
  const cfg = await loadConfig();
  const client = llm || getLLM(cfg.default_provider as any, cfg.default_model);
  await appendMessage(sessionId, { role: 'user', content: userMsg });
  const transcript = await getMessages(sessionId);
  const outline: any = {};
  for(const m of transcript){
    if(m.role==='user' && !outline.objective){ outline.objective = m.content; }
  }
  let reply = { role: 'assistant', content: '' };
  if(!outline.objective){
    reply.content = 'What is the main research objective?';
  }else{
    reply.content = 'Thank you. Brief noted.';
  }
  await appendMessage(sessionId, reply);
  logger.debug('chat reply', { sessionId, len: transcript.length });
  const out: any = { reply, outline };
  if(process.env.ALLOW_DEBUG_TRACES==='true') out.rationale_summary = 'heuristic conversation';
  return out;
}
