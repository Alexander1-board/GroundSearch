// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RunDashboard from '../../web/src/pages/RunDashboard.js';

class MockEventSource {
  url:string; cb:Record<string,(e:any)=>void> = {};
  constructor(url:string){ this.url = url; }
  addEventListener(t:string, fn:(e:any)=>void){ this.cb[t]=fn; }
  close(){}
}

describe('RunDashboard page', () => {
  it('renders basic layout', () => {
    (global as any).ResizeObserver = class { observe(){} unobserve(){} disconnect(){} };
    (global as any).EventSource = MockEventSource as any;
    const fetchMock = vi.fn((url:string) => {
      if(url.endsWith('/plan')) return Promise.resolve({ ok:true, json: () => Promise.resolve({ steps: [] }) } as any);
      return Promise.reject(new Error('unexpected '+url));
    });
    global.fetch = fetchMock as any;
    render(
      <MemoryRouter initialEntries={["/run/abc"]}>
        <Routes><Route path="/run/:runId" element={<RunDashboard/>} /></Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Run abc')).toBeInTheDocument();
  });
});
