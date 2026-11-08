import { aircraftImageSrcSet, aircraftImageUrl } from '../../../utils/images';

export type NavigationIcon = 'aircraft' | 'flight-school' | 'about';

export interface NavigationItem {
  label: string;
  description: string;
  to: string;
  image: string;
  /** 640 and 1280 px versions, so the desktop menu's 354 px cards stay sharp on 2x screens. */
  imageSrcSet?: string;
  comingSoon?: boolean;
}

export interface NavigationFeature {
  title: string;
  description: string;
  image?: string;
  to?: string;
}

export interface NavigationCategory {
  id: string;
  label: string;
  icon: NavigationIcon;
  items: NavigationItem[];
  featured?: NavigationFeature;
}

export const navigationCategories: NavigationCategory[] = [
  {
    id: 'aircraft',
    label: 'Aircraft',
    icon: 'aircraft',
    items: [
      {
        label: 'General Aviation',
        description: 'Cessna, Diamond, Cirrus, Beechcraft and more',
        to: '/aircraft?category=ga',
        image: aircraftImageUrl('c172', 'small'),
        imageSrcSet: aircraftImageSrcSet('c172'),
      },
      {
        label: 'Airliners',
        description: 'Boeing, Airbus, ATR — study-level procedures',
        to: '/aircraft?category=airliner',
        image: aircraftImageUrl('b737', 'small'),
        imageSrcSet: aircraftImageSrcSet('b737'),
      },
      {
        label: 'Business Jets',
        description: 'Fast, precise procedures for modern executive aircraft',
        to: '/aircraft?category=business-jet',
        image: aircraftImageUrl('cj4', 'small'),
        imageSrcSet: aircraftImageSrcSet('cj4'),
      },
      {
        label: 'Military',
        description: 'Transport and fighter procedures, from cold and dark to shutdown',
        to: '/aircraft?category=military',
        image: aircraftImageUrl('c130', 'small'),
        imageSrcSet: aircraftImageSrcSet('c130'),
      },
    ],
  },
  {
    id: 'flight-school',
    label: 'Flight School',
    icon: 'flight-school',
    items: [
      {
        label: 'Emergency Checklists',
        description: 'Engine failure, fire, and rapid decompression',
        to: '/flight-school/emergency',
        image: aircraftImageUrl('a320', 'small'),
        imageSrcSet: aircraftImageSrcSet('a320'),
        comingSoon: true,
      },
    ],
    featured: {
      title: 'Coming Soon',
      description: 'Structured training modules for sim pilots, from first flight to type ratings.',
    },
  },
  {
    id: 'about',
    label: 'About',
    icon: 'about',
    items: [
      {
        label: 'About HANGAR01',
        description: 'Who makes it and how corrections work',
        to: '/about',
        image: aircraftImageUrl('c172', 'small'),
        imageSrcSet: aircraftImageSrcSet('c172'),
      },
      {
        label: 'News',
        description: 'Platform updates and aviation content',
        to: '/news',
        image: aircraftImageUrl('b777', 'small'),
        imageSrcSet: aircraftImageSrcSet('b777'),
      },
      {
        label: 'Changelog',
        description: 'Every update, documented',
        to: '/changelog',
        image: aircraftImageUrl('cj4', 'small'),
        imageSrcSet: aircraftImageSrcSet('cj4'),
      },
    ],
  },
];
