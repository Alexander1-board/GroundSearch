import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Plan(){
  const nav = useNavigate();
  const [plan, setPlan] = useState<any>(null);
  const [cfg, setCfg] = useState<any>(null);
  const [brief] = useState(()=>{
    const b = localStorage.getItem('brief');
    return b ? JSON.parse(b) : null;
  });

  useEffect(() => {
    if(!brief){ nav('/interview'); return; }
    fetch('/api/plan/preview', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ brief })})
      .then(r=>r.json()).then(setPlan);
    fetch('/api/config').then(r=>r.json()).then(setCfg);
  }, []);

  const run = async () => {
    if(!brief) return;
    const res = await fetch('/api/agent/start', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ brief })});
    const data = await res.json();
    nav(`/run/${data.runId}`);
  };

  if(!plan) return <div>Loading plan...</div>;

  const queries = useMemo(()=>{
    const q: Record<string,string> = {};
    for(const s of plan.steps){
      if(s.agent==='pubmed_agent') q.pubmed = s.params.term;
      if(s.agent==='arxiv_agent') q.arxiv = s.params.query;
      if(s.agent==='wolfram_agent') q.wolfram = s.params.input;
      if(s.agent==='leaks_agent') q.leaks = s.params.query;
    }
    return q;
  }, [plan]);

  const scopeSummary = useMemo(() => {
    if(!brief?.scope) return '';
    const tf = brief.scope.timeframe;
    const parts = [] as string[];
    if(tf?.from || tf?.to) parts.push(`Timeframe: ${tf?.from || ''}-${tf?.to || ''}`);
    if(brief.scope.domains?.length) parts.push(`Domains: ${brief.scope.domains.join(', ')}`);
    if(brief.scope.comparators?.length) parts.push(`Comparators: ${brief.scope.comparators.join(', ')}`);
    return parts.join(' | ');
  }, [brief]);

  return (
    <div className="p-4 space-y-2">
      <h1 className="text-xl font-bold">Plan Review</h1>
      {cfg && (
        <div className="space-x-2 text-sm">
          <span className="px-2 py-1 bg-gray-200 rounded">{cfg.default_provider}</span>
          <span className="px-2 py-1 bg-gray-200 rounded">{cfg.default_model}</span>
        </div>
      )}
      {scopeSummary && <div className="text-sm text-gray-700">{scopeSummary}</div>}
      <div className="space-y-1 text-sm">
        {queries.pubmed && <div>PubMed: <input readOnly className="border w-full" value={queries.pubmed}/></div>}
        {queries.arxiv && <div>arXiv: <input readOnly className="border w-full" value={queries.arxiv}/></div>}
        {queries.wolfram && <div>Wolfram: <input readOnly className="border w-full" value={queries.wolfram}/></div>}
        {queries.leaks && <div>Leaks: <input readOnly className="border w-full" value={queries.leaks}/></div>}
      </div>
      <div className="space-y-2">
        {['SEARCH','SCREEN','SYNTHESISE','FETCH','PARSE','COMPARE'].map(phase => (
          <div key={phase}>
            <h2 className="font-semibold">{phase}</h2>
            {plan.steps.filter((s:any)=>s.action===phase).map((s:any)=>(
              <details key={s.id} className="ml-4">
                <summary>{s.agent}</summary>
                <pre className="bg-gray-100 p-1 text-xs overflow-auto">{JSON.stringify(s.params, null, 2)}</pre>
                {s.action === 'SEARCH' && (
                  s.specialist_instructions ? (
                    <details className="ml-2 mt-1">
                      <summary className="cursor-pointer">Instructions</summary>
                      <pre className="bg-gray-50 p-1 text-xs whitespace-pre-wrap overflow-auto">{s.specialist_instructions}</pre>
                    </details>
                  ) : (
                    <p className="ml-2 text-xs text-gray-500">No instructions.</p>
                  )
                )}
              </details>
            ))}
          </div>
        ))}
      </div>
      <div className="space-x-2">
        <button onClick={run} className="underline">Run</button>
        <button onClick={()=>nav('/interview')} className="underline">Back</button>
      </div>
    </div>
  );
}
