import React from 'react';
import { BlogPostSummary } from '../../types';
import BlogCard from '../../components/ui/BlogCard';

interface BlogPreviewGridProps {
  posts: BlogPostSummary[];
}

const BlogPreviewGrid: React.FC<BlogPreviewGridProps> = ({ posts }) => {
  return (
    <section id="news" aria-labelledby="news-heading">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 id="news-heading" className="type-title text-primary">
          Blog
        </h2>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.length === 0 ? (
          <div className="md:col-span-3 px-6 py-10 text-center text-sm text-muted border border-border">
            No posts yet.
          </div>
        ) : (
          posts.map((post, i) => <BlogCard key={post._id} post={post} index={i} />)
        )}
      </div>
    </section>
  );
};

export default BlogPreviewGrid;
