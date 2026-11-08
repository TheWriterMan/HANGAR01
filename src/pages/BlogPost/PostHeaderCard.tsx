import React from 'react';
import { Calendar } from 'lucide-react';
import { BlogPost } from '../../types';
import { formatPostDate } from '../../utils/posts';
import CardBadge, { CardBadgeVariant } from '../../components/ui/CardBadge';

interface PostHeaderCardProps {
  post: BlogPost;
}

const PostHeaderCard: React.FC<PostHeaderCardProps> = ({ post }) => {
  return (
    <header className="pt-10 pb-8 border-b border-border">
      <div className="flex items-center gap-4 mb-6">
        <CardBadge variant={post.category.toLowerCase() as CardBadgeVariant} />
        <span className="flex items-center text-sm text-muted">
          <Calendar size={14} aria-hidden="true" className="mr-2 text-accent" />
          <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt, 'long')}</time>
        </span>
      </div>

      <h1 className="type-display text-primary mb-6">{post.title}</h1>

      {/* The summary, not the excerpt: the excerpt is the post's first words, so the opening
          read twice. */}
      {post.description && (
        <p className="text-lg text-muted leading-relaxed max-w-3xl">{post.description}</p>
      )}
    </header>
  );
};

export default PostHeaderCard;
