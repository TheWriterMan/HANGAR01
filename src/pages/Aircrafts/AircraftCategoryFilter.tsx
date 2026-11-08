import React from 'react';

export type AircraftCategory = 'all' | 'airliner' | 'business-jet' | 'ga' | 'military';

interface AircraftCategoryFilterProps {
  active: AircraftCategory;
  onChange: (category: AircraftCategory) => void;
}

const categories: { value: AircraftCategory; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'airliner', label: 'Airliners' },
  { value: 'business-jet', label: 'Business Jets' },
  { value: 'ga', label: 'General Aviation' },
  { value: 'military', label: 'Military' },
];

const AircraftCategoryFilter: React.FC<AircraftCategoryFilterProps> = ({ active, onChange }) => {
  return (
    <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
      {categories.map(({ value, label }) => {
        const isActive = active === value;
        return (
          <button
            key={value}
            onClick={() => onChange(value)}
            aria-pressed={isActive}
            className={`text-2xs font-medium uppercase px-3 py-1.5 border transition-colors duration-fast ${
              isActive
                ? 'border-accent text-accent'
                : 'border-border text-muted hover:text-primary hover:border-primary'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default AircraftCategoryFilter;
