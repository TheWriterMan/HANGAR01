import React from 'react';
import { BlogPost } from '../../types';
import { aircraftInPost, relatedPosts } from '../../utils/related';
import RelatedSection from '../../components/layout/RelatedSection';
import AircraftCard from '../../components/ui/AircraftCard';
import BlogCard from '../../components/ui/BlogCard';

/** Checklists the post covers, then related posts. */
const PostRelated: React.FC<{ post: BlogPost }> = ({ post }) => {
  const aircraft = aircraftInPost(post);
  const posts = relatedPosts(post);

  return (
    <>
      {aircraft.length > 0 && (
        <RelatedSection id="post-aircraft" eyebrow="Fly It" title="Checklists in This Post">
          {aircraft.map((ac, i) => (
            <AircraftCard key={ac.slug} aircraft={ac} index={i} headingLevel="h3" />
          ))}
        </RelatedSection>
      )}
      {posts.length > 0 && (
        <RelatedSection id="related-posts" eyebrow="Read More" title="Related Posts">
          {posts.map((p, i) => (
            <BlogCard key={p._id} post={p} index={i} headingLevel="h3" />
          ))}
        </RelatedSection>
      )}
    </>
  );
};

export default PostRelated;
