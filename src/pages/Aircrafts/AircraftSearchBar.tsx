import React from 'react';
import { Search, Filter } from 'lucide-react';

interface AircraftSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

const AircraftSearchBar: React.FC<AircraftSearchBarProps> = ({ value, onChange }) => {
  return (
    <div className="relative w-full md:w-96 group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search
          className="text-faint group-focus-within:text-accent transition-colors"
          size={16}
          aria-hidden="true"
        />
      </div>
      <label htmlFor="aircraft-search" className="sr-only">
        Search aircraft
      </label>
      <input
        id="aircraft-search"
        type="text"
        placeholder="Search aircraft…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface border border-border text-primary text-sm py-3 pl-10 pr-4 focus:border-accent transition-colors placeholder:text-faint uppercase"
      />
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <Filter className="text-faint" size={14} aria-hidden="true" />
      </div>
    </div>
  );
};

export default AircraftSearchBar;
