import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Plan(){
  const nav = useNavigate();
  const [plan, setPlan] = useState<any>(null);
  const [brief] = useState(()=>{
    const b = localStorage.getItem('brief');
    return b ? JSON.parse(b) : null;
  });

  useEffect(() => {
    if(!brief){ nav('/interview'); return; }
    fetch('/api/plan/preview', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ brief })})
      .then(r=>r.json()).then(setPlan);
  }, []);

  const run = async () => {
    if(!brief) return;
    const res = await fetch('/api/agent/start', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ brief })});
    const data = await res.json();
    nav(`/run/${data.runId}`);
  };

  if(!plan) return <div>Loading plan...</div>;

  return (
    <div className="p-4 space-y-2">
      <h1 className="text-xl font-bold">Plan Review</h1>
      <pre className="bg-gray-100 p-2 text-xs overflow-auto h-60">{JSON.stringify(plan, null, 2)}</pre>
      <div className="space-x-2">
        <button onClick={run} className="underline">Run</button>
        <button onClick={()=>nav('/interview')} className="underline">Back</button>
      </div>
    </div>
  );
}
