export const PUBMED_GUIDE = `
PURPOSE: Retrieve peer-reviewed biomedical literature relevant to the brief’s objective and key_questions.
LOOK FOR: Primary studies, reviews, and meta-analyses within scope.timeframe/domains/comparators.
HOW: Use boolean term from buildPubMedBoolean(brief). Apply timeframe if present. retmax: 50–200.
OUTPUT: RecordLite[] { title, url, abstract, published: year, source_id:"pubmed" }. Deduplicate by PMID/URL.
`.trim();

export const ARXIV_GUIDE = `
PURPOSE: Retrieve preprints/articles in relevant arXiv categories.
LOOK FOR: Works directly answering key_questions; honor timeframe.
HOW: Use query from buildArxivQuery(brief). max_results: 50–200. Respect ≥3s delay if paging.
OUTPUT: RecordLite[] { title, url, abstract, published: year, source_id:"arxiv" }. Deduplicate by arXiv ID/URL.
`.trim();

export const OPENALEX_GUIDE = `
PURPOSE: Enrich records with citation_count and metadata when OPENALEX_EMAIL is configured.
HOW: Query by DOI/title. If unavailable, skip silently.
OUTPUT: Same RecordLite with optional citation_count.
`.trim();

export const MEDIAWIKI_GUIDE = `
PURPOSE: High-level background summaries for definitions/entities.
HOW: Query Wikipedia extract for a concise term. 
OUTPUT: RecordLite { title, url, abstract: extract, published: current_year, source_id:"mediawiki" }. Use as background, not primary evidence.
`.trim();

export const LEAKS_GUIDE = `
PURPOSE: Surface primary documents/leaks/FOIA materials relevant to entities/keywords from the brief.
HOW: Use query from buildLeaksQuery(brief). Prefer items within timeframe.
OUTPUT: RecordLite[] { title, url, abstract: snippet, published: year, source_id:"leaks" }.
`.trim();

export const WOLFRAM_GUIDE = `
PURPOSE: Compute/retrieve numeric facts and time series; unit-aware derived quantities.

ENDPOINT:
- Base: https://www.wolframalpha.com/api/v1/llm-api
- Required: appid, input (URL-encoded). Alternative auth: Header Authorization: Bearer <AppID>.
- Optional: maxchars (e.g., 500–6800), and a subset of Full Results params: assumption, units, timezone, location, ip, latlong, languagecode, etc.

QUERY SHAPING:
- Input is a single-line English string (convert verbose text to concise keywords).
- Include timeframe from brief.scope.timeframe and units (SI preferred) where relevant.
- For ambiguous queries, use ‘assumption’ param to disambiguate; retry once if needed.
- Numeric formatting: prefer 6*10^14 vs 6e14. Use named physical constants in queries.

ERROR HANDLING:
- 400 missing input → fix assembly; 403 invalid/missing appid → fall back to fixture; 501 unintelligible → simplify or use assumptions.

OUTPUT NORMALIZATION:
- Convert tables/pods to RecordLite rows:
  { title, url: wolframResultURL, abstract: concise plaintext summary, published: current_year, source_id:"wolfram" }.
- For time series, include key points (start/end/latest) in abstract.
`.trim();
