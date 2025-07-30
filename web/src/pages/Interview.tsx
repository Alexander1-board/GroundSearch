import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Message { role: string; content: string; }

export default function Interview(){
  const nav = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    fetch('/api/chat/start', { method: 'POST' }).then(r=>r.json()).then(d => {
      setSessionId(d.sessionId);
      setMessages([d.firstMessage]);
    });
  }, []);

  const send = async () => {
    if(!sessionId) return;
    const res = await fetch(`/api/chat/${sessionId}/reply`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ message: input }) });
    const data = await res.json();
    setMessages(m => [...m, { role: 'user', content: input }, data.reply]);
    setInput('');
  };

  const useAsBrief = async () => {
    if(!sessionId) return;
    const res = await fetch('/api/interview/finalise', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sessionId }) });
    const brief = await res.json();
    localStorage.setItem('brief', JSON.stringify(brief));
    nav('/plan');
  };

  return (
    <div className="p-4 space-y-2">
      <h1 className="text-xl font-bold">Interview</h1>
      <div className="border p-2 h-64 overflow-auto">
        {messages.map((m,i)=> <div key={i}><strong>{m.role}</strong>: {m.content}</div>)}
      </div>
      <input value={input} onChange={e=>setInput(e.target.value)} className="border w-full" />
      <div className="space-x-2">
        <button onClick={send} className="underline">Send</button>
        <button onClick={useAsBrief} className="underline">Use as Brief</button>
      </div>
    </div>
  );
}
