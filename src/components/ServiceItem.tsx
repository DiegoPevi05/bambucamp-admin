import * as LucideIcons from 'lucide-react';

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

interface ServiceItemProps {
  icon: string;
  size?:string;
}

const ServiceItem = ({icon,size}:ServiceItemProps) => {

  const iconName = serviceIconMap[icon];
  const label = icon.charAt(0).toUpperCase() + icon.slice(1);
  // @ts-ignore: Ignore TypeScript checking for IconComponent
  const IconComponent = LucideIcons[iconName];

  return(
    <li className= {`${size == "sm" ? 'text-[12px] gap-x-1' : 'text-[10px] sm:text-[14px] 2xl:text-lg gap-x-2' } text-white font-secondary flex flex-row ` }>
      {/* @ts-ignore: Ignore TypeScript checking for IconComponent */}
      <IconComponent className={`${size == "sm" ? 'h-5 h-5' : 'w-4 sm:w-5 lg:w-6 h-4 sm:h-5 lg:h-6' } text-white` } />
      {label}
    </li>
  )
}

export default ServiceItem;
