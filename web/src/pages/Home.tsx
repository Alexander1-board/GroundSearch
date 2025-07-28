import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface Run { runId: string; status: string; }

export default function Home() {
  const [runs, setRuns] = useState<Run[]>([]);
  useEffect(() => { fetch('/api/runs').then(r => r.json()).then(d => setRuns(d.runs || [])); }, []);

  return (
    <div className="p-4 space-y-2">
      <h1 className="text-xl font-bold">AutoResearch</h1>
      <div className="space-x-2">
        <Link to="/interview" className="underline">New Interview</Link>
        <Link to="/config" className="underline">Config</Link>
      </div>
      <h2 className="font-semibold mt-4">Recent Runs</h2>
      <ul className="list-disc pl-5">
        {runs.map(r => (
          <li key={r.runId}>
            {r.runId} - {r.status} <Link to={`/run/${r.runId}`} className="underline">Open</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
