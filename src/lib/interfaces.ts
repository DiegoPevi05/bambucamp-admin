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

export interface UserFormData {
  firstName: string;
  lastName: string;
  password?: string;
  email: string;
  role: string;
  phoneNumber:string;
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
  existing_images?:string;
}

export interface ProductCategory {
  id:number;
  name: string;
  createdAt:Date|null;
  updatedAt:Date|null;
}

export interface Product {
  id: number;
  categoryId:number;
  category:ProductCategory;
  name: string;
  description: string;
  price: number;
  images: string[];
  stock: number;
  custom_price:CustomPrice[];
  status:string;
  createdAt:Date|null;
  updatedAt:Date|null;
}

export interface ProductFilters {
  name?: string;
  status?:string;
}


export interface ProductFormData {
  categoryId:number;
  name: string;
  description: string;
  images: File[];
  price: number;
  stock:number;
  custom_price:string;
  status:string;
  existing_images?:string;
}


export interface ExperienceCategory {
  id:number;
  name: string;
  createdAt:Date|null;
  updatedAt:Date|null;
}

export interface Experience {
  id: number;
  categoryId:number;
  category:ExperienceCategory;
  header:string;
  name: string;
  description: string;
  price: number;
  duration: number;
  images: string[];
  status:string;
  limit_age:number;
  qtypeople:number;
  suggestions:string[];
  custom_price:CustomPrice[];
  createdAt:Date|null;
  updatedAt:Date|null;
}

export interface ExperienceFilters {
  name?: string;
  status?:string;
}


export interface ExperienceFormData {
  categoryId:number;
  header:string;
  name: string;
  description: string;
  images: File[];
  price: number;
  duration:number;
  limit_age:number;
  qtypeople:number;
  suggestions:string;
  custom_price:string;
  status:string;
  existing_images?:string;
}



export interface DiscountCode {
  id: number;
  code:string;
  discount:number;
  expiredDate: Date;
  stock:number;
  status:string;
  createdAt:Date|null;
  updatedAt:Date|null;
}

export interface DiscountCodeFilters {
  code?: string;
  status?:string;
}


export interface DiscountCodeFormData {
  code:string;
  discount:number;
  expiredDate: Date;
  stock:number;
  status:string;
}


export interface itemPromotion {
  id:number;
  label:string;
  qty:number;
  price:number;
}

export interface optionsPromotion {
  tents:Tent[];
  products:Product[];
  experiences:Experience[];
}

export interface Promotion {
  id: number;
  title:string;
  description:string;
  images:string[];
  expiredDate:Date;
  status:string;
  qtypeople:number;
  qtykids:number;
  netImport:number;
  discount:number;
  grossImport:number;
  stock:number;
  idtents:itemPromotion[];
  idproducts:itemPromotion[];
  idexperiences:itemPromotion[];
  createdAt:Date|null;
  updatedAt:Date|null;
}

export interface PromotionFilters {
  title?: string;
  status?:string;
}

export interface PromotionFormData {
  title:string;
  description:string;
  images:File[];
  expiredDate:Date;
  status:string;
  qtypeople:number;
  qtykids:number;
  netImport:number;
  discount:number;
  grossImport:number;
  stock:number;
  idtents:string;
  idproducts:string;
  idexperiences:string;
  existing_images?:string;
}

export interface optionsReserve {
  tents:Tent[];
  products:Product[];
  experiences:Experience[];
  promotions:Promotion[];
  discounts:DiscountCode[];
}

export interface ReserveTentDto {
  idTent:number;
  name:string;
  price:number;
  quantity:number;
  tentDB?:Tent;
}

export interface ReserveProductDto {
  idProduct:number;
  name:string;
  price:number;
  quantity:number;
  productDB?:Product;
}

export interface ReserveExperienceDto {
  idExperience:number;
  name:string;
  price:number;
  quantity:number;
  experienceDB?:Experience;
}

export interface Reserve {
  id: number;
  qtypeople:number;
  qtykids:number;
  userId:number;
  tents:ReserveTentDto[];
  products:ReserveProductDto[];
  experiences:ReserveExperienceDto[];
  dateFrom:Date;
  dateTo:Date;
  dateSale: Date;
  promotionId: number;
  price_is_calculated: boolean;
  discountCodeId: number;
  netImport: number;
  discount: number;
  grossImport: number;
  canceled_reason: string;
  canceled_status: boolean;
  paymentStatus: string;
  aditionalPeople: number;
  createdAt:Date|null;
  updatedAt:Date|null;
}

export interface ReserveFilters {
  dateFrom?: string;
  dateTo?:string;
  paymentStatus?:string;
}


export interface ReserveFormData {
  qtypeople:number;
  qtykids:number;
  userId:number;
  tents:ReserveTentDto[];
  products:ReserveProductDto[];
  experiences:ReserveExperienceDto[];
  dateFrom:Date;
  dateTo:Date;
  dateSale: Date;
  promotionId: number;
  price_is_calculated: boolean;
  discountCodeId: number;
  netImport: number;
  discount: number;
  grossImport: number;
  canceled_reason: string;
  canceled_status: boolean;
  paymentStatus: string;
  aditionalPeople: number;
}

export interface NotificationIT {
  id: number;
  type : string;
  title:string;
  preview:string;
  description:string;
  date:string;
}
