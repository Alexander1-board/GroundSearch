import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useSyncExternalStore } from 'react';
import { subscribe, getState } from '../../state/runStore';

const COLORS = ['#8884d8','#82ca9d','#ffc658','#d0ed57','#a4de6c'];

export default function EvidenceBySource(){
  const state = useSyncExternalStore(subscribe, ()=>({...getState()}));
  const data = state.evidenceBySource;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="source_id" outerRadius={60} label>
          {data.map((entry, index) => (
            <Cell key={`c-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
