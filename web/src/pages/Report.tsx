import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function Report(){
  const { runId } = useParams();
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    if(!runId) return;
    fetch('/api/report/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ runId })})
      .then(r=>r.json()).then(setReport);
  }, [runId]);

  if(!report) return <div>Loading...</div>;

  return (
    <div className="p-4 space-y-2">
      <h1 className="text-xl font-bold">Report</h1>
      <pre className="bg-gray-100 p-2 text-xs overflow-auto h-60">{report.markdown}</pre>
    </div>
  );
}
