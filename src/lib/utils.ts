import {ClassValue,clsx} from 'clsx'
import { twMerge } from 'tailwind-merge'
import {Reserve, ImageInterface, ReserveTentDto, ReserveProductDto, ReserveExperienceDto, CustomPrice, optTentPromotionDto, optProductPromotionDto, optExperiencePromotionDto} from './interfaces'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatFullName = (firstName:string|undefined, lastName:string|undefined) => {
  let rtn_str = null;
  if(firstName != undefined && firstName.length > 0 )  rtn_str = firstName; 
  if(lastName != undefined && lastName.length > 0 ) rtn_str += ","+lastName;
  return rtn_str;
}

export const getTentsNames = (reserve:Reserve) => {
  if(reserve.tents.length === 0) return "N/A";
  return reserve.tents.map((tent) => tent.name).join(", ");
}

export const getProductsNames = (reserve:Reserve) => {
  if(reserve.products.length === 0) return "N/A";
  return reserve.products.map((product) => product.name).join(", ");
}

export const getExperiencesNames = (reserve:Reserve) => {
  if(reserve.experiences.length === 0) return "N/A";
  return reserve.experiences.map((experience) => experience.name).join(", ");
}

export const formatPrice = (price:number) => {
  return price.toLocaleString("en-US", {style: "currency", currency: "USD"});
};

export const formatDate = (date:Date) => {
  //format with time 
  return new Intl.DateTimeFormat("en-US", {dateStyle: "medium", timeStyle: "short"}).format(date);
}

export const formatToISODate = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-indexed
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export const convertStrToCurrentTimezoneDate = (utcDateString: string): Date => {
  const date = new Date(utcDateString);
  const localOffset = date.getTimezoneOffset(); // getTimezoneOffset() returns the difference in minutes
  return new Date(date.getTime() + localOffset);
};

export const getLabelService = (key:string) => {
    if(key == "wifi") return "Wi-Fi"
    if(key == "parking") return "Estacionamiento"
    if(key == "pool") return "Piscina"
    if(key == "breakfast") return "Desayuno"
    if(key == "lunch" ) return "Almuerzo"
    if(key == "dinner") return "Cena"
    if(key == "spa") return "Spa"
    if(key == "bar") return "Bar"
    if(key == "hotwater") return "Agua Caliente"
    if(key == "airconditioning") return "Aire acondicionado"
    if(key == "grill") return "Parrilla"
    return key;
}

export const createImagesArray = (files:File[]) => {
    const newImages: ImageInterface[] = files.map(file => ({
      url: URL.createObjectURL(file),
      file
    }));
    return newImages;
}

export const getTotalPromotionCalculated = (tents: optTentPromotionDto[], products: optProductPromotionDto[], experiences: optExperiencePromotionDto[]): number => {
  let total = 0;

  // Sum prices for tents
  if (tents && tents.length > 0) {
    total += tents.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  }

  // Sum prices for products
  if (products && products.length > 0) {
    total += products.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  }

  // Sum prices for experiences
  if (experiences && experiences.length > 0) {
    total += experiences.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  }

  return total;
}

export const getTotalReserveCalculated = (tents: ReserveTentDto[], products: ReserveProductDto[], experiences: ReserveExperienceDto[]): number => {
  let total = 0;

  // Sum prices for tents
  if (tents && tents.length > 0) {
    total += tents.reduce((sum, item) => sum + (item.nights * item.price), 0);
  }

  // Sum prices for products
  if (products && products.length > 0) {
    total += products.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  }

  // Sum prices for experiences
  if (experiences && experiences.length > 0) {
    total += experiences.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  }

  return total;
}

export const calculatePrice = (basePrice: number , customPrices: CustomPrice[], noCustomPrice?:boolean): number => {

  if(customPrices === null) return basePrice;

  if(noCustomPrice) return basePrice;

  const currentCustomPrice = getCurrentCustomPrice(customPrices);

  return currentCustomPrice > 0 ? currentCustomPrice : basePrice;
};

export const getCurrentCustomPrice = (customPrices: CustomPrice[]): number => {


  const currentDate = new Date();
  
  const matchingPrices = customPrices.filter(customPrice => currentDate >= customPrice.dateFrom && currentDate <= customPrice.dateTo);

  if (matchingPrices.length === 0) {
    return 0;
  }
  matchingPrices.sort((a, b) => b.dateTo.getTime() - a.dateTo.getTime());
  
  return matchingPrices[0].price;
}

export const capitalizeNames = (names:string) => {
  return names
    .split(' ')
    .map(name => name.charAt(0).toUpperCase() + name.slice(1).toLowerCase())
    .join(' ');
}

export const getInitials = (names:string) => {
  const nameArray = names.split(' ');
  const firstInitial = nameArray[0].charAt(0).toUpperCase();
  const lastInitial = nameArray[nameArray.length - 1].charAt(0).toUpperCase();
  return firstInitial + lastInitial;
}
