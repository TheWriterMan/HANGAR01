import { BlogPost } from '../types';

// Load all markdown files from /content/posts/
const files = import.meta.glob('/content/posts/*.md', { query: '?raw', eager: true }) as Record<
  string,
  { default: string }
>;

/**
 * Replicates pt::text(content)[0...N] + "..." by extracting prose from Markdown
 * and ignoring code blocks, callouts, markdown symbols, and images.
 */
export function deriveExcerpt(markdownBody: string, n: 150 | 200): string {
  const prose = markdownBody
    .replace(/```[\s\S]*?```/g, ' ') // codeBlock -> ignored
    .replace(/:::[\s\S]*?:::/g, ' ') // callout   -> ignored
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ') // images    -> ignored
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1') // links     -> their text
    .replace(/^\s*[-*+]\s+/gm, ' ') // list markers -> ignored, so "E-Jets" keeps its hyphen
    .replace(/[#>*_`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (prose.length <= n) {
    return prose + '...';
  }
  return prose.slice(0, n) + '...';
}

/**
 * Parses raw markdown content with YAML frontmatter.
 * Maps `timage` (external url) and `bannerImage` (local url) to the `imageUrl` property.
 */
export function parsePost(rawMarkdown: string, excerptLength: 150 | 200 = 200): BlogPost {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = rawMarkdown.match(frontmatterRegex);

  if (!match) {
    return {
      _id: 'unknown',
      title: 'Untitled',
      slug: { current: '' },
      publishedAt: new Date().toISOString(),
      category: 'News',
      content: rawMarkdown,
      excerpt: deriveExcerpt(rawMarkdown, excerptLength),
    };
  }

  const yamlBlock = match[1];
  const content = match[2];

  const metadata: Record<string, string> = {};
  const lines = yamlBlock.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim();
      let value = line.slice(colonIndex + 1).trim();

      // Remove wrapping quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      metadata[key] = value;
    }
  }

  const slugStr = metadata.slug || '';
  const dateStr = metadata.date || '';
  const bannerImage = metadata.bannerImage || '';
  const timage = metadata.timage || '';

  // Use local bannerImage if available, fallback to external timage
  const imageUrl = bannerImage || timage || undefined;

  return {
    _id: `post-${slugStr}`,
    title: metadata.title || 'Untitled',
    slug: { current: slugStr },
    publishedAt: dateStr,
    updatedAt: metadata.updated || undefined,
    status: (metadata.status === 'draft' ? 'draft' : 'published') as 'draft' | 'published',
    category: (metadata.category || 'News') as BlogPost['category'],
    description: metadata.description || undefined,
    imageUrl,
    imageAltText: metadata.imageAltText || undefined,
    metaTitle: metadata.metaTitle || undefined,
    imageCredit: metadata.imageCredit || undefined,
    imageCreditUrl: metadata.imageCreditUrl || undefined,
    content: content,
    excerpt: deriveExcerpt(content, excerptLength),
  };
}

/**
 * Formats a post date the same way on the build server and in every browser
 * (fixed locale, UTC), so prerendered dates hydrate without a mismatch.
 */
export function formatPostDate(iso: string, month: 'short' | 'long' = 'short'): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month,
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Returns all published blog posts / NOTAMs sorted by date desc.
 * Draft posts are excluded from production builds but visible on the local
 * dev server and the dev preview (dev.hangar01.space), so drafts from the
 * content pipeline can be reviewed in place. Drafts render with noindex.
 */
export function getAllPosts(excerptLength: 150 | 200 = 200): BlogPost[] {
  return Object.values(files)
    .map((m) => parsePost(m.default, excerptLength))
    .filter((p) => import.meta.env.DEV || __SHOW_DRAFTS__ || p.status !== 'draft')
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

/**
 * Returns a single published blog post by its slug.
 * Returns null for draft posts.
 */
export function getPostBySlug(slug: string): BlogPost | null {
  const allPosts = getAllPosts(200);
  return allPosts.find((p) => p.slug.current === slug) || null;
}
