import { describe, it, expect } from 'vitest';
import { startSession, replySession } from '../src/agents/conversation.js';
import { MockLLMClient } from '../src/types/llm.js';

describe('Conversation agent', () => {
  it('collects objective', async () => {
    const llm = new MockLLMClient('mock','1');
    const { sessionId, message } = await startSession(llm);
    expect(message).toBeTypeOf('string');
    const res = await replySession(sessionId, 'Research obesity treatments', llm);
    expect(res.reply).toBeTypeOf('string');
  });
});
