export interface User {
  token: string;
  id:number;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string; // Add role or other attributes as needed
  phoneNumber?: string;
}

export interface ReserveIT{
  id: number;
  checkin: Date;
  checkout: Date;
  status: string;
  total: number;
  tents: TentIT[];
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

export interface TentIT {
  id: number;
  header: string;
  title: string;
  description: string;
  images: string[];
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
