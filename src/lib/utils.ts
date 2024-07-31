import {ClassValue,clsx} from 'clsx'
import { twMerge } from 'tailwind-merge'
import {ReserveIT} from './interfaces'
import { TentSchema } from '../db/schemas'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatFullName = (firstName:string|undefined, lastName:string|undefined) => {
  let rtn_str = null;
  if(firstName != undefined && firstName.length > 0 )  rtn_str = firstName; 
  if(lastName != undefined && lastName.length > 0 ) rtn_str += ","+lastName;
  return rtn_str;
}

export const getTentsNames = (reserve:ReserveIT) => {
  if(reserve.tents.length === 0) return "N/A";
  return reserve.tents.map((tent) => tent.title).join(", ");
}

export const getProductsNames = (reserve:ReserveIT) => {
  if(reserve.products.length === 0) return "N/A";
  return reserve.products.map((product) => product.title).join(", ");
}

export const getExperiencesNames = (reserve:ReserveIT) => {
  if(reserve.experiences.length === 0) return "N/A";
  return reserve.experiences.map((experience) => experience.title).join(", ");
}

export const formatPrice = (price:number) => {
  return price.toLocaleString("en-US", {style: "currency", currency: "USD"});
};

export const formatDate = (date:Date) => {
  //format with time 
  return new Intl.DateTimeFormat("en-US", {dateStyle: "medium", timeStyle: "short"}).format(date);
}

export const convertStrToCurrentTimezoneDate = (utcDateString: string): Date => {
  const date = new Date(utcDateString);
  const localOffset = date.getTimezoneOffset(); // getTimezoneOffset() returns the difference in minutes
  return new Date(date.getTime() + localOffset);
};

type Services = typeof TentSchema._type.services;

export const formatServices = (services: Services): string => {
  const serviceEntries = Object.entries(services);

  const serviceItems = serviceEntries.map(([key, value]) => {
    if (value) {
      return `<li>${key}</li>`;
    }
    return '';
  }).filter(item => item !== '');

  return `<ul>${serviceItems.join('')}</ul>`;
};


