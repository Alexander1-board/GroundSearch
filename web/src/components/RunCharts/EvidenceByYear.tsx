import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useSyncExternalStore } from 'react';
import { subscribe, getState } from '../../state/runStore';

export default function EvidenceByYear(){
  const state = useSyncExternalStore(subscribe, ()=>({...getState()}));
  const data = state.evidenceByYear;
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
