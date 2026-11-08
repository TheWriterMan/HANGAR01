import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAircraftList } from '../../services/aircraft';
import { useHydrated } from '../../hooks/useHydrated';
import AircraftCard from '../../components/ui/AircraftCard';
import SEO, { BASE_URL } from '../../components/seo/SEO';
import { checklistPageTitle, formatAircraftName } from '../../utils/aircraft';
import { AircraftSummary } from '../../types';
import AircraftSearchBar from './AircraftSearchBar';
import AircraftCategoryFilter, { AircraftCategory } from './AircraftCategoryFilter';

const validCategories: AircraftCategory[] = ['all', 'airliner', 'business-jet', 'ga', 'military'];

/** ItemList of every checklist page, in the order the page lists them. */
const aircraftListSchema = (aircraft: AircraftSummary[]) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: aircraft.map((ac, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `${BASE_URL}/aircraft/${ac.slug}`,
    name: checklistPageTitle(ac),
  })),
});

const AircraftsPage: React.FC = () => {
  // Bundled at build time, so the prerendered HTML lists every aircraft.
  const aircraft = getAircraftList();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  // The prerendered page has no query string, so apply ?category= only after
  // hydration to keep the first client render identical to the static HTML.
  const hydrated = useHydrated();
  const categoryParam = hydrated ? searchParams.get('category') : null;
  const category: AircraftCategory = validCategories.includes(categoryParam as AircraftCategory)
    ? (categoryParam as AircraftCategory)
    : 'all';

  const handleCategoryChange = (nextCategory: AircraftCategory) => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextCategory === 'all') nextParams.delete('category');
    else nextParams.set('category', nextCategory);
    setSearchParams(nextParams);
  };

  const filteredAircraft = aircraft.filter((ac) => {
    const term = searchTerm.toLowerCase();
    const fullName = formatAircraftName(ac).toLowerCase();
    const matchesSearch = fullName.includes(term);
    const matchesCategory =
      category === 'all' ||
      (category === 'ga'
        ? ac.systemsType === 'piston' || ac.systemsType === 'turboprop'
        : ac.systemsType === category);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-base min-h-screen pt-12 pb-20">
      <SEO
        title="All Aircraft Checklists"
        description={`Browse all ${aircraft.length} interactive MSFS checklists for airliners, business jets, turboprops, piston aircraft and military types, from startup to shutdown.`}
        path="/aircraft"
        jsonLd={[aircraftListSchema(aircraft)]}
      />
      <div className="container-page">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>
            <h1 className="type-display text-primary mb-2">Aircraft</h1>
          </div>
          <AircraftSearchBar value={searchTerm} onChange={setSearchTerm} />
        </div>

        <div className="mb-8">
          <AircraftCategoryFilter active={category} onChange={handleCategoryChange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAircraft.map((ac, index) => (
            <AircraftCard key={ac.slug} aircraft={ac} index={index} />
          ))}
        </div>

        {filteredAircraft.length === 0 && (
          <div className="text-center py-20 text-muted uppercase">
            No aircraft match your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default AircraftsPage;
