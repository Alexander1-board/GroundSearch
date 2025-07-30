export function buildPubMedBoolean(brief: import('../spec/schemas.js').ResearchBrief): string {
  const parts = [brief.objective];
  if (brief.scope?.comparators?.length) {
    parts.push('(' + brief.scope.comparators.join(' OR ') + ')');
  }
  if (brief.scope?.timeframe?.from || brief.scope?.timeframe?.to) {
    const from = brief.scope.timeframe.from ?? '1900';
    const to = brief.scope.timeframe.to ?? new Date().getFullYear().toString();
    parts.push(`${from}:${to}[dp]`);
  }
  return parts.filter(Boolean).join(' AND ');
}

export function buildArxivQuery(brief: import('../spec/schemas.js').ResearchBrief): string {
  const pieces = [brief.objective];
  if (brief.scope?.comparators?.length) {
    pieces.push(brief.scope.comparators.join(' '));
  }
  return pieces.join(' ');
}

export function buildWolframInput(brief: import('../spec/schemas.js').ResearchBrief): string {
  const timeframe = brief.scope?.timeframe;
  const q = brief.objective;
  if (!timeframe?.from && !timeframe?.to) return q;
  const from = timeframe.from ?? '1900-01-01';
  const to = timeframe.to ?? new Date().toISOString().slice(0,10);
  return `${q} from ${from} to ${to}`;
}
