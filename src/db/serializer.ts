import { User, Tent, Product, TentFormData, ProductFormData } from "../lib/interfaces"
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

export const serializeTent = (data:any):Tent|null => {
  let tent:Tent|null = null;

  const transformedCustomPrice = data.custom_price ? JSON.parse(data.custom_price).map((item:any) => ({  ...item, dateFrom: convertStrToCurrentTimezoneDate(item.dateFrom), dateTo: convertStrToCurrentTimezoneDate(item.dateTo) 
})) : [];

  tent = {
    id: data.id,
    header: data.header,
    title:data.title,
    description: data.description,
    images: data.images ? data.images.map((image:string) => image.replace(/\\/g, '/')) : [],
    qtypeople: data.qtypeople || 0,
    qtykids: data.qtykids || 0,
    price: data.price || 0,
    services: data.services ? JSON.parse(data.services) : {},
    custom_price: transformedCustomPrice,
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

  product = {
    id: data.id,
    title:data.title,
    description: data.description,
    images: data.images ? data.images.map((image:string) => image.replace(/\\/g, '/')) : [],
    price: data.price || 0,
    quantity:data.quantity || 0,
    createdAt:data.createdAt ? convertStrToCurrentTimezoneDate(data.createdAt) : data.createdAt,
    updatedAt:data.updatedAt ? convertStrToCurrentTimezoneDate(data.updatedAt) : data.updatedAt
  };
  return product;
}


export const serializeProductToDB = (product: ProductFormData, isEditable?:boolean) => {

    // Create a new FormData object
    const formData = new FormData();

    // Append basic fields
    formData.append('title', product.title);
    formData.append('description', product.description);
    formData.append('quantity', product.quantity.toString());
    formData.append('price', product.price.toString());

    if(isEditable && product.existing_images){
      formData.append('existing_images',product.existing_images)
    }

    // Append images
    product.images.forEach((image) => {
      formData.append('images', image);  // Ensure each image is appended with the correct key
    });

    return formData;
}

