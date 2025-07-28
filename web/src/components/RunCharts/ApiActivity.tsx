import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useSyncExternalStore } from 'react';
import { subscribe, getState } from '../../state/runStore';
import { format } from 'date-fns';

export default function ApiActivity(){
  const state = useSyncExternalStore(subscribe, ()=>({...getState()}));
  const data = state.apiSeries.sort((a,b)=>a.bucketTs-b.bucketTs).map(p=>({
    ts: p.bucketTs,
    agent: p.agent,
    count: p.count
  }));
  const agents = Array.from(new Set(data.map(d=>d.agent)));
  const grouped: Record<number, any> = {};
  for(const item of data){
    const key = item.ts;
    grouped[key] = grouped[key] || { ts: item.ts };
    grouped[key][item.agent] = (grouped[key][item.agent]||0) + item.count;
  }
  const series = Object.values(grouped);
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={series} margin={{left:10,right:10,top:10,bottom:10}}>
        <XAxis dataKey="ts" tickFormatter={t=>format(t,'HH:mm:ss')} />
        <YAxis />
        <Tooltip labelFormatter={l=>format(Number(l),'HH:mm:ss')} />
        {agents.map(a => <Line key={a} type="monotone" dataKey={a} stroke="#888" dot={false} />)}
      </LineChart>
    </ResponsiveContainer>
  );
}
