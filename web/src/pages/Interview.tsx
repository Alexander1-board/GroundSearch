import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Message { role: string; content: string; }

export default function Interview(){
  const nav = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [outline, setOutline] = useState<any>({});
  const [input, setInput] = useState('');

  useEffect(() => {
    fetch('/api/chat/start', { method: 'POST' })
      .then(r=>r.json())
      .then(d => {
        setSessionId(d.sessionId);
        setMessages([{ role: 'assistant', content: d.message }]);
        setOutline(d.outline || {});
      });
  }, []);

  const send = async () => {
    if(!sessionId) return;
    const res = await fetch(`/api/chat/${sessionId}/reply`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ message: input }) });
    const data = await res.json();
    setMessages(m => [...m, { role: 'user', content: input }, { role: 'assistant', content: data.reply }]);
    setOutline((o:any) => ({ ...o, ...data.outline }));
    setInput('');
  };

  const useAsBrief = async () => {
    if(!sessionId) return;
    const res = await fetch('/api/interview/finalise', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId }) });
    const brief = await res.json();
    localStorage.setItem('brief', JSON.stringify(brief));
    nav('/plan');
  };

  const complete = Boolean(outline.objective && (outline.key_questions?.length || 0) > 0 && (outline.scope?.domains?.length || 0) > 0);

  return (
    <div className="p-4 space-y-2 grid grid-cols-2 gap-4">
      <div>
        <h1 className="text-xl font-bold">Interview</h1>
        <div className="border p-2 h-64 overflow-auto mb-2">
          {messages.map((m,i)=> <div key={i}><strong>{m.role}</strong>: {m.content}</div>)}
        </div>
        <input value={input} onChange={e=>setInput(e.target.value)} className="border w-full" />
        <div className="space-x-2 mt-2">
          <button onClick={send} className="underline">Send</button>
          <button onClick={useAsBrief} disabled={!complete} className="underline disabled:text-gray-400">Use as Brief</button>
        </div>
      </div>
      <div className="border p-2 text-sm space-y-1">
        <div><strong>Objective:</strong> {outline.objective || ''}</div>
        <div><strong>Key Questions:</strong> {(outline.key_questions || []).join('; ')}</div>
        <div><strong>Timeframe:</strong> {outline.scope?.timeframe?.from || ''} - {outline.scope?.timeframe?.to || ''}</div>
        <div><strong>Domains:</strong> {(outline.scope?.domains || []).join(', ')}</div>
        <div><strong>Comparators:</strong> {(outline.scope?.comparators || []).join(', ')}</div>
        <div><strong>Deliverable:</strong> {outline.deliverable?.format || ''}</div>
        <div><strong>Success Criteria:</strong> {(outline.success_criteria || []).join('; ')}</div>
      </div>
    </div>
  );
}
