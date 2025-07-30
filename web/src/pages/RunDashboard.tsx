import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { connect, disconnect, pause, resume, subscribe, getSnapshot, loadArtifact } from '../state/runStore';
import CollapsibleSection from '../components/CollapsibleSection';
import StatBadge from '../components/StatBadge';
import Timeline from '../components/RunCharts/Timeline';
import ApiActivity from '../components/RunCharts/ApiActivity';
import EvidenceBySource from '../components/RunCharts/EvidenceBySource';
import EvidenceByYear from '../components/RunCharts/EvidenceByYear';


export default function RunDashboard(){
  const { runId } = useParams();
  const nav = useNavigate();
  const state = useSyncExternalStore(subscribe, getSnapshot);
  const [now, setNow] = useState(Date.now());
  const [modal, setModal] = useState<any|null>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(()=>{ if(runId) connect(runId); return () => disconnect(); }, [runId]);
  useEffect(()=>{ const i=setInterval(()=>setNow(Date.now()),1000); return ()=>clearInterval(i); },[]);
  useEffect(()=>{
    const handler=(e:KeyboardEvent)=>{
      if(e.key==='e' && !e.shiftKey){ window.dispatchEvent(new CustomEvent('collapsible:set',{detail:'expand'})); }
      else if(e.key==='E' && e.shiftKey){ window.dispatchEvent(new CustomEvent('collapsible:set',{detail:'collapse'})); }
      else if(e.key==='/' && filterRef.current){ e.preventDefault(); filterRef.current.focus(); }
      else if(e.key==='?'){ setShowHelp(s=>!s); }
    };
    window.addEventListener('keydown',handler);
    return ()=>window.removeEventListener('keydown',handler);
  },[]);

  const toggle = () => state.paused ? resume() : pause();
  const artifacts = useMemo(()=> state.events.filter(e=>e.type==='artifact'), [state.events]);
  const status = state.events.some(e=>e.type==='complete') ? 'complete' : state.connected ? 'running' : 'stopped';
  const elapsed = state.stats.firstTs ? Math.round(((state.stats.lastTs || now)-state.stats.firstTs)/1000) : 0;
  const hasReport = artifacts.some(a=>a.path.includes('final-report.json'));

  const openJson = async (p:string)=>{ const data = await loadArtifact(p); setModal({ path:p, data }); };
  const generateReport = async ()=>{ await fetch('/api/report/generate',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ runId })}); nav(`/report/${runId}`); };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Run {runId}</h1>
        <div className="space-x-2 text-sm">
          <button onClick={toggle} className="underline">{state.paused?'Resume':'Pause'} stream</button>
          <button onClick={()=>window.dispatchEvent(new CustomEvent('collapsible:set',{detail:'expand'}))} className="underline">Expand</button>
          <button onClick={()=>window.dispatchEvent(new CustomEvent('collapsible:set',{detail:'collapse'}))} className="underline">Collapse</button>
          <Link to="/" className="underline">Back</Link>
        </div>
      </div>
      <CollapsibleSection id="overview" title="Overview">
        <div className="flex flex-wrap gap-2">
          <StatBadge label="Status" value={status} />
          <StatBadge label="Phase" value={state.phase || 'n/a'} />
          <StatBadge label="Steps" value={`${state.stats.doneSteps}/${state.stats.totalSteps}`} />
          <StatBadge label="Events" value={state.events.length} />
          <StatBadge label="Elapsed" value={`${elapsed}s`} />
        </div>
      </CollapsibleSection>
      <CollapsibleSection id="timeline" title="Timeline">
        <Timeline />
      </CollapsibleSection>
      <CollapsibleSection id="api" title="API Activity">
        <ApiActivity />
      </CollapsibleSection>
      <CollapsibleSection id="evidence" title="Evidence">
        <div className="grid grid-cols-2 gap-4">
          <EvidenceBySource />
          <EvidenceByYear />
        </div>
      </CollapsibleSection>
      <CollapsibleSection id="artifacts" title="Artifacts">
        <div className="mb-2"><input ref={filterRef} value={filter} onChange={e=>setFilter(e.target.value)} placeholder="filter" className="border px-1 text-xs"/></div>
        {artifacts.length ? (
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {artifacts.filter(a=>a.path.includes(filter)).map((e,i)=> (
              <li key={i} className="flex space-x-2 items-center">
                <span className="flex-1 truncate">{e.path}</span>
                <button onClick={()=>openJson(e.path)} className="underline">Open</button>
                <a href={`/${e.path}`} download className="underline">Download</a>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-500">No artifacts yet</div>
        )}
        {!hasReport && status==='complete' && (
          <div className="mt-2"><button onClick={generateReport} className="underline">Generate Report</button></div>
        )}
      </CollapsibleSection>
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center" onClick={()=>setModal(null)}>
          <div className="bg-white p-2 max-w-lg max-h-[80vh] overflow-auto" onClick={e=>e.stopPropagation()}>
            <div className="text-sm font-semibold mb-2">{modal.path}</div>
            <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(modal.data,null,2)}</pre>
            <button onClick={()=>setModal(null)} className="mt-2 underline text-sm">Close</button>
          </div>
        </div>
      )}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center" onClick={()=>setShowHelp(false)}>
          <div className="bg-white p-4 text-sm" onClick={e=>e.stopPropagation()}>
            <h2 className="font-semibold mb-2">Keyboard Shortcuts</h2>
            <ul className="list-disc pl-5">
              <li><kbd>e</kbd> expand all</li>
              <li><kbd>Shift+E</kbd> collapse all</li>
              <li><kbd>/</kbd> focus artifact filter</li>
              <li><kbd>?</kbd> toggle help</li>
            </ul>
            <button onClick={()=>setShowHelp(false)} className="mt-2 underline">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
