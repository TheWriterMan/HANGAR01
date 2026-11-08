import React from 'react';

interface PageLoadingStateProps {
  message?: string;
  variant?: 'inline' | 'fullPage';
  className?: string;
}

const PageLoadingState: React.FC<PageLoadingStateProps> = ({
  message = 'LOADING...',
  variant = 'inline',
  className = '',
}) => {
  const baseClasses = 'flex items-center justify-center';
  const variantClasses = variant === 'fullPage' ? 'min-h-screen bg-base' : '';

  return (
    <div
      className={`${baseClasses} ${variantClasses} ${className}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
};

export default PageLoadingState;
