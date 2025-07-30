import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useSyncExternalStore, useMemo } from 'react';
import { subscribe, getSnapshot } from '../../state/runStore';

const COLORS = ['#8884d8','#82ca9d','#ffc658','#d0ed57','#a4de6c'];

export default function EvidenceBySource(){
  const state = useSyncExternalStore(subscribe, getSnapshot);
  const data = useMemo(() => state.evidenceBySource, [state.evidenceBySource]);
  if(!data.length) return <div className="text-sm text-gray-500">No evidence yet</div>;
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
