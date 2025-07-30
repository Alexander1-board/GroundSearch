import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TOOLS = ['pubmed','arxiv','wolfram','openalex','mediawiki','leaks'];

interface ProviderInfo { id: string; models: string[]; available: boolean; }

interface UserConfig {
  default_provider: string;
  default_model: string;
  interview_preprompt: string;
  enabled_tools: string[];
}

export default function Config() {
  const nav = useNavigate();
  const [cfg, setCfg] = useState<UserConfig | null>(null);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [secretFlags, setSecretFlags] = useState<Record<string, boolean>>({});
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<'config' | 'secrets'>('config');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(setCfg);
    fetch('/api/providers').then(r => r.json()).then(d => setProviders(d.providers || []));
    fetch('/api/config/secrets').then(r => r.json()).then(d => {
      setSecretFlags(d.flags || {});
      if(d.canEdit===false) setTab('config');
    });
  }, []);

  if (!cfg) return <div>Loading...</div>;

  const save = async () => {
    await fetch('/api/config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cfg) });
    nav('/');
  };

  const testCreds = async () => {
    const res = await fetch('/api/providers/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: cfg.default_provider, model: cfg.default_model })
    });
    const data = await res.json();
    if (data.ok) setToast('Credentials OK'); else setToast(data.error || 'Error');
    setTimeout(() => setToast(null), 3000);
  };

  const providerInfo = providers.find(p => p.id === cfg.default_provider);
  const models = providerInfo?.models || [];
  const toggleTool = (t: string, on: boolean) => {
    const list = on ? [...cfg.enabled_tools, t] : cfg.enabled_tools.filter(x => x !== t);
    setCfg({ ...cfg, enabled_tools: list });
  };

  return (
    <div className="p-4 space-y-2">
      <h1 className="text-xl font-bold">Config</h1>
      {toast && <div className="bg-green-200 p-2">{toast}</div>}
      <div>
        <label className="block">Provider
          <select value={cfg.default_provider} onChange={e => {
            const val = e.target.value;
            const firstModel = providers.find(p => p.id === val)?.models[0] || '';
            setCfg({ ...cfg, default_provider: val, default_model: firstModel });
          }}>
            {providers.map(p => <option key={p.id} value={p.id}>{p.id}</option>)}
          </select>
        </label>
      </div>
      <div>
        <label className="block">Model
          <select value={cfg.default_model} onChange={e => setCfg({ ...cfg, default_model: e.target.value })}>
            {models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
      </div>
      <div>
        <label className="block">Interview Preprompt</label>
        <textarea value={cfg.interview_preprompt} onChange={e => setCfg({ ...cfg, interview_preprompt: e.target.value })} className="border w-full" rows={8}></textarea>
        <div className="text-sm text-gray-500">{cfg.interview_preprompt.length} chars</div>
      </div>
      <div>
        <label className="block font-semibold">Enabled Tools</label>
        {TOOLS.map(t => (
          <label key={t} className="block">
            <input type="checkbox" checked={cfg.enabled_tools.includes(t)} onChange={e => toggleTool(t, e.target.checked)} /> {t}
          </label>
        ))}
      </div>
      <div className="space-x-2">
        <button onClick={save} className="underline">Save</button>
        <button onClick={testCreds} className="underline">Test Credentials</button>
      </div>

      {Object.keys(secretFlags).length > 0 && (
        <div>
          <div className="mt-4 flex space-x-4">
            <button className="underline" onClick={()=>setTab('config')}>Config</button>
            <button className="underline" onClick={()=>setTab('secrets')}>Secrets</button>
          </div>
          {tab === 'secrets' && (
            <div className="space-y-2 mt-2">
              {Object.keys(secretFlags).map(k => (
                <label key={k} className="block">
                  {k}: <input type="text" value={secrets[k]||''} onChange={e => setSecrets({ ...secrets, [k]: e.target.value })} className="border" />
                  <span className="ml-2 text-sm">{secretFlags[k] ? 'Present' : 'Not set'}</span>
                </label>
              ))}
              <button className="underline" onClick={async()=>{
                await fetch('/api/config/secrets', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(secrets) });
                const d = await fetch('/api/config/secrets').then(r=>r.json());
                setSecretFlags(d.flags||{});
                setSecrets({});
                setToast('Secrets saved');
                setTimeout(()=>setToast(null),3000);
              }}>Save Secrets</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
