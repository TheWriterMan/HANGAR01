import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getPostBySlug } from '../../utils/posts';
import Breadcrumbs, { breadcrumbSchema, Crumb } from '../../components/layout/Breadcrumbs';
import { MarkdownBlocks, parseMarkdown } from './MarkdownComponents';
import PostTOC from './PostTOC';
import SEO from '../../components/seo/SEO';
import NotFoundPage from '../NotFoundPage';
import PostHeroBanner from './PostHeroBanner';
import PostHeaderCard from './PostHeaderCard';
import PostRelated from './PostRelated';
import ProcedurePost, { isProcedurePost } from './ProcedurePost';

const BlogPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  // Posts are bundled at build time, so the lookup is synchronous.
  const post = useMemo(() => (id ? getPostBySlug(id) : null), [id]);
  const blocks = useMemo(() => (post ? parseMarkdown(post.content) : []), [post]);

  if (!post) {
    return <NotFoundPage />;
  }

  const path = `/news/${post.slug.current}`;
  const crumbs: Crumb[] = [
    { label: 'Home', to: '/' },
    { label: 'News', to: '/news' },
    { label: post.title, to: path },
  ];

  return (
    <div className="min-h-screen bg-base pb-20">
      <SEO
        title={post.metaTitle || post.title}
        description={post.description || post.excerpt || `Read "${post.title}" on HANGAR01.`}
        path={path}
        image={post.imageUrl || undefined}
        noindex={post.status === 'draft'}
        article={{
          publishedAt: post.publishedAt,
          updatedAt: post.updatedAt,
          section: post.category,
        }}
        jsonLd={[breadcrumbSchema(crumbs)]}
      />

      {isProcedurePost(post.content) ? (
        <div className="container-page">
          <ProcedurePost
            post={post}
            before={<Breadcrumbs crumbs={crumbs} className="mb-8 pt-8 md:pt-12" />}
            after={<PostRelated post={post} />}
          />
        </div>
      ) : (
        <div className="container-content pt-8 md:pt-12">
          <Breadcrumbs crumbs={crumbs} className="mb-8" />

          <article className="relative animate-fade-up">
            <PostTOC blocks={blocks} />

            {post.imageUrl && (
              <PostHeroBanner
                imageUrl={post.imageUrl}
                imageAltText={post.imageAltText}
                credit={post.imageCredit}
                creditUrl={post.imageCreditUrl}
                card={post.bannerStyle === 'card'}
              />
            )}

            <PostHeaderCard post={post} />

            {/* Content Body */}
            <div className="pt-10">
              <div className="prose prose-invert prose-lg max-w-none">
                <MarkdownBlocks blocks={blocks} />
              </div>
            </div>
          </article>

          <PostRelated post={post} />
        </div>
      )}
    </div>
  );
};

export default BlogPostPage;
