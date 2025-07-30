import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useSyncExternalStore, useMemo } from 'react';
import { subscribe, getSnapshot } from '../../state/runStore';

export default function EvidenceByYear(){
  const state = useSyncExternalStore(subscribe, getSnapshot);
  const data = useMemo(() => state.evidenceByYear, [state.evidenceByYear]);
  const empty = data.length===0;
  const chartData = empty ? [{year:0,count:0}] : data;
  return (
    <div className="relative">
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{left:10,right:10,top:10,bottom:10}}>
        <XAxis dataKey="year" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
    {empty && <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">No evidence yet</div>}
    </div>
  );
}
