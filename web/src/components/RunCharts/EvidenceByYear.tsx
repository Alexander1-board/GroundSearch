import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useSyncExternalStore, useMemo } from 'react';
import { subscribe, getSnapshot } from '../../state/runStore';

export default function EvidenceByYear(){
  const state = useSyncExternalStore(subscribe, getSnapshot);
  const data = useMemo(() => state.evidenceByYear, [state.evidenceByYear]);
  if(!data.length) return <div className="text-sm text-gray-500">No evidence yet</div>;
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{left:10,right:10,top:10,bottom:10}}>
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
}
