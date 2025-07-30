import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useSyncExternalStore, useMemo } from 'react';
import { subscribe, getSnapshot } from '../../state/runStore';
import { format } from 'date-fns';

export default function ApiActivity(){
  const state = useSyncExternalStore(subscribe, getSnapshot);
  const data = useMemo(() => state.apiSeries.slice().sort((a,b)=>a.bucketTs-b.bucketTs).map(p=>({
    ts: p.bucketTs,
    agent: p.agent,
    count: p.count
  })), [state.apiSeries]);
  const agents = useMemo(() => Array.from(new Set(data.map(d=>d.agent))), [data]);
  const grouped: Record<number, any> = useMemo(() => {
    const g: Record<number, any> = {};
    for(const item of data){
      const key = item.ts;
      g[key] = g[key] || { ts: item.ts };
      g[key][item.agent] = (g[key][item.agent]||0) + item.count;
    }
    return g;
  }, [data]);
  const series = useMemo(() => Object.values(grouped), [grouped]);
  if(!series.length) return <div className="text-sm text-gray-500">No API calls yet</div>;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={series} margin={{left:10,right:10,top:10,bottom:10}}>
        <XAxis dataKey="ts" tickFormatter={t=>format(Number(t),'HH:mm:ss')} />
        <YAxis />
        <Tooltip labelFormatter={l=>format(Number(l),'HH:mm:ss')} />
        {agents.map(a => <Line key={a} type="monotone" dataKey={a} stroke="#8884d8" dot={false} />)}
      </LineChart>
    </ResponsiveContainer>
  );
}
