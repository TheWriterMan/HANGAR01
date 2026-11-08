import React, { useMemo } from 'react';
import { getAllPosts } from '../../utils/posts';
import PageHeader from '../../components/layout/PageHeader';
import BlogCard from '../../components/ui/BlogCard';
import SEO from '../../components/seo/SEO';

const NotamsPage: React.FC = () => {
  // Posts are bundled at build time, so reading them is synchronous.
  const posts = useMemo(() => getAllPosts(200), []);

  return (
    <div className="min-h-screen bg-base pb-20">
      <SEO
        title="Flight Sim News & Updates"
        description="MSFS news and add-on updates from HANGAR01, plus release notes for new and updated aircraft checklists."
        path="/news"
      />
      <div className="container-page pt-8 md:pt-16">
        <PageHeader
          title="NOTAMs "
          highlightedText="& News"
          subtitle="Updates, dev logs, and flight sim thoughts from the HANGAR01 team."
          backLink={{ to: '/', label: 'Return home' }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, i) => (
            <BlogCard key={post._id} post={post} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotamsPage;
