export interface ToolSpec {
  id: string;
  name: string;
  description: string;
  input_schema: Record<string, string>;
  rate_hints?: string;
  result_shape: string;
}

export function getToolSpecs(): ToolSpec[] {
  return [
    {
      id: 'pubmed',
      name: 'PubMed',
      description: 'Biomedical literature database',
      input_schema: { term: 'string', retmax: 'number' },
      rate_hints: '~10 rps',
      result_shape: 'RecordLite[]'
    },
    {
      id: 'arxiv',
      name: 'arXiv',
      description: 'Pre-print archive',
      input_schema: { query: 'string', max_results: 'number' },
      rate_hints: '~1 rps',
      result_shape: 'RecordLite[]'
    },
    {
      id: 'wolfram',
      name: 'WolframAlpha',
      description: 'Computational knowledge engine',
      input_schema: { input: 'string' },
      rate_hints: '~1 rps',
      result_shape: '{ title:string, abstract:string }[]'
    },
    {
      id: 'openalex',
      name: 'OpenAlex',
      description: 'Scholarly metadata service',
      input_schema: { id: 'string' },
      rate_hints: '~10 rps',
      result_shape: 'OpenAlex record'
    },
    {
      id: 'mediawiki',
      name: 'Wikipedia',
      description: 'MediaWiki search',
      input_schema: { term: 'string', limit: 'number' },
      rate_hints: '~5 rps',
      result_shape: 'RecordLite[]'
    },
    {
      id: 'leaks',
      name: 'Leaks',
      description: 'DocumentCloud leaks search',
      input_schema: { query: 'string', limit: 'number' },
      rate_hints: '~1 rps',
      result_shape: 'RecordLite[]'
    }
  ];
}
