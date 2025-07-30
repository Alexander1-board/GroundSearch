// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import Interview from '../../web/src/pages/Interview.js';

describe('Interview page', () => {
  it('shows first message from server', async () => {
    const fetchMock = vi.fn((url:string, opts?:any) => {
      if(url === '/api/chat/start') return Promise.resolve({ json: () => Promise.resolve({ sessionId:'1', message:'hello', outline:{} }) } as any);
      if(url.startsWith('/api/chat/')) return Promise.resolve({ json: () => Promise.resolve({ reply:'ok', outline:{} }) } as any);
      if(url === '/api/interview/finalise') return Promise.resolve({ json: () => Promise.resolve({}) } as any);
      return Promise.reject(new Error('unexpected ' + url));
    });
    global.fetch = fetchMock as any;
    render(<BrowserRouter><Interview /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText(/assistant/)).toBeInTheDocument());
  });
});
