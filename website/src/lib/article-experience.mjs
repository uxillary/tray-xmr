// Reuse the HTML parser/serializer already installed with Astro's Markdown stack.
import { htmlToHast } from 'satteri';
import { toHtml } from 'hast-util-to-html';

const text = (node) => node.type === 'text' ? node.value : (node.children ?? []).map(text).join('');
const walk = (node, visit) => { visit(node); for (const child of node.children ?? []) walk(child, visit); };

/** Enhance rendered HTML, including authored HTML headings, once at build time. */
export function articleExperience(html) {
  const tree = htmlToHast(html, { fragment: true });
  // Shell IDs are reserved so authored headings cannot collide with the layout.
  const ids = new Set(['main', 'article-contents-title', 'article-visual-title', 'article-visual-description', 'sources-title']);
  walk(tree, (node) => {
    if (!node.properties?.id) return;
    const id = String(node.properties.id);
    if (/\s/.test(id)) throw new Error(`Invalid article ID: ${id}`);
    if (ids.has(id)) throw new Error(`Duplicate article ID: ${id}`);
    ids.add(id);
  });
  const headings = [];
  const tableLabels = new Map();
  let section = 'Article';
  walk(tree, (node) => {
    if (node.type !== 'element') return;
    if (/^h[2-6]$/.test(node.tagName)) {
      const label = text(node).replace(/\s+/g, ' ').trim();
      let id = node.properties.id;
      if (!id) {
        const base = label.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-') || 'section';
        id = base;
        for (let suffix = 2; ids.has(id); suffix++) id = `${base}-${suffix}`;
        ids.add(id);
        node.properties.id = id;
      }
      node.properties.tabIndex = -1;
      headings.push({ depth: Number(node.tagName[1]), slug: String(id), text: label });
      section = label;
    }
    if (node.tagName === 'pre') {
      node.properties.tabIndex = 0;
      node.properties.role = 'region';
      node.properties.ariaLabel = `${section}: code example`;
    }
    if (node.tagName === 'table') {
      const caption = node.children.find((child) => child.tagName === 'caption');
      tableLabels.set(node, caption ? text(caption) : section);
      if (!caption) node.children.unshift({ type: 'element', tagName: 'caption', properties: {}, children: [{ type: 'text', value: section }] });
      walk(node, (child) => {
        if (child.tagName === 'thead') walk(child, (cell) => { if (cell.tagName === 'th') cell.properties.scope = 'col'; });
        if (child.tagName === 'tbody') {
          for (const row of child.children.filter((item) => item.tagName === 'tr')) {
            const cell = row.children.find((item) => ['td', 'th'].includes(item.tagName));
            if (cell) { cell.tagName = 'th'; cell.properties.scope = 'row'; }
          }
        }
      });
    }
  });
  function containTables(parent) {
    if (!parent.children) return;
    parent.children = parent.children.map((child) => {
      containTables(child);
      if (child.tagName !== 'table' || parent.properties?.role === 'region') return child;
      return { type: 'element', tagName: 'div', properties: { className: ['article-table-scroll'], role: 'region', tabIndex: 0, ariaLabel: `${tableLabels.get(child)}: scrollable table` }, children: [
        { type: 'element', tagName: 'p', properties: { className: ['article-table-help'] }, children: [{ type: 'text', value: 'Scroll horizontally to compare all columns. Keyboard: focus this region and use the arrow keys.' }] }, child,
      ] };
    });
  }
  containTables(tree);
  return { html: toHtml(tree), headings };
}

/** Nest lower headings under their closest preceding higher heading. */
export function contentsTree(headings) {
  const roots = [];
  const stack = [];
  for (const heading of headings) {
    const item = { ...heading, children: [] };
    while (stack.length && stack.at(-1).depth >= item.depth) stack.pop();
    (stack.at(-1)?.children ?? roots).push(item);
    stack.push(item);
  }
  return roots;
}
