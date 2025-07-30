import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { marked } from 'marked';

export default function Report(){
  const { runId } = useParams();
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    if(!runId) return;
    fetch('/api/report/generate', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ runId })})
      .then(r=>r.json()).then(setReport);
  }, [runId]);

  const exportFile = (fmt: 'md'|'json') => {
    fetch(`/api/report/export?runId=${runId}&format=${fmt}`, { method:'POST' })
      .then(r=>r.ok ? r.blob() : null)
      .then(blob => { if(!blob) return; const url = window.URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`report.${fmt}`; a.click(); window.URL.revokeObjectURL(url); });
  };

  if(!report) return <div>Loading...</div>;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Report {runId}</h1>
      <div className="space-x-2 text-sm">
        <button onClick={()=>exportFile('md')} className="underline">Export .md</button>
        <button onClick={()=>exportFile('json')} className="underline">Export .json</button>
      </div>
      <article className="prose" dangerouslySetInnerHTML={{ __html: marked.parse(report.markdown) }} />
      <table className="table-auto text-sm border">
        <thead>
          <tr>{report.comparisonTable.headers.map((h:string,i:number)=>(<th key={i} className="border px-1">{h}</th>))}</tr>
        </thead>
        <tbody>
          {report.comparisonTable.rows.map((row:any,i:number)=>(
            <tr key={i}>{row.map((c:any,j:number)=>(<td key={j} className="border px-1 whitespace-pre-wrap">{c}</td>))}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
