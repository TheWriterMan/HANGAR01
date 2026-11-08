import { GraduationCap, Info, Plane } from 'lucide-react';
import type { FC } from 'react';
import type { NavigationIcon as NavigationIconName } from './menuData';

interface NavigationIconProps {
  name: NavigationIconName;
  size?: 12 | 14 | 16;
}

const NavigationIcon: FC<NavigationIconProps> = ({ name, size = 14 }) => {
  if (name === 'aircraft') return <Plane size={size} aria-hidden="true" />;
  if (name === 'flight-school') return <GraduationCap size={size} aria-hidden="true" />;
  return <Info size={size} aria-hidden="true" />;
};

export default NavigationIcon;
