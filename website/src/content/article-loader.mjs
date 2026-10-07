import { readdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { basename, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const { parse: parseYaml } = createRequire(import.meta.url)('yaml');
const articleDirectory = fileURLToPath(new URL('./articles/', import.meta.url));

const articleLoader = {
  name: 'ember-article-files',
  /** @param {import('astro/loaders').LoaderContext} context */
  async load(context) {
    const { store, parseData, renderMarkdown, generateDigest, watcher } = context;
    async function refresh() {
      store.clear();
      const files = (await readdir(articleDirectory)).filter((file) => file.endsWith('.md')).sort();
      for (const file of files) {
        const filePath = join(articleDirectory, file);
        const source = await readFile(filePath, 'utf8');
        const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
        if (!match) throw new Error(`Missing YAML frontmatter in ${file}`);
        const data = parseYaml(match[1]);
        const body = match[2];
        const id = basename(file, '.md');
        const parsedData = await parseData({ id, data, filePath });
        const rendered = await renderMarkdown(body, { fileURL: pathToFileURL(filePath) });
        store.set({ id, data: parsedData, body, rendered, digest: generateDigest(source), filePath: relative(process.cwd(), filePath).replaceAll('\\', '/') });
      }
    }
    await refresh();
    if (watcher) {
      watcher.add(articleDirectory);
      const onChange = (changedPath) => {
        if (changedPath.startsWith(articleDirectory) && changedPath.endsWith('.md')) void refresh();
      };
      watcher.on('add', onChange);
      watcher.on('change', onChange);
      watcher.on('unlink', onChange);
    }
  },
};

export default articleLoader;
