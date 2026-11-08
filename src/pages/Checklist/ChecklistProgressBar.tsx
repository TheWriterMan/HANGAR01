import React from 'react';

interface ChecklistProgressBarProps {
  progress: number;
}

const ChecklistProgressBar: React.FC<ChecklistProgressBarProps> = ({ progress }) => {
  return (
    <div
      className="print:hidden! sticky top-12 left-0 right-0 h-1 bg-surface-raised z-progress"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Checklist progress"
    >
      <div
        className={`h-full transition-all duration-base ease-out ${
          progress === 100 ? 'bg-success' : 'bg-accent'
        }`}
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};

export default ChecklistProgressBar;
