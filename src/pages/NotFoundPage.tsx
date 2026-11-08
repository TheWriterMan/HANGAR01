import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/seo/SEO';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
      <SEO
        title="Page Not Found"
        description="The page you're looking for doesn't exist or has been moved."
        path="/404"
        noindex
      />
      <h1 className="type-display text-primary mb-4">
        HANGAR<span className="text-accent">_404</span>
      </h1>
      <p className="text-muted type-body mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="text-xs uppercase text-accent border border-accent px-4 py-2 hover:bg-accent hover:text-inverted transition-colors"
      >
        Return home
      </Link>
    </div>
  );
};

export default NotFoundPage;
