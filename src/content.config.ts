import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One markdown file per project in src/content/projects. The file name is the slug,
// which is also the key used by the love counter, so don't rename a file after launch.
const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    tagline: z.string(),
    status: z.enum(['live', 'testing', 'building', 'archived']),
    tags: z.array(z.string()).default([]),
    /** Sort position on the shelf (lowest first). Also drives the EXP—00N label. */
    order: z.number(),
    /** Which CSS thumbnail art to show. */
    thumb: z.enum(['world', 'bloom', 'tiny', 'museum', 'prompt', 'dice']),
    /** Small mono label in the thumbnail corner, e.g. WORLD_001. */
    code: z.string(),
    /** Where the project lives. Leave out for "coming soon". */
    url: z.url().optional(),
    /** Placeholder entry: shows the "illustrative" footnote on the home page. */
    sample: z.boolean().default(false),
  }),
});

export const collections = { projects };
