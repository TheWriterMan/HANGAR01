import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { BlogPost, BlogPostSummary } from '../../types';
import CardBadge, { CardBadgeVariant } from './CardBadge';
import { formatPostDate } from '../../utils/posts';
import { postCardImageUrl } from '../../utils/images';

interface BlogCardProps {
  post: BlogPost | BlogPostSummary;
  index?: number;
  /** h3 when the card sits under a section's h2. */
  headingLevel?: 'h2' | 'h3';
}

const BlogCard: React.FC<BlogCardProps> = ({ post, index = 0, headingLevel: Heading = 'h2' }) => {
  const imageUrl = post.imageUrl;

  return (
    <div className="group animate-fade-up" style={{ animationDelay: `${0.1 + index * 0.08}s` }}>
      <Link
        to={`/news/${post.slug.current}`}
        aria-label={`Read: ${post.title}`}
        className="block h-full bg-surface border border-border hover:border-accent/40 transition-colors duration-base overflow-hidden flex flex-col"
      >
        {/* Image */}
        <div className="relative h-52 overflow-hidden bg-surface">
          {imageUrl && (
            <img
              src={postCardImageUrl(imageUrl)}
              width={960}
              height={540}
              alt={post.imageAltText || ''}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-105 transform-gpu transition-transform duration-base"
            />
          )}
          {/* Category */}
          <div className="absolute top-3 left-3">
            <CardBadge variant={post.category.toLowerCase() as CardBadgeVariant} />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col p-6 gap-2">
          <span className="text-xs text-muted">
            <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
          </span>

          <Heading className="type-subheading font-medium text-primary leading-snug">
            {post.title}
          </Heading>

          {post.excerpt && <p className="type-body text-muted line-clamp-3">{post.excerpt}</p>}

          <div className="mt-auto pt-4 flex items-center justify-between text-xs text-muted group-hover:text-accent transition-colors">
            <span>Read more</span>
            <ArrowUpRight size={12} aria-hidden="true" />
          </div>
        </div>
      </Link>
    </div>
  );
};

export default BlogCard;
