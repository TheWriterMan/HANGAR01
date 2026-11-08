import React from 'react';

interface PostHeroBannerProps {
  imageUrl: string;
  imageAltText?: string;
  /** Photographer and licence, e.g. "Photo: John Murphy, CC BY-SA 2.0". */
  credit?: string;
  /** The photo's source page. */
  creditUrl?: string;
  /** A drawn card shows at full strength, without the fade a photo gets. */
  card?: boolean;
}

const PostHeroBanner: React.FC<PostHeroBannerProps> = ({
  imageUrl,
  imageAltText,
  credit,
  creditUrl,
  card = false,
}) => {
  return (
    <figure>
      <div className="relative w-full aspect-[21/9] overflow-hidden border border-border bg-base">
        <img
          src={imageUrl}
          width={1680}
          height={720}
          alt={imageAltText || ''}
          decoding="async"
          // The post's largest image, so fetch it first.
          fetchPriority="high"
          className={`w-full h-full object-cover ${card ? '' : 'opacity-80'}`}
        />
        {!card && (
          <div className="absolute inset-0 bg-gradient-to-t from-base/80 via-transparent to-transparent pointer-events-none" />
        )}
      </div>
      {credit && (
        <figcaption className="mt-2 text-2xs text-muted text-right">
          {creditUrl ? (
            <a
              href={creditUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary underline-offset-2 hover:underline"
            >
              {credit}
            </a>
          ) : (
            credit
          )}
        </figcaption>
      )}
    </figure>
  );
};

export default PostHeroBanner;
