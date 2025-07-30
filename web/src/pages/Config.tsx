import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserConfig {
  default_provider: string;
  default_model: string;
  interview_preprompt: string;
  enabled_tools: string[];
}

export default function Config() {
  const nav = useNavigate();
  const [cfg, setCfg] = useState<UserConfig | null>(null);
  const [providers, setProviders] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(setCfg);
    fetch('/api/providers').then(r => r.json()).then(d => setProviders(d.providers || []));
  }, []);

  if (!cfg) return <div>Loading...</div>;

  const save = async () => {
    await fetch('/api/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg) });
    nav('/');
  };

  return (
    <div className="p-4 space-y-2">
      <h1 className="text-xl font-bold">Config</h1>
      <div>
        <label className="block">Provider
          <select value={cfg.default_provider} onChange={e => setCfg({ ...cfg, default_provider: e.target.value })}>
            {providers.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
      </div>
      <div>
        <label className="block">Model
          <input value={cfg.default_model} onChange={e => setCfg({ ...cfg, default_model: e.target.value })} className="border" />
        </label>
      </div>
      <div>
        <label className="block">Interview Preprompt</label>
        <textarea value={cfg.interview_preprompt} onChange={e => setCfg({ ...cfg, interview_preprompt: e.target.value })} className="border w-full" rows={5}></textarea>
      </div>
      <button onClick={save} className="underline">Save</button>
    </div>
  );
}
