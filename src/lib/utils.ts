import {ClassValue,clsx} from 'clsx'
import { twMerge } from 'tailwind-merge'
import {ReserveIT, ImageInterface} from './interfaces'
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



