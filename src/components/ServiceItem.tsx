import * as LucideIcons from 'lucide-react';
import { useTranslation } from 'react-i18next';

const serviceIconMap: Record<string, keyof typeof LucideIcons> = {
  wifi: 'Wifi',
  parking: 'Car',
  pool: 'Waves',
  breakfast: 'Croissant',
  lunch: 'Sandwich',
  dinner: 'Utensils',
  spa: 'Sparkles',
  bar: 'Martini',
  hotwater: 'Bath',
  airconditioning: 'AirVent',
  grill: 'Beef',
};

const serviceLabelMap: Record<string, string> = {
  wifi: 'glamping.wi_fi',
  parking: 'glamping.parking',
  pool: 'glamping.pool',
  breakfast: 'glamping.breakfast',
  lunch: 'glamping.lunch',
  dinner: 'glamping.dinner',
  spa: 'glamping.spa',
  bar: 'glamping.bar',
  hotwater: 'glamping.hotwater',
  airconditioning: 'glamping.air_conditioner',
  grill: 'glamping.grill',
};

interface ServiceItemProps {
  icon: string;
  size?:string;
  color?:string;
}

const ServiceItem = ({icon,size,color}:ServiceItemProps) => {
  const { t } = useTranslation();

  const iconName = serviceIconMap[icon];
  const label = t(serviceLabelMap[icon]);
  // @ts-ignore: Ignore TypeScript checking for IconComponent
  const IconComponent = LucideIcons[iconName];

  return(
    <li className= {`${size == "sm" ? 'text-[12px] gap-x-1' : 'text-[10px] sm:text-[14px] 2xl:text-lg gap-x-2' } ${color ?? "text-white"} font-secondary flex flex-row ` }>
      {/* @ts-ignore: Ignore TypeScript checking for IconComponent */}
      <IconComponent className={`${size == "sm" ? 'h-5 h-5' : 'w-4 sm:w-5 lg:w-6 h-4 sm:h-5 lg:h-6' } ${color ?? "text-white"}` } />
      {label}
    </li>
  )
}

export default ServiceItem;
