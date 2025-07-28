export interface ToolSpec {
  name: string;
  description: string;
  input: any;
}

export function getToolSpecs(): ToolSpec[] {
  return [
    { name: 'pubmed', description: 'Search PubMed', input: { term: 'string' } },
    { name: 'arxiv', description: 'Search arXiv', input: { query: 'string' } },
    { name: 'wolfram', description: 'Query Wolfram Alpha', input: { question: 'string' } },
    { name: 'mediawiki', description: 'Search Wikipedia', input: { term: 'string' } }
  ];
}
