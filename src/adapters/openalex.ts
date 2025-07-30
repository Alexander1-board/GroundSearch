// path: src/adapters/openalex.ts
import { fetchWithRetry } from '../lib/http.js';
import { RecordLite } from '../spec/schemas.js';

const OPENALEX_EMAIL = process.env.OPENALEX_EMAIL;

export async function enrichWithOpenAlex<T extends RecordLite>(
  record: T
): Promise<T & { citation_count?: number }> {
  if (!OPENALEX_EMAIL) return record as T & { citation_count?: number };
  try {
    const url =
      `https://api.openalex.org/works?search=${encodeURIComponent(record.title)}` +
      `&per-page=1&mailto=${encodeURIComponent(OPENALEX_EMAIL)}`;
    const res = await fetchWithRetry(url, {}, { rpsKey: 'openalex' });
    const data: any = await res.json();
    const cited = data.results?.[0]?.cited_by_count;
    return { ...(record as any), citation_count: cited };
  } catch {
    return record as T & { citation_count?: number };
  }
}
