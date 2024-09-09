import { User, Tent, Product, TentFormData, ProductFormData, ProductCategory, ExperienceCategory, Experience, ExperienceFormData, DiscountCode, Promotion,PromotionFormData, optionsPromotion, optionsReserve, Reserve, NotificationDto, Faq, Review } from "../lib/interfaces"
import { convertStrToCurrentTimezoneDate } from "../lib/utils";

export const serializeUser = (data:any):User|null => {
  let user:User | null = null;

  user = {
    id: data.id,
    email: data.email,
    firstName: data.firstName,
    lastName:data.lastName,
    role: data.role,
    phoneNumber: data.phoneNumber,
    token: data.token || "",
    isDisabled:data.isDisabled,
    lastLogin: data.lastLogin ? convertStrToCurrentTimezoneDate(data.lastLogin) : data.lastLogin,
    lastPasswordChanged: data.lastPasswordChanged ? convertStrToCurrentTimezoneDate(data.lastPasswordChanged) : data.lastPasswordChanged,
    emailVerified:data.emailVerified,
    createdAt:data.createdAt ? convertStrToCurrentTimezoneDate(data.createdAt) : data.createdAt,
    updatedAt:data.updatedAt ? convertStrToCurrentTimezoneDate(data.updatedAt) : data.updatedAt
  };

  return user;

}

const formatImagePaths = (images: string[]): string[] => {
  return images.map(image => 
    image.replace(/\\/g, '/')
  );
};

export const serializeTent = (data:any):Tent|null => {
  let tent:Tent|null = null;

  const transformedCustomPrice = data.custom_price ? JSON.parse(data.custom_price).map((item:any) => ({  ...item, dateFrom: convertStrToCurrentTimezoneDate(item.dateFrom), dateTo: convertStrToCurrentTimezoneDate(item.dateTo) 
})) : [];

  tent = {
    id: data.id,
    header: data.header,
    title:data.title,
    description: data.description,
    images: formatImagePaths(data.images || []),
    qtypeople: data.qtypeople || 0,
    qtykids: data.qtykids || 0,
    price: data.price || 0,
    services: data.services ? JSON.parse(data.services) : {},
    custom_price: transformedCustomPrice,
    aditional_people_price: data.aditional_people_price,
    max_aditional_people:data.max_aditional_people,
    status : data.status,
    createdAt:data.createdAt ? convertStrToCurrentTimezoneDate(data.createdAt) : data.createdAt,
    updatedAt:data.updatedAt ? convertStrToCurrentTimezoneDate(data.updatedAt) : data.updatedAt
  };

  return tent;
}

export const serializeTentToDB = (tent: TentFormData, isEditable?:boolean) => {

    // Create a new FormData object
    const formData = new FormData();

    // Append basic fields
    formData.append('title', tent.title);
    formData.append('description', tent.description);
    formData.append('header', tent.header);
    formData.append('qtypeople', tent.qtypeople.toString());
    formData.append('qtykids', tent.qtykids.toString());
    formData.append('aditional_people_price', tent.aditional_people_price.toString());
    formData.append('max_aditional_people', tent.max_aditional_people.toString());
    formData.append('price', tent.price.toString());
    formData.append('status', tent.status);

    // Append custom prices as a JSON string
    formData.append('custom_price', tent.custom_price);

    if(isEditable && tent.existing_images){
      formData.append('existing_images',tent.existing_images)
    }

    // Append images
    tent.images.forEach((image) => {
      formData.append('images', image);  // Ensure each image is appended with the correct key
    });

    // Append services as a JSON string
    formData.append('services', tent.services);

    return formData;
}

export const serializeProduct = (data:any):Product|null => {
  let product:Product|null = null;

  const transformedCustomPrice = data.custom_price ? JSON.parse(data.custom_price).map((item:any) => ({  ...item, dateFrom: convertStrToCurrentTimezoneDate(item.dateFrom), dateTo: convertStrToCurrentTimezoneDate(item.dateTo) 
})) : [];

  product = {
    categoryId:data.categoryId,
    category:data.category,
    id: data.id,
    name:data.name,
    description: data.description,
    images: data.images ? data.images.map((image:string) => image.replace(/\\/g, '/')) : [],
    price: data.price || 0,
    stock:data.stock || 0,
    custom_price: transformedCustomPrice,
    status : data.status,
    createdAt:data.createdAt ? convertStrToCurrentTimezoneDate(data.createdAt) : data.createdAt,
    updatedAt:data.updatedAt ? convertStrToCurrentTimezoneDate(data.updatedAt) : data.updatedAt
  };
  return product;
}


export const serializeProductToDB = (product: ProductFormData, isEditable?:boolean) => {

    // Create a new FormData object
    const formData = new FormData();

    // Append basic fields
    formData.append('categoryId', product.categoryId.toString());
    formData.append('name', product.name);
    formData.append('description', product.description);
    formData.append('stock', product.stock.toString());
    formData.append('price', product.price.toString());

    formData.append('status', product.status);

    // Append custom prices as a JSON string
    formData.append('custom_price', product.custom_price);

    if(isEditable && product.existing_images){
      formData.append('existing_images',product.existing_images)
    }

    // Append images
    product.images.forEach((image) => {
      formData.append('images', image);  // Ensure each image is appended with the correct key
    });

    return formData;
}


export const serializeCategoryProduct = (data:any):ProductCategory|null => {
  let ProductCategory:ProductCategory|null = null;

  ProductCategory = {
    id: data.id,
    name:data.name,
    createdAt:data.createdAt ? convertStrToCurrentTimezoneDate(data.createdAt) : data.createdAt,
    updatedAt:data.updatedAt ? convertStrToCurrentTimezoneDate(data.updatedAt) : data.updatedAt
  };

  return ProductCategory;
}

export const serializeCategoryExperience = (data:any):ExperienceCategory|null => {
  let ExperienceCategory:ExperienceCategory|null = null;

  ExperienceCategory = {
    id: data.id,
    name:data.name,
    createdAt:data.createdAt ? convertStrToCurrentTimezoneDate(data.createdAt) : data.createdAt,
    updatedAt:data.updatedAt ? convertStrToCurrentTimezoneDate(data.updatedAt) : data.updatedAt
  };

  return ExperienceCategory;
}

export const serializeExperience = (data:any):Experience|null => {
  let experience:Experience|null = null;

  const transformedCustomPrice = data.custom_price ? JSON.parse(data.custom_price).map((item:any) => ({  ...item, dateFrom: convertStrToCurrentTimezoneDate(item.dateFrom), dateTo: convertStrToCurrentTimezoneDate(item.dateTo) 
})) : [];

  experience = {
    categoryId:data.categoryId,
    category:data.category,
    id: data.id,
    header:data.header,
    name:data.name,
    description: data.description,
    images: data.images ? data.images.map((image:string) => image.replace(/\\/g, '/')) : [],
    price: data.price || 0,
    duration:data.duration || 0,
    qtypeople:data.qtypeople || 0,
    limit_age:data.limit_age || 0,
    suggestions: data.suggestions ? JSON.parse(data.suggestions) : [],
    custom_price: transformedCustomPrice,
    status : data.status,
    createdAt:data.createdAt ? convertStrToCurrentTimezoneDate(data.createdAt) : data.createdAt,
    updatedAt:data.updatedAt ? convertStrToCurrentTimezoneDate(data.updatedAt) : data.updatedAt
  };
  return experience;
}


export const serializeExperienceToDB = (experience: ExperienceFormData, isEditable?:boolean) => {

    // Create a new FormData object
    const formData = new FormData();

    // Append basic fields
    formData.append('categoryId', experience.categoryId.toString());
    formData.append('header',experience.header);
    formData.append('name', experience.name);
    formData.append('description', experience.description);
    formData.append('price', experience.price.toString());
    formData.append('duration', experience.duration.toString());
    formData.append('qtypeople', experience.qtypeople.toString());
    formData.append('limit_age', experience.limit_age.toString());
    formData.append('suggestions', experience.suggestions);

    formData.append('status', experience.status);

    // Append custom prices as a JSON string
    formData.append('custom_price', experience.custom_price);

    if(isEditable && experience.existing_images){
      formData.append('existing_images',experience.existing_images)
    }

    // Append images
    experience.images.forEach((image) => {
      formData.append('images', image);  // Ensure each image is appended with the correct key
    });

    return formData;
}

export const serializeDiscountCode = (data:any):DiscountCode|null => {
  let discuntCode:DiscountCode|null = null;

  discuntCode = {
    id: data.id,
    code:data.code,
    discount: data.discount || 0,
    expiredDate: data.expiredDate ? convertStrToCurrentTimezoneDate(data.expiredDate) : data.expiredDate,
    stock: data.stock || 0,
    status: data.status,
    createdAt:data.createdAt ? convertStrToCurrentTimezoneDate(data.createdAt) : data.createdAt,
    updatedAt:data.updatedAt ? convertStrToCurrentTimezoneDate(data.updatedAt) : data.updatedAt
  };
  return discuntCode;
}

export const serializePromotionOptions = (data:any):optionsPromotion|null => {
  let options:optionsPromotion|null = null;

  const transformedTents = data.tents ? data.tents.map((item:any) => ( serializeTent(item) )) : [];

  const transformedProducts = data.products ? data.products.map((item:any) => ( serializeProduct(item) )) : [];

  const transformedExperiences = data.experiences ? data.experiences.map((item:any) => ( serializeExperience(item) )) : [];

  options = {
    tents: transformedTents,
    products:transformedProducts,
    experiences: transformedExperiences
  }

  return options;
}

export const serializePromotion = (data:any):Promotion|null => {
  let promotion:Promotion|null = null;

  promotion = {
    id: data.id,
    title:data.title,
    description: data.description,
    images: data.images ? data.images.map((image:string) => image.replace(/\\/g, '/')) : [],
    expiredDate: data.expiredDate ? convertStrToCurrentTimezoneDate(data.expiredDate) : data.expiredDate,
    status : data.status,
    qtypeople: data.qtypeople || 0,
    qtykids: data.qtykids || 0,
    netImport: data.netImport || 0,
    discount: data.discount || 0,
    grossImport: data.grossImport || 0,
    stock: data.stock || 0,
    tents: data.tents,
    products: data.products,
    experiences: data.experiences,
    createdAt:data.createdAt ? convertStrToCurrentTimezoneDate(data.createdAt) : data.createdAt,
    updatedAt:data.updatedAt ? convertStrToCurrentTimezoneDate(data.updatedAt) : data.updatedAt
  };


  return promotion;
}


export const serializePromotionToDB = (promotion: PromotionFormData, isEditable?:boolean) => {

    // Create a new FormData object
    const formData = new FormData();

    // Append basic fields
    formData.append('title',promotion.title);
    formData.append('description', promotion.description);
    formData.append('expiredDate', promotion.expiredDate.toString());
    formData.append('status', promotion.status);
    formData.append('qtypeople', promotion.qtypeople.toString());
    formData.append('qtykids', promotion.qtykids.toString());
    formData.append('netImport', promotion.netImport.toString());
    formData.append('discount', promotion.discount.toString());
    formData.append('grossImport', promotion.grossImport.toString());
    formData.append('stock', promotion.stock.toString());
    formData.append('tents', promotion.tents);
    formData.append('products', promotion.products);
    formData.append('experiences', promotion.experiences);

    if(isEditable && promotion.existing_images){
      formData.append('existing_images',promotion.existing_images)
    }

    // Append images
    promotion.images.forEach((image) => {
      formData.append('images', image);  // Ensure each image is appended with the correct key
    });

    return formData;
}

export const serializeReserveOptions = (data:any):optionsReserve|null => {
  let options:optionsReserve|null = null;

  const transformedTents = data.tents ? data.tents.map((item:any) => ( serializeTent(item) )) : [];

  const transformedProducts = data.products ? data.products.map((item:any) => ( serializeProduct(item) )) : [];

  const transformedExperiences = data.experiences ? data.experiences.map((item:any) => ( serializeExperience(item) )) : [];

  const transformedPromotions = data.promotions ? data.promotions.map((item:any) => ( serializePromotion(item) )) : [];

  const transformedDiscounts = data.discounts ? data.discounts.map((item:any) => (serializeDiscountCode(item) )) : [];

  options = {
    tents: transformedTents,
    products:transformedProducts,
    experiences: transformedExperiences,
    promotions: transformedPromotions, 
    discounts: transformedDiscounts
  }

  return options;
}

export const serializeReserve = (data:any):Reserve|null => {
  let reserve:Reserve|null = null;

  reserve = {
    id: data.id,
    qtypeople:data.title,
    qtykids:data.qtykids,
    userId:data.userId,
    dateSale:data.dateSale ? convertStrToCurrentTimezoneDate(data.dateSale) : data.dateSale,
    price_is_calculated : data.price_is_calculated,
    discount_code_id:data.discount_code_id || 0,
    discount_code_name:data.discount_code_name || 0,
    net_import: data.net_import || 0,
    discount: data.discount || 0,
    gross_import: data.gross_import || 0,
    tents: data.tents,
    products: data.products,
    experiences: data.experiences,
    promotions:data.promotions,
    canceled_reason:data.canceled_reason,
    canceled_status:data.canceled_status,
    payment_status:data.payment_status,
    reserve_status:data.reserve_status,
    createdAt:data.createdAt ? convertStrToCurrentTimezoneDate(data.createdAt) : data.createdAt,
    updatedAt:data.updatedAt ? convertStrToCurrentTimezoneDate(data.updatedAt) : data.updatedAt
  };
  return reserve;
}

export const serializeMyReserves = (data:any):Reserve|null => {
  let reserve = serializeReserve(data);

  reserve?.tents?.forEach((tent) => {
    if (tent?.tentDB) {
      const serialized = serializeTent(tent.tentDB);
      if (serialized != null) {
        tent.tentDB = serialized;
      }
    }
  });

  reserve?.experiences?.forEach((experience) => {
    if (experience?.experienceDB) {
      const serialized = serializeExperience(experience.experienceDB);
      if (serialized != null) {
        experience.experienceDB = serialized;
      }
    }
  });

  reserve?.products?.forEach((product) => {
    if (product?.productDB) {
      const serialized = serializeProduct(product.productDB);
      if (serialized != null) {
        product.productDB = serialized;
      }
    }
  });

  return reserve;
}

export const serializeMyReservesCalendar = (data:any):{ id:number, dateFrom:Date, dateTo:Date } |null => {

  let reserve:{ id:number, dateFrom:Date, dateTo:Date }|null = null;

  reserve = {
    id: data.id,
    dateFrom: data.dateFrom ? convertStrToCurrentTimezoneDate(data.dateFrom) : data.dateFrom,
    dateTo: data.dateTo ? convertStrToCurrentTimezoneDate(data.dateTo) : data.dateTo,
  };

  return reserve 
}

export const serializeNotification = (data:any): NotificationDto | null => {

  let notification:NotificationDto|null = null;

  notification = {
    id:data.id,
    title: data.title,
    preview: data.preview,
    description: data.description,
    type: data.type,
    date: data.date ? convertStrToCurrentTimezoneDate(data.date) : data.date,
    isRead: data.isRead
  }

  return notification;
}

export const serializeReview = (data:any): Review | null => {

  let review:Review|null = null;

  review = {
    id:data.id,
    name:data.name,
    title:data.title,
    review:data.review,
    stars:data.stars || 0,
    day:data.day ? convertStrToCurrentTimezoneDate(data.day) : data.day,
    href:data.href,
    profile_image_url:data.profile_image_url,
    createdAt:data.createdAt ? convertStrToCurrentTimezoneDate(data.createdAt) : data.createdAt,
    updatedAt:data.updatedAt ? convertStrToCurrentTimezoneDate(data.updatedAt) : data.updatedAt
  }

  return review;
}

export const serializeFaq = (data:any): Faq | null => {

  let faq:Faq|null = null;

  faq = {
    id:data.id,
    question:data.question,
    answer:data.answer,
    createdAt:data.createdAt ? convertStrToCurrentTimezoneDate(data.createdAt) : data.createdAt,
    updatedAt:data.updatedAt ? convertStrToCurrentTimezoneDate(data.updatedAt) : data.updatedAt
  }

  return faq;
}




