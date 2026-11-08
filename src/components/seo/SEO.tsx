import React from 'react';
import { Helmet } from 'react-helmet-async';

interface ArticleMeta {
  publishedAt: string;
  /** When the post last changed in substance. Defaults to `publishedAt`. */
  updatedAt?: string;
  section?: string;
}

type JsonLd = Record<string, unknown>;

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  /** When set, emits article Open Graph tags and Article JSON-LD. */
  article?: ArticleMeta;
  /** Extra structured data (breadcrumbs, lists, site schema). */
  jsonLd?: JsonLd[];
  /** Keeps the page out of search results (drafts and the 404 page). */
  noindex?: boolean;
}

export const SITE_NAME = 'HANGAR01';
const DEFAULT_DESCRIPTION =
  'Interactive checklists for MSFS add-on aircraft, from PMDG and FlyByWire airliners to GA, business jets and military types. Fly every phase by the book.';
// The apex domain 308-redirects to www, so www is the canonical host.
export const BASE_URL = 'https://www.hangar01.space';
const DEFAULT_IMAGE = '/OpenGraph.jpg';
export const LOGO_URL = `${BASE_URL}/pwa-512x512.png`;

/** JSON that is safe inside a <script> element. */
const scriptJson = (data: JsonLd) => JSON.stringify(data).replace(/</g, '\\u003c');

const SEO: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  image = DEFAULT_IMAGE,
  article,
  jsonLd = [],
  noindex = false,
}) => {
  const pageTitle = title
    ? `${title} — ${SITE_NAME}`
    : `${SITE_NAME} — Flight Sim EFB & Checklist Companion`;
  const fullUrl = `${BASE_URL}${path}`;
  const imageUrl = image.startsWith('http') ? image : `${BASE_URL}${image}`;

  const articleLd = article && {
    '@context': 'https://schema.org',
    '@type': article.section === 'News' ? 'NewsArticle' : 'Article',
    headline: title,
    description,
    image: [imageUrl],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    mainEntityOfPage: fullUrl,
    articleSection: article.section,
    author: { '@type': 'Organization', name: SITE_NAME, url: BASE_URL },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: LOGO_URL },
    },
  };
  const schemas = articleLd ? [articleLd, ...jsonLd] : jsonLd;

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      {/* A canonical on a noindex page sends search engines mixed signals. */}
      {noindex ? <meta name="robots" content="noindex" /> : <link rel="canonical" href={fullUrl} />}

      {/* Open Graph */}
      <meta property="og:type" content={article ? 'article' : 'website'} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      {article && <meta property="article:published_time" content={article.publishedAt} />}
      {article && (
        <meta property="article:modified_time" content={article.updatedAt ?? article.publishedAt} />
      )}
      {article?.section && <meta property="article:section" content={article.section} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {schemas.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {scriptJson(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
