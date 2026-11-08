import React, { useMemo } from 'react';
import HomeHero from './HomeHero';
import BlogPreviewGrid from './BlogPreviewGrid';
import FAQSection from './FAQSection';
import FeaturedAircraftSection from './FeaturedAircraftSection';
import SEO, { BASE_URL, LOGO_URL, SITE_NAME } from '../../components/seo/SEO';
import { getHomePageData } from '../../services/aircraft';
import { getAllPosts } from '../../utils/posts';

const SITE_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${BASE_URL}/#organization`,
    name: SITE_NAME,
    url: `${BASE_URL}/`,
    logo: LOGO_URL,
    // Profiles that belong to the site. Add the GitHub repository once it is public.
    sameAs: ['https://ko-fi.com/slippery'],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    name: SITE_NAME,
    url: `${BASE_URL}/`,
    publisher: { '@id': `${BASE_URL}/#organization` },
  },
];

const Home: React.FC = () => {
  // Aircraft index and posts are bundled at build time, so reading them is
  // synchronous and the prerendered HTML includes them.
  const { newAircraft, popular } = useMemo(() => getHomePageData(), []);
  const posts = useMemo(() => getAllPosts(150).slice(0, 3), []);

  return (
    <div className="min-h-screen">
      <SEO title="MSFS Checklists for Add-on Aircraft" path="/" jsonLd={SITE_SCHEMA} />
      <HomeHero />

      <div className="container-page py-12 md:py-16">
        <FeaturedAircraftSection newAircraft={newAircraft} popular={popular} />
        <BlogPreviewGrid posts={posts} />
      </div>

      <FAQSection />
    </div>
  );
};

export default Home;
