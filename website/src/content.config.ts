import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import articleLoader from './content/article-loader.mjs';

const articles = defineCollection({
  loader: articleLoader,
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    section: z.enum(['learn', 'guides', 'troubleshoot']),
    summary: z.string(),
    visual: z.enum(['huge-pages', 'msr', 'hashrate', 'threads', 'memory', 'setup']),
    callout: z.object({ label: z.string(), state: z.enum(['good', 'check', 'limited', 'info', 'unavailable']), body: z.string() }).optional(),
    draft: z.boolean().default(false),
    sources: z.array(z.object({ organization: z.string(), title: z.string(), url: z.url(), accessed: z.coerce.date() })).min(1),
    related: z.array(z.string()).default([]),
  }),
});

export const collections = { articles };
