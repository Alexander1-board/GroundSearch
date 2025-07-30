import { describe, it, expect } from 'vitest';
import { startSession, replySession } from '../src/agents/conversation.js';
import { MockLLMClient } from '../src/types/llm.js';

describe('Conversation agent', () => {
  it('collects objective', async () => {
    const llm = new MockLLMClient('mock','1');
    const { sessionId } = await startSession(llm);
    const res = await replySession(sessionId, 'Research obesity treatments', llm);
    expect(res.outline?.objective).toBe('Research obesity treatments');
  });
});
