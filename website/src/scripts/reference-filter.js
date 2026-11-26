import { filterReference, defaultReferenceFilters } from '../lib/reference-filter.mjs';

const root = document.querySelector('.log-reference');
if (root) {
  const form = root.querySelector('#reference-filter');
  const query = form.elements.namedItem('query');
  const category = form.elements.namedItem('category');
  const sections = [...root.querySelectorAll('[data-reference-id]')];
  const inventory = sections.map(el => ({ id: el.dataset.referenceId, category: el.dataset.category, text: el.dataset.search }));
  const categories = [...root.querySelectorAll('.reference-category')];
  const count = root.querySelector('#reference-results');
  let timer;
  function update(announce = true) {
    const matches = new Set(filterReference(inventory, { query: query.value, category: category.value }).map(e => e.id));
    // If a focused descendant would disappear, keep focus on the search field.
    if (sections.some(el => !matches.has(el.dataset.referenceId) && el.contains(document.activeElement))) query.focus();
    sections.forEach(el => { el.hidden = !matches.has(el.dataset.referenceId); });
    categories.forEach(el => { el.hidden = !el.querySelector('[data-reference-id]:not([hidden])'); });
    const message = `${matches.size} of ${inventory.length} entries`;
    count.textContent = message;
    root.querySelector('#reference-empty').hidden = matches.size !== 0;
    clearTimeout(timer);
    if (announce) timer = setTimeout(() => { root.querySelector('#reference-announcement').textContent = message; }, 350);
  }
  function reset() {
    const defaults = defaultReferenceFilters();
    query.value = defaults.query; category.value = defaults.category; update();
  }
  function revealHash(hash = location.hash) {
    let id;
    try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target || !root.contains(target) || !target.closest('[hidden]')) return;
    reset();
    requestAnimationFrame(() => target.scrollIntoView({ behavior: 'instant', block: 'start' }));
  }
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', () => update());
  form.addEventListener('change', () => update());
  form.addEventListener('reset', event => { event.preventDefault(); reset(); });
  root.querySelector('#reference-clear').addEventListener('click', () => { query.value = ''; update(); query.focus(); });
  // Also handle clicking a link to the current fragment (no hashchange event).
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link) revealHash(link.getAttribute('href'));
  });
  window.addEventListener('hashchange', () => revealHash());
  update(false); form.hidden = false; revealHash();
}
