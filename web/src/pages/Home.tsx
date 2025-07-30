import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface Run { runId: string; status: string; updatedAt?: number; startedAt?: number; }

export default function Home() {
  const nav = useNavigate();
  const [runs, setRuns] = useState<Run[]>([]);
  const [newModal, setNewModal] = useState(false);
  const [planModal, setPlanModal] = useState<any|null>(null);
  const [brief, setBrief] = useState('{}');

  useEffect(() => { fetch('/api/runs').then(r => r.json()).then(d => setRuns(d.runs || [])); }, []);

  const startBlank = async () => {
    try {
      const data = await fetch('/api/agent/start', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ brief: JSON.parse(brief) })}).then(r=>r.json());
      nav(`/run/${data.runId}`);
    } catch {
      alert('Invalid brief JSON');
    }
  };

  const showPlan = async (id: string) => {
    const res = await fetch(`/api/agent/${id}/plan`);
    if(res.ok) setPlanModal(await res.json());
    else alert('Plan not found');
  };

  const openReport = async (id: string) => {
    const res = await fetch('/api/report/generate',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ runId:id })});
    if(res.ok) nav(`/report/${id}`);
    else {
      const d = await res.json().catch(()=>({ error:'error' }));
      alert(d.error || d.message || 'error');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">AutoResearch</h1>
      <div className="space-x-2 text-sm">
        <button onClick={()=>nav('/interview')} className="underline">New Interview</button>
        <button onClick={()=>setNewModal(true)} className="underline">New Run (Blank)</button>
        <button onClick={()=>nav('/config')} className="underline">Config</button>
      </div>
      <h2 className="font-semibold">Recent Runs</h2>
      <table className="text-sm border-collapse">
        <thead><tr className="text-left"><th>ID</th><th>Status</th><th>Started</th><th>Updated</th><th>Actions</th></tr></thead>
        <tbody>
          {runs.map(r => (
            <tr key={r.runId} className="border-t">
              <td className="pr-2">{r.runId}</td>
              <td className="pr-2">{r.status}</td>
              <td className="pr-2">{r.startedAt ? new Date(r.startedAt).toLocaleString() : ''}</td>
              <td className="pr-2">{r.updatedAt ? new Date(r.updatedAt).toLocaleString() : ''}</td>
              <td className="space-x-2">
                <Link to={`/run/${r.runId}`} className="underline">Open</Link>
                <button onClick={()=>showPlan(r.runId)} className="underline">Plan</button>
                <button onClick={()=>openReport(r.runId)} className="underline">Report</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {newModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center" onClick={()=>setNewModal(false)}>
          <div className="bg-white p-4 max-w-lg w-full" onClick={e=>e.stopPropagation()}>
            <h2 className="font-semibold mb-2">New Run Brief</h2>
            <textarea value={brief} onChange={e=>setBrief(e.target.value)} className="border w-full h-40 text-xs"/>
            <div className="space-x-2 mt-2 text-sm">
              <button onClick={startBlank} className="underline">Start</button>
              <button onClick={()=>setNewModal(false)} className="underline">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {planModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center" onClick={()=>setPlanModal(null)}>
          <div className="bg-white p-4 max-w-lg max-h-[80vh] overflow-auto" onClick={e=>e.stopPropagation()}>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(planModal,null,2)}</pre>
            <button onClick={()=>setPlanModal(null)} className="underline mt-2 text-sm">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
