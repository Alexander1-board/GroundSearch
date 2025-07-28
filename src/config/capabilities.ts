// path: src/config/capabilities.ts
export const CAPABILITIES = [
  {
    source_id: 'pubmed',
    name: 'PubMed',
    kind: 'peer-reviewed',
    domains: ['clinical','biomedical'],
    rate_limits: { requests_per_second: 10, requires_key: true },
    features: ['search','fetch_details','boolean_query','date_filter'],
  },
  {
    source_id: 'arxiv',
    name: 'arXiv',
    kind: 'pre-print',
    domains: ['technology','physics','cs','ml'],
    rate_limits: { requests_per_second: 1, requires_key: false },
    features: ['search','fetch_details','date_filter'],
  },
  {
    source_id: 'wolfram',
    name: 'Wolfram|Alpha',
    kind: 'computational',
    domains: ['economics','numerics','geography','time-series'],
    rate_limits: { requests_per_second: 1, requires_key: true },
    features: ['search'],
  },
  {
    source_id: 'openalex',
    name: 'OpenAlex',
    kind: 'data-repository',
    domains: ['citation-analysis','metadata'],
    rate_limits: { requests_per_second: 10, requires_key: false },
    features: ['fetch_details'],
  }
];
