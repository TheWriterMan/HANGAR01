export type AircraftStatus = 'active' | 'draft' | 'coming-soon';

interface BaseAircraft {
  slug: string;
  model: string;
  suffix?: string;
  manufacturer: string;
  description: string;
  systemsType: 'airliner' | 'business-jet' | 'turboprop' | 'piston' | 'military';
  status?: AircraftStatus;
  isNew?: boolean;
  addon?: string;
  flightsim?: string;
  simDepth?: string;
  /** Which version of the aircraft the checklist is written for, when the sim or add-ons offer more than one. */
  variant?: string;
}

export interface Aircraft extends BaseAircraft {
  checklist: ChecklistPhase[];
}

export interface AircraftSummary extends BaseAircraft {
  checklistCount: number;
  /** YYYY-MM-DD of the checklist's last commit. Missing in builds without full git history. */
  lastUpdated?: string;
}

export type ChecklistTier = 'quick' | 'normal' | 'full';

export interface ChecklistItem {
  label: string;
  action: string;
  info?: string;
  /** Kebab-case, unique within its phase, permanent. Progress is saved under `<phaseId>/<itemId>`. */
  id: string;
  tier?: ChecklistTier;
  /** @deprecated Use `tier` instead. */
  quickStart?: boolean;
}

export interface ChecklistGroup {
  title: string;
  items: ChecklistItem[];
}

export interface ChecklistPhase {
  title: string;
  /** Kebab-case, unique within the aircraft, permanent. */
  id: string;
  groups: ChecklistGroup[];
}

export interface BlogPostSummary {
  _id: string;
  slug: { current: string };
  title: string;
  publishedAt: string;
  /** Frontmatter `updated`: when the post last changed in substance. */
  updatedAt?: string;
  category: 'Update' | 'Tutorial' | 'News' | 'Training';
  status?: 'draft' | 'published';
  excerpt: string;
  /** Frontmatter `metaTitle`: a shorter title for search results when the headline runs past 60 characters with the site name. */
  metaTitle?: string;
  /** Frontmatter `description`. Used as the meta description when present. */
  description?: string;
  imageUrl?: string;
  imageAltText?: string;
  /** Frontmatter `imageCredit`: who made the banner photo and its licence, shown under the banner. */
  imageCredit?: string;
  /** Frontmatter `imageCreditUrl`: the photo's source page, linked from the credit. */
  imageCreditUrl?: string;
}

export interface BlogPost extends BlogPostSummary {
  content: string;
}
