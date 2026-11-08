import React from 'react';
import { LucideIcon } from 'lucide-react';
import BackButton from '../ui/BackButton';

interface PageHeaderProps {
  title: string;
  highlightedText?: string;
  subtitle?: string;
  backLink?: {
    to: string;
    label: string;
  };
  icon?: LucideIcon;
  iconClassName?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  highlightedText,
  subtitle,
  backLink,
  icon: Icon,
  iconClassName = '',
}) => {
  return (
    <div className="mb-12">
      {backLink && (
        <div className="mb-6">
          <BackButton to={backLink.to} label={backLink.label} />
        </div>
      )}

      <div className="border-b border-border pb-8 bg-gradient-to-b from-surface/30 to-transparent -mx-4 px-4 md:-mx-8 md:px-8 pt-4">
        <h1 className="type-display text-primary mb-4 flex items-center">
          {/* One inline run, so a space at the end of the title survives the flex row ("NOTAMs & News"). */}
          <span>
            {title}
            {highlightedText && <span className="text-accent">{highlightedText}</span>}
          </span>
          {Icon && <Icon aria-hidden="true" className={`ml-4 ${iconClassName}`} size={16} />}
        </h1>
        {subtitle && <p className="type-body text-muted max-w-2xl">{subtitle}</p>}
      </div>
    </div>
  );
};

export default PageHeader;
