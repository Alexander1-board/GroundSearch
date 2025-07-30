import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useSyncExternalStore, useMemo } from 'react';
import { subscribe, getSnapshot } from '../../state/runStore';

const COLORS = ['#8884d8','#82ca9d','#ffc658','#d0ed57','#a4de6c'];

export default function EvidenceBySource(){
  const state = useSyncExternalStore(subscribe, getSnapshot);
  const data = useMemo(() => state.evidenceBySource, [state.evidenceBySource]);
  const empty = data.length===0;
  const chartData = empty ? [{source_id:'',count:0}] : data;
  return (
    <div className="relative">
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={chartData} dataKey="count" nameKey="source_id" outerRadius={60} label>
          {chartData.map((entry, index) => (
            <Cell key={`c-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
    {empty && <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">No evidence yet</div>}
    </div>
  );
}
