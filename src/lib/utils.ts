import {ClassValue,clsx} from 'clsx'
import { twMerge } from 'tailwind-merge'
import {Reserve, ImageInterface, ReserveTentDto, CustomPrice, optTentPromotionDto, optProductPromotionDto, optExperiencePromotionDto} from './interfaces'

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

export const formatPrice = (price: number) => {
  return price.toLocaleString("es-PE", { style: "currency", currency: "PEN" });
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
    if(key == "wifi") return "glamping.wi_fi"
    if(key == "parking") return "glamping.parking"
    if(key == "pool") return "glamping.pool"
    if(key == "breakfast") return "glamping.breakfast"
    if(key == "lunch" ) return "glamping.lunch"
    if(key == "dinner") return "glamping.dinner"
    if(key == "spa") return "glamping.spa"
    if(key == "bar") return "glamping.bar"
    if(key == "hotwater") return "glamping.hotwater"
    if(key == "airconditioning") return "glamping.air_conditioner"
    if(key == "grill") return "glamping.grill"
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

export const parseSuggestions = (suggestions: string[]): string => {
  if (suggestions.length === 0) {
    return "No Suggestions";
  }
  return suggestions.join('; ');
};

export const getReserveDates = (tents: ReserveTentDto[]): { dateFrom: Date; dateTo: Date } => {
  // Initialize the earliest start date and latest end date
  let earliestDateFrom: Date | null = null;
  let latestDateTo: Date | null = null;

  // Iterate through each tent
  tents.forEach((tent) => {

    if (earliestDateFrom === null || tent.dateFrom < earliestDateFrom) {
      earliestDateFrom = tent.dateFrom;
    }
    if (latestDateTo === null || tent.dateTo > latestDateTo) {
      latestDateTo = tent.dateTo;
    }
  });

  // Handle case where no tents are provided
  if (earliestDateFrom === null || latestDateTo === null) {
    return { dateFrom: ( new Date() ), dateTo: ( new Date() ) }
  }

  return { dateFrom: earliestDateFrom, dateTo: latestDateTo };
};


export const getRangeDatesForReserve = (reserve:Reserve) => {
    // Initialize an array to store the ranges of dates
    let dateRanges: { date: Date; label: string }[] = [];

    // Loop through each tent in the cart
    reserve.tents.forEach((dateItem) => {
      // Initialize the current date to tent's dateFrom
      let currentDate = new Date(dateItem.dateFrom);

      // Loop through the dates from dateFrom to dateTo for each tent
      while (currentDate <= dateItem.dateTo) {
        const formattedDate = currentDate.toISOString().split('T')[0]; // Format date as YYYY-MM-DD

        // Check if the date is already in the dateRanges array to avoid overlap
        const dateExists = dateRanges.some((range) => range.label === formattedDate);

        if (!dateExists) {
          dateRanges.push({
            date: new Date(currentDate),
            label: formattedDate,
          });
        }

        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    // Sort the dateRanges array by date to ensure the dates are in chronological order
    dateRanges = dateRanges.sort((a, b) => a.date.getTime() - b.date.getTime());

    return dateRanges;
};

export const getNumberOfNights = (dateFrom: Date, dateTo: Date): number => {
  // Calculate the time difference between the two dates in milliseconds
  const timeDifference = dateTo.getTime() - dateFrom.getTime();

  // Convert the time difference from milliseconds to days
  const numberOfDays = timeDifference / (1000 * 60 * 60 * 24);

  // Return the number of nights (days between the dates)
  return Math.ceil(numberOfDays);
};

export const formatDateToYYYYMMDD = (date: Date): string => {
  // Create a new Date object with the current time zone
  const localDate = new Date(date);

  // Get the year, month, and day from the localDate object
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(localDate.getDate()).padStart(2, '0');

  // Return the date in the desired format YYYYY-MM-DD
  return `${year}-${month}-${day}`;
}
