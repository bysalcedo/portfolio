import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const base = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  stack: z.array(z.string()).default([]),
  // Hasta que Daniel lo revise: visible en `astro dev`, fuera del build.
  draft: z.boolean().default(true),
});

const cases = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cases' }),
  schema: base.extend({
    result: z.string().optional(),
    kind: z.string(),
    order: z.number().default(99),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: base.extend({
    format: z.enum(['postmortem', 'articulo']).default('postmortem'),
  }),
});

export const collections = { cases, blog };
