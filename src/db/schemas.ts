import { z } from 'zod';


const signInSchema = z.object({
  email: z.string().email({ message: "auth.validations.email_invalid" }),
  password: z.string().min(6, { message: "auth.validations.password_length" }),
});

const createUserSchema = z.object({
  firstName: z.string().nonempty({ message: 'user.validations.name_required' }),
  lastName: z.string().nonempty({ message: 'user.validations.lastname_required' }),
  phoneNumber: z.string().nonempty({ message: 'user.validations.cellphone_required' }),
  email: z.string().email({ message: 'user.validations.email_invalid' }),
  role: z.string().refine(
    (value) => value === 'SUPERVISOR' || value === 'CLIENT',
    { message: 'user.validations.rol_invalid' }
  ),
  password: z.string()
    .min(8, { message: 'user.validations.password_length' })
    .regex(/[a-zA-Z]/, { message: 'user.validations.password_letter' })
    .regex(/[0-9]/, { message: 'user.validations.password_number' })
    .regex(/[^a-zA-Z0-9]/, { message: 'user.validations.password_special' })
});

const editUserSchema = createUserSchema.omit({ password: true }).extend({
  password: z.string().optional()  // Password is optional for editing
});

const CustomPriceSchema = z.object({
  dateFrom: z.date(),
  dateTo: z.date(),
  price: z.number().positive({ message: 'common.validations.custom_price_price' })
});

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

const imageFileSchema = z.instanceof(File).refine((file) => {
  return allowedMimeTypes.includes(file.type) && file.size <= 2 * 1024 * 1024;
}, {
  message: 'common.validations.image_file',
});

const TentSchema = z.object({
  header: z.string().nonempty({ message: 'glamping.validations.header_required' }),
  title: z.string().nonempty({ message: 'glamping.validations.title_required' }),
  description: z.string().nonempty({ message: 'glamping.validations.description_required' }),
  existing_images: z.array(z.string()).default([]),
  images: z.array(imageFileSchema).default([]),
  qtypeople: z.number().min(1, { message: 'glamping.validations.qtypeople_min' }),
  qtykids: z.number().nonnegative({ message: 'glamping.validations.qtykids_positive' }),
  aditional_people_price:z.number(),
  max_aditional_people:z.number(),
  price: z.number().positive({ message: 'glamping.validations.price_positive' }),
  services: z.object({
    wifi: z.boolean(),
    parking: z.boolean(),
    pool: z.boolean(),
    breakfast: z.boolean(),
    lunch: z.boolean(),
    dinner: z.boolean(),
    spa: z.boolean(),
    bar: z.boolean(),
    hotwater: z.boolean(),
    airconditioning: z.boolean(),
    grill: z.boolean()
  }),
  custom_price: z.array(CustomPriceSchema),
  status: z.string().nonempty({ message: 'glamping.validations.status_required' }),
}).refine(data => data.existing_images.length > 0 || data.images.length > 0, {
  message: 'glamping.validations.images_min',
  path: ['images'] // This can be any path to indicate where the error should appear
});

const ProductSchema = z.object({
  categoryId:z.number().positive({ message:'product.validations.product_category_id_invalid' }),
  name: z.string().nonempty({ message: 'product.validations.name_required' }),
  description: z.string().nonempty({ message: 'product.validations.description_required' }),
  existing_images: z.array(z.string()).default([]),
  images: z.array(imageFileSchema).default([]),
  stock: z.number().min(1, { message: 'product.validations.stock_min' }),
  price: z.number().positive({ message: 'product.validations.price_min' }),
  custom_price: z.array(CustomPriceSchema),
  status: z.string().nonempty({ message: 'product.validations.status_required' }),
}).refine(data => data.existing_images.length > 0 || data.images.length > 0, {
  message: 'product.validations.images_min',
  path: ['images'] // This can be any path to indicate where the error should appear
});

const ExperienceSchema = z.object({
  categoryId:z.number().positive({ message:'experience.validations.experience_category_id_invalid' }),
  header: z.string().nonempty({ message: 'experience.validations.header_required' }),
  name: z.string().nonempty({ message: 'experience.validations.name_required' }),
  description: z.string().nonempty({ message: 'experience.validations.description_required' }),
  existing_images: z.array(z.string()).default([]),
  images: z.array(imageFileSchema).default([]),
  duration: z.number().min(1, { message: 'experience.validations.duration_min' }),
  limit_age: z.number().min(1, { message: 'experience.validations.limit_age_min' }),
  qtypeople: z.number().min(1, { message: 'experience.validations.qtypeople_min' }),
  suggestions: z.array(z.string()).default([]),
  price: z.number().min(0,{ message: 'experience.validations.price_min' }),
  custom_price: z.array(CustomPriceSchema),
  status: z.string().nonempty({ message: 'experience.validations.status_required' }),
}).refine(data => data.existing_images.length > 0 || data.images.length > 0, {
  message: 'experience.validations.images_min',
  path: ['images'] // This can be any path to indicate where the error should appear
});

const DiscountCodeSchema = z.object({
  code: z.string().nonempty({ message: 'discount.validations.code_required' }),
  discount: z.number().min(1, { message: 'discount.validations.discount_min' }).max(100,{ message: 'discount.validations.discount_max' }),
  stock: z.number().min(1, { message: 'discount.validations.stock_min' }),
  expiredDate: z.date(),
  status: z.string().nonempty({ message: 'discount.validations.status_required' }),
});

const TentPromotion = z.object({
  idTent: z.number().positive({ message: 'promotion.validations.tent_id_positive' }),
  name: z.string().nonempty({message:'promotion.validations.tent_name_required'}),
  quantity:z.number().positive({ message: 'promotion.validations.tent_quantity_positive' }),
  price: z.number().positive({ message: 'promotion.validations.tent_price_positive' })
});

const ProductPromotion = z.object({
  idProduct: z.number().positive({ message: 'promotion.validations.product_id_positive' }),
  name: z.string().nonempty({message:'promotion.validations.product_name_required'}),
  quantity:z.number().positive({ message: 'promotion.validations.product_quantity_positive' }),
  price: z.number().positive({ message: 'promotion.validations.product_price_positive' })
});

const ExperiencePromotion = z.object({
  idExperience: z.number().positive({ message: 'promotion.validations.experience_id_positive' }),
  name: z.string().nonempty({message:'promotion.validations.experience_name_required'}),
  quantity:z.number().positive({ message: 'promotion.validations.experience_quantity_positive' }),
  price: z.number().positive({ message: 'promotion.validations.experience_price_positive' })
});

const PromotionSchema = z.object({
  title: z.string().nonempty({ message: 'promotion.validations.title_required' }),
  description: z.string().nonempty({ message: 'promotion.validations.description_required' }),
  existing_images: z.array(z.string()).default([]),
  images: z.array(imageFileSchema).default([]),
  status: z.string().nonempty({ message: 'promotion.validations.status_required' }),
  expiredDate: z.date(),
  qtypeople: z.number().min(1, { message: 'promotion.validations.qtypeople_min' }),
  qtykids: z.number(),
  netImport: z.number().min(1, { message: 'promotion.validations.net_import_min' }),
  discount: z.number().min(1, { message: 'promotion.validations.discount_min' }),
  grossImport: z.number().min(1, { message: 'promotion.validations.gross_import_min' }),
  stock: z.number().min(1, { message: 'promotion.validations.stock_min' }),
  tents: z.array(TentPromotion),
  products: z.array(ProductPromotion),
  experiences: z.array(ExperiencePromotion),
}).refine(data => data.existing_images.length > 0 || data.images.length > 0, {
  message: 'promotion.validations.images_min',
  path: ['images'] // This can be any path to indicate where the error should appear
});

const ReserveTentDtoSchema = z.object({
  idTent: z.number().positive({ message: 'El id del tent debe ser un número positivo' }),
  name: z.string().nonempty({ message: 'El nombre es requerido' }),
  price: z.number().positive({ message: 'El precio debe ser un número positivo' }),
  quantity: z.number().positive({ message: 'La cantidad debe ser un número positivo' })
});

const ReserveProductDtoSchema = z.object({
  idProduct: z.number().positive({ message: 'El id del producto debe ser un número positivo' }),
  name: z.string().nonempty({ message: 'El nombre es requerido' }),
  price: z.number().positive({ message: 'El precio debe ser un número positivo' }),
  quantity: z.number().positive({ message: 'La cantidad debe ser un número positivo' })
});

const ReserveExperienceDtoSchema = z.object({
  idExperience: z.number().positive({ message: 'El id de la experiencia debe ser un número positivo' }),
  name: z.string().nonempty({ message: 'El nombre es requerido' }),
  price: z.number().positive({ message: 'El precio debe ser un número positivo' }),
  quantity: z.number().positive({ message: 'La cantidad debe ser un número positivo' }),
  day:z.date()
});

// Define the main ReserveFormData schema
const ReserveFormDataSchema = z.object({
  qtypeople: z.number().positive({ message: 'La cantidad de personas debe ser un número positivo' }),
  qtykids: z.number().nonnegative({ message: 'La cantidad de niños debe ser un número no negativo' }),
  userId: z.number().positive({ message: 'El ID del usuario debe ser un número positivo' }),
  tents: z.array(ReserveTentDtoSchema).default([]),
  products: z.array(ReserveProductDtoSchema).default([]),
  experiences: z.array(ReserveExperienceDtoSchema).default([]),
  dateFrom: z.date({ message: 'La fecha de inicio es requerida' }),
  dateTo: z.date({ message: 'La fecha de fin es requerida' }),
  promotionId: z.number().nonnegative({ message: 'El ID de la promoción no puede ser negativo' }).optional(),
  price_is_calculated: z.boolean({ message: 'Debe ser verdadero o falso' }),
  discountCodeId: z.number().nonnegative({ message: 'El ID del código de descuento no puede ser neativo' }).optional(),
  netImport: z.number().positive({ message: 'El importe neto debe ser un número positivo' }),
  discount: z.number().nonnegative({ message: 'El descuento debe ser un número no negativo' }),
  grossImport: z.number().positive({ message: 'El importe bruto debe ser un número positivo' }),
  canceled_reason: z.string().optional(),
  canceled_status: z.boolean({ message: 'Debe ser verdadero o falso' }),
  paymentStatus: z.string().nonempty({ message: 'El estado del pago es requerido' }),
  aditionalPeople: z.number().nonnegative({ message: 'La cantidad de personas adicionales debe ser un número no negativo' }),
});

const ReviewSchema = z.object({
  name: z.string().nonempty({ message: 'review.validations.name_required' }),
  title: z.string().nonempty({ message: 'review.validations.title_required' }),
  review: z.string().nonempty({ message: 'review.validations.review_required' }),
  stars: z.number().nonnegative({ message: 'review.validations.stars_required' }).min(1,{message:"review.validations.stars_minimum"}).max(5,{message:"review.validations.stars_maximum"}),
  day:z.date({message:"review.validations.date_required"}),
  href: z.string().nullable(),
  profile_image_url: z.string().nullable(),
});

const FaqSchema = z.object({
  question: z.string().nonempty({ message: 'faq.validations.question_required' }),
  answer: z.string().nonempty({ message: 'faq.validations.answer_required' }),
});


export { signInSchema, createUserSchema, editUserSchema, TentSchema, ProductSchema, ExperienceSchema, DiscountCodeSchema, PromotionSchema, ReserveFormDataSchema, ReviewSchema, FaqSchema};
