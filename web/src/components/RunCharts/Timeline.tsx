import { useSyncExternalStore, useMemo } from 'react';
import { subscribe, getSnapshot } from '../../state/runStore';
import { formatDistanceToNow } from 'date-fns';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function Timeline(){
  const state = useSyncExternalStore(subscribe, getSnapshot);
  const steps = useMemo(() => Object.values(state.steps).slice().sort((a,b)=>a.startTs-b.startTs), [state.steps]);
  const durations = useMemo(() => steps.map((s,i)=>({i, dur: ((s.endTs||Date.now())-s.startTs)/1000})), [steps]);
  const empty = steps.length===0;
  const chartData = empty ? [{i:0,dur:0}] : durations;
  return (
    <div className="space-y-2 relative">
      <ResponsiveContainer width="100%" height={40}>
        <LineChart data={chartData} margin={{left:0,right:0,top:0,bottom:0}}>
          <Line dataKey="dur" stroke="#8884d8" dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
      <ul className="text-sm space-y-1">
        {steps.map(s => {
          const durMs = (s.endTs || Date.now()) - s.startTs;
          return (
            <li key={s.stepId} className="border-b pb-1">
              <span className="font-mono mr-2">{s.action}</span>
              <span className="text-gray-500 mr-2">{s.agent}</span>
              <span className="mr-2">{new Date(s.startTs).toLocaleTimeString()}</span>
              <span>{formatDistanceToNow(s.endTs || Date.now(), { addSuffix: false })}</span>
              <span className="ml-1 text-xs text-gray-400">({Math.round(durMs/1000)}s)</span>
              {s.instructions && (
                <details className="inline-block ml-1">
                  <summary className="cursor-pointer text-blue-600">ℹ️</summary>
                  <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-1 max-w-lg">{s.instructions}</pre>
                </details>
              )}
            </li>
          );
        })}
      </ul>
      {empty && <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">No steps yet</div>}
    </div>
  );
}
