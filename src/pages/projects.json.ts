import { getCollection } from 'astro:content';

// Build-time list of valid project slugs. The Worker reads this to reject love votes for unknown projects.
export async function GET() {
  const projects = await getCollection('projects');
  return new Response(JSON.stringify({ slugs: projects.map((p) => p.id) }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
