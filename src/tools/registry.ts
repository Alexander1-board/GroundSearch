export interface ToolSpec {
  source_id: string;
  name: string;
  description: string;
  input: Record<string,string>;
  example: Record<string,any>;
  rps: number;
}

export function getToolSpecs(): ToolSpec[] {
  return [
    {
      source_id: 'pubmed',
      name: 'PubMed',
      description: 'Biomedical literature database',
      input: { term:'string', retmax:'number' },
      example: { term: 'diabetes AND GLP-1', retmax: 50 },
      rps: 10
    },
    {
      source_id: 'arxiv',
      name: 'arXiv',
      description: 'Pre-print archive',
      input: { query:'string', max_results:'number' },
      example: { query: 'machine learning', max_results: 50 },
      rps: 1
    },
    {
      source_id: 'wolfram',
      name: 'WolframAlpha',
      description: 'Computational knowledge engine',
      input: { input:'string' },
      example: { input: 'GDP of France 2020 to 2024' },
      rps: 1
    },
    {
      source_id: 'openalex',
      name: 'OpenAlex',
      description: 'Scholarly metadata service',
      input: { id:'string' },
      example: { id: 'https://openalex.org/W123' },
      rps: 10
    },
    {
      source_id: 'mediawiki',
      name: 'Wikipedia',
      description: 'MediaWiki search',
      input: { term:'string', limit:'number' },
      example: { term: 'History of AI', limit: 5 },
      rps: 5
    },
    {
      source_id: 'leaks',
      name: 'Leaks',
      description: 'DocumentCloud leaks search',
      input: { query:'string', limit:'number' },
      example: { query: 'clinical trial fraud', limit: 5 },
      rps: 1
    }
  ];
}
