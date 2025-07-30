// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import Config from '../../web/src/pages/Config.js';

const mockCfg = {
  default_provider: 'mock',
  default_model: 'mock-model',
  interview_preprompt: 'hi',
  enabled_tools: []
};

describe('Config page', () => {
  it('renders with fetched data', async () => {
    const fetchMock = vi.fn((url:string) => {
      if(url === '/api/config') return Promise.resolve({ json: () => Promise.resolve(mockCfg) } as any);
      if(url === '/api/providers') return Promise.resolve({ json: () => Promise.resolve({ providers:[{id:'mock', models:['mock-model'], available:true}] }) } as any);
      if(url === '/api/config/secrets') return Promise.resolve({ json: () => Promise.resolve({ flags:{} }) } as any);
      return Promise.reject(new Error('unexpected ' + url));
    });
    global.fetch = fetchMock as any;
    render(<BrowserRouter><Config /></BrowserRouter>);
    await waitFor(() => expect(screen.getByText('Config')).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith('/api/config');
  });
});
