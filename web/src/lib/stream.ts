export function openEventStream(url: string, onEvent: (data: any)=>void): EventSource {
  let es = new EventSource(url);
  es.onmessage = (e) => { try{ onEvent(JSON.parse(e.data)); } catch{} };
  es.onerror = () => {
    es.close();
    setTimeout(() => { es = openEventStream(url, onEvent); }, 1000);
  };
  return es;
}
