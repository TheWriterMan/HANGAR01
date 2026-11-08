import { Lock } from 'lucide-react';
import type { FC } from 'react';

const ComingSoonBadge: FC = () => (
  <span className="ml-auto inline-flex shrink-0 items-center gap-1 border border-border bg-surface-raised px-1.5 py-0.5 text-2xs font-medium uppercase text-muted/50">
    <Lock size={12} aria-hidden="true" />
    Soon
  </span>
);

export default ComingSoonBadge;
