export interface User {
  token: string;
  id:number;
  firstName?: string;
  lastName?: string;
  password?:string;
  email?: string;
  role?: string; // Add role or other attributes as needed
  phoneNumber?: string;
  isDisabled?:boolean;
  lastLogin?:Date|null;
  lastPasswordChanged?:Date|null;
  emailVerified?:boolean;
  createdAt?:Date|null;
  updatedAt?:Date|null;
}

export interface UserFilters {
  firstName?: string;
  lastName?:string;
  email?: string;
  role?: string;
}

export interface ImageInterface {
  url: string;
  file: File;
}

export interface CustomPrice {
  dateFrom: Date;
  dateTo: Date;
  price: number;
}

export interface Tent {
  id: number;
  header: string;
  title: string;
  description: string;
  images: string[];
  qtypeople:number;
  qtykids:number;
  price: number;
  services: {
    wifi: boolean;
    parking: boolean;
    pool: boolean;
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    spa: boolean;
    bar: boolean;
    hotwater: boolean;
    airconditioning: boolean;
    grill: boolean;
  }
  custom_price:CustomPrice[];
  status:string;
  createdAt:Date|null;
  updatedAt:Date|null;
}

export interface TentFilters {
  title?: string;
  status?:string;
}

export interface TentFormData {
  title: string;
  description: string;
  header: string;
  images: File[];
  services:string;
  qtypeople:number;
  qtykids:number;
  price: number;
  custom_price:string;
  status:string;
}

export interface ReserveIT{
  id: number;
  checkin: Date;
  checkout: Date;
  status: string;
  total: number;
  tents: Tent[];
  experiences: ExperienceIT[];
  products: ProductIT[];
}

export interface PromotionIT {
  id: number;
  title: string;
  description: string;
  image: string;
  link: string;
  discount: number;
  remaining: number;
}



export interface ExperienceIT {
  id: number;
  title: string;
  description: string;
  duration: number;
  price: number;
  images: string[];
  limitAge: number;
  qtyPeople: number;
  sugestions: string[];
  quantity?: number;
  date?: Date;
}

export interface ProductIT {
  id: number;
  title: string;
  description: string;
  price: number;
  images: string[];
  quantity?: number;
}

export interface ReviewIT {
  id: number;
  name: string;
  title: string;
  review: string;
  stars: number;
  date: string;
  images: string[];
  profile_image: string;
}

export interface NotificationIT {
  id: number;
  type : string;
  title:string;
  preview:string;
  description:string;
  date:string;
}
