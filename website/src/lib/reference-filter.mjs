// Retrieval vocabulary only: these aliases do not recognize or diagnose logs.
const aliases = {
  'huge-pages-full': 'hp large pages', 'huge-pages-partial': 'hp large pages',
  'msr-applied': 'model specific registers optimization', 'msr-failed': 'model specific registers optimization',
  'dataset-ready': 'rx randomx', 'speed-summary': 'hs hashrate speed',
  'share-accepted': 'accepted shares', 'share-rejected': 'rejected shares',
};

export function referenceSearchText(entry, categories) {
  return [entry.title, entry.example, entry.category,
    categories.find(category => category.id === entry.category)?.label,
    entry.establishes, entry.doesNot, entry.context, entry.action, entry.link,
    entry.coverage, aliases[entry.id]].filter(Boolean).join(' ').toLowerCase();
}

export const defaultReferenceFilters = () => ({ query: '', category: '' });

export function filterReference(entries, { query = '', category = '' } = {}) {
  const terms = query.trim().toLowerCase().split(/\s+/u).filter(Boolean);
  return entries.filter(entry => (!category || entry.category === category)
    && terms.every(term => entry.text.includes(term)));
}
