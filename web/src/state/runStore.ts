export interface RunEvent { type: string; ts: number; [k:string]: any }
export interface StepEntry { stepId: string; action: string; agent: string; startTs:number; endTs?:number; instructions?: string }
export interface ApiPoint { bucketTs:number; agent:string; count:number }

interface RunState {
  runId: string;
  connected: boolean;
  paused: boolean;
  phase?: string;
  events: RunEvent[];
  steps: Record<string, StepEntry>;
  apiSeries: ApiPoint[];
  apiUrls: Record<string,{count:number;lastTs:number}>;
  evidenceBySource: Array<{ source_id:string; count:number }>;
  evidenceByYear: Array<{ year:number; count:number }>;
  stats: { totalSteps:number; doneSteps:number; errors:number; firstTs?:number; lastTs?:number };
  evidenceLoaded: boolean;
  stepInstructions: Record<string,string>;
}

const state: RunState = {
  runId: '',
  connected: false,
  paused: false,
  phase: undefined,
  events: [],
  steps: {},
  apiSeries: [],
  apiUrls: {},
  evidenceBySource: [],
  evidenceByYear: [],
  stats: { totalSteps:0, doneSteps:0, errors:0 },
  evidenceLoaded: false,
  stepInstructions: {}
};

let es: EventSource | null = null;
const listeners = new Set<() => void>();
let snapshot: RunState = { ...state };

function throttle(fn: ()=>void, ms: number){
  let timer: NodeJS.Timeout | null = null;
  return () => {
    if(timer) return;
    timer = setTimeout(() => { timer = null; fn(); }, ms);
  };
}

const throttledNotifyApi = throttle(notify, 250);

function notify(){
  snapshot = { ...state, apiUrls: { ...state.apiUrls }, stepInstructions: { ...state.stepInstructions } };
  listeners.forEach(fn => fn());
}

export function subscribe(fn: ()=>void){ listeners.add(fn); return () => listeners.delete(fn); }
export function getSnapshot(){ return snapshot; }

export function pause(){ state.paused = true; notify(); }
export function resume(){ state.paused = false; notify(); }

export function disconnect(){ es?.close(); es=null; state.connected=false; notify(); }

async function fetchEvidence(path:string){
  try{
    const res = await fetch('/'+path);
    const data = await res.json();
    const byS: Record<string, number> = {};
    const byY: Record<number, number> = {};
    for(const r of data){
      if(r.source_id) byS[r.source_id] = (byS[r.source_id]||0)+1;
      if(r.published){
        const y = new Date(r.published).getFullYear();
        byY[y] = (byY[y]||0)+1;
      }
    }
    state.evidenceBySource = Object.entries(byS).map(([source_id,count])=>({source_id, count}));
    state.evidenceByYear = Object.entries(byY).map(([year,count])=>({year:Number(year), count})).sort((a,b)=>a.year-b.year);
    state.evidenceLoaded = true;
  }catch{}
}

function applyEventInternal(evt: RunEvent){
  state.events.push(evt);
  state.stats.firstTs = state.stats.firstTs ?? evt.ts;
  state.stats.lastTs = evt.ts;
  switch(evt.type){
    case 'step_start':
      state.steps[evt.stepId] = { stepId: evt.stepId, action: evt.action, agent: evt.agent, startTs: evt.ts, instructions: state.stepInstructions[evt.stepId] };
      state.stats.totalSteps++;
      break;
    case 'artifact':
      if(evt.stepId && state.steps[evt.stepId]){ state.steps[evt.stepId].endTs = evt.ts; state.stats.doneSteps++; }
      if(String(evt.path).includes('screened-evidence.json')) fetchEvidence(evt.path);
      break;
    case 'api_call': {
      const bucket = Math.floor(evt.ts/5000)*5000;
      let p = state.apiSeries.find(p=>p.bucketTs===bucket && p.agent===evt.agent);
      if(!p){ p = { bucketTs: bucket, agent: evt.agent, count:0 }; state.apiSeries.push(p); }
      p.count++;
      if(evt.url){
        const u = state.apiUrls[evt.url] || { count:0, lastTs:0 };
        u.count++;
        u.lastTs = evt.ts;
        state.apiUrls[evt.url] = u;
      }
      throttledNotifyApi();
      return; }
    case 'phase':
      state.phase = evt.phase;
      break;
    case 'error':
      state.stats.errors++;
      break;
    case 'complete':
      state.connected = false;
      break;
  }
  notify();
}

export function applyEvent(evt: RunEvent){
  applyEventInternal(evt);
}

export function connect(runId: string){
  disconnect();
  state.runId = runId;
  state.connected = true;
  state.paused = false;
  state.events = [];
  state.phase = undefined;
  state.steps={};
  state.apiSeries=[];
  state.apiUrls={};
  state.evidenceBySource=[];
  state.evidenceByYear=[];
  state.stats={totalSteps:0, doneSteps:0, errors:0};
  state.evidenceLoaded=false;
  state.stepInstructions={};
  const base = (typeof window !== 'undefined' && window.location) ? window.location.origin : 'http://localhost';
  fetch(`${base}/api/agent/${runId}/plan`).then(r=>r.ok?r.json():null).then(plan=>{
    if(plan && plan.steps){
      const map: Record<string,string> = {};
      for(const s of plan.steps){ if(s.specialist_instructions) map[s.id]=s.specialist_instructions; }
      state.stepInstructions = map;
      notify();
    }
  });
  es = new EventSource(`/api/agent/${runId}/stream`);
  const handle = (e: MessageEvent) => {
    if(state.paused) return;
    try { applyEventInternal(JSON.parse(e.data)); } catch {}
  };
  ["phase","step_start","artifact","api_call","stats","complete","error"].forEach(t => es.addEventListener(t, handle));
  es.onerror = () => {};

  notify();
}

export async function loadArtifact(path: string){
  try{
    const res = await fetch('/'+path);
    if(!res.ok) return null;
    return await res.json().catch(()=>null);
  }catch{
    return null;
  }
}
