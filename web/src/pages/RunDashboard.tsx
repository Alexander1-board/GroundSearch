import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { connect, disconnect, pause, resume, subscribe, getSnapshot } from '../state/runStore';
import CollapsibleSection from '../components/CollapsibleSection';
import StatBadge from '../components/StatBadge';
import Timeline from '../components/RunCharts/Timeline';
import ApiActivity from '../components/RunCharts/ApiActivity';
import EvidenceBySource from '../components/RunCharts/EvidenceBySource';
import EvidenceByYear from '../components/RunCharts/EvidenceByYear';
import { useSyncExternalStore } from 'react';

export default function RunDashboard(){
  const { runId } = useParams();
  const state = useSyncExternalStore(subscribe, getSnapshot);

  useEffect(()=>{ if(runId) connect(runId); return () => disconnect(); }, [runId]);

  const toggle = () => state.paused ? resume() : pause();
  const artifacts = state.events.filter(e=>e.type==='artifact');
  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Run {runId}</h1>
        <div className="space-x-2 text-sm">
          <button onClick={toggle} className="underline">{state.paused?'Resume':'Pause'} stream</button>
          <Link to="/" className="underline">Back to Home</Link>
        </div>
      </div>
      <CollapsibleSection id="overview" title="Overview">
        <div className="flex flex-wrap gap-2">
          <StatBadge label="Status" value={state.connected ? 'running' : 'stopped'} />
          <StatBadge label="Steps" value={`${state.stats.doneSteps}/${state.stats.totalSteps}`} />
          <StatBadge label="Events" value={state.events.length} />
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
        {artifacts.length ? (
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {artifacts.map((e,i)=> (
              <li key={i}><a href={`/${e.path}`} className="underline" target="_blank" rel="noreferrer">{e.path}</a></li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-gray-500">No artifacts yet</div>
        )}
      </CollapsibleSection>
    </div>
  );
}
