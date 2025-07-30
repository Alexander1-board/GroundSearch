import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TOOLS = ['pubmed','arxiv','wolfram','openalex','mediawiki','leaks'];
const SECRET_PROVIDERS = ['gemini','openai','anthropic','grok','ollama','ncbi','wolfram','openalex'];

interface ProviderInfo { id: string; models: string[]; available: boolean; }

export default function Config() {
  const nav = useNavigate();
  const [activeTab,setActiveTab] = useState<'settings'|'secrets'>('settings');
  const [providers,setProviders] = useState<ProviderInfo[]>([]);

  const [provider,setProvider] = useState('');
  const [model,setModel] = useState('');
  const [interviewPreprompt,setInterviewPreprompt] = useState('');
  const [enabledTools,setEnabledTools] = useState<string[]>([]);

  const [secretFlags,setSecretFlags] = useState<Record<string,boolean>>({});
  const [secrets,setSecrets] = useState<Record<string,string>>({});

  useEffect(()=>{(async()=>{
    const cfg = await fetch('/api/config').then(r=>r.json());
    setProvider(cfg.default_provider);
    setModel(cfg.default_model);
    setInterviewPreprompt(cfg.interview_preprompt);
    setEnabledTools(cfg.enabled_tools);
    const prov = await fetch('/api/providers').then(r=>r.json());
    setProviders(prov.providers||[]);
    const sec = await fetch('/api/config/secrets').then(r=>r.json());
    setSecretFlags(sec.flags||{});
  })();},[]);

  const providerInfo = providers.find(p=>p.id===provider);
  const models = providerInfo?.models||[];

  const toggleTool = (t:string,on:boolean)=>{
    setEnabledTools(on ? [...enabledTools,t] : enabledTools.filter(x=>x!==t));
  };

  const save = async()=>{
    await fetch('/api/config',{method:'PUT',body:JSON.stringify({default_provider:provider,default_model:model,interview_preprompt:interviewPreprompt,enabled_tools:enabledTools})});
    nav('/');
  };

  const testCreds = async()=>{
    const res = await fetch('/api/providers/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider,model})});
    const data = await res.json();
    alert(data.ok ? 'Credentials OK' : data.error||'Error');
  };

  const saveSecrets = async()=>{
    await fetch('/api/config/secrets',{method:'PUT',body:JSON.stringify(secrets)});
    const sec = await fetch('/api/config/secrets').then(r=>r.json());
    setSecretFlags(sec.flags||{});
    setSecrets({});
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Config</h1>
      <div className="mb-4 border-b">
        <button className={`px-4 py-2 mr-2 ${activeTab==='settings'? 'border-b-2 border-blue-600' : ''}`} onClick={()=>setActiveTab('settings')}>Settings</button>
        <button className={`px-4 py-2 ${activeTab==='secrets'? 'border-b-2 border-blue-600' : ''}`} onClick={()=>setActiveTab('secrets')}>Secrets</button>
      </div>

      {activeTab==='settings' && (
        <form onSubmit={e=>{e.preventDefault();save();}} className="max-w-lg">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Provider</label>
            <select className="mt-1 block w-full border rounded p-2" value={provider} onChange={e=>{const val=e.target.value;setProvider(val);setModel(providers.find(p=>p.id===val)?.models[0]||'');}}>
              {providers.map(p=>(<option key={p.id} value={p.id}>{p.id}</option>))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Model</label>
            <select className="mt-1 block w-full border rounded p-2" value={model} onChange={e=>setModel(e.target.value)}>
              {models.map(m=>(<option key={m} value={m}>{m}</option>))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Interview Preprompt</label>
            <textarea rows={5} className="mt-1 block w-full border rounded p-2" value={interviewPreprompt} onChange={e=>setInterviewPreprompt(e.target.value)}></textarea>
            <span className="text-xs text-gray-500">{interviewPreprompt.length} chars</span>
          </div>
          <div className="mb-4">
            <span className="block text-sm font-medium text-gray-700 mb-1">Enabled Tools</span>
            {TOOLS.map(t=> (
              <label key={t} className="block">
                <input type="checkbox" className="mr-2" checked={enabledTools.includes(t)} onChange={e=>toggleTool(t,e.target.checked)} />{t}
              </label>
            ))}
          </div>
          <div className="space-x-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
            <button type="button" onClick={testCreds} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Test Credentials</button>
          </div>
        </form>
      )}

      {activeTab==='secrets' && (
        <form onSubmit={e=>{e.preventDefault();saveSecrets();}} className="max-w-lg space-y-4">
          {SECRET_PROVIDERS.map(p=>(
            <div key={p} className="mb-4">
              <label className="block text-sm font-medium text-gray-700">{p} API Key</label>
              <input type="password" placeholder="••••••" className="mt-1 block w-full border rounded p-2" value={secrets[p]||''} onChange={e=>setSecrets({...secrets,[p]:e.target.value})} />
              <span className={`text-xs ml-2 ${secretFlags[p]?'text-green-600':'text-red-600'}`}>{secretFlags[p]?'Present':'Not set'}</span>
            </div>
          ))}
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Secrets</button>
        </form>
      )}
    </div>
  );
}
