import { z } from 'zod';


const signInSchema = z.object({
  email: z.string().email({ message: "auth.validations.email_invalid" }),
  password: z.string().min(6, { message: "auth.validations.password_length" }),
});

const createUserSchema = z.object({
  firstName: z.string().nonempty({ message: 'user.validations.name_required' }),
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
  nights:z.number().positive({ message: 'promotion.validations.tent_quantity_positive' }),
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
  idTent: z.number().positive({ message: 'reserve.validations.id_required' }),
  name: z.string().nonempty({ message: 'reserve.validations.name_required' }),
  price: z.number().positive({ message: 'reserve.validations.price_positive' }),
  nights: z.number().positive({ message: 'reserve.validations.quantity_positive' }),
  dateFrom:z.date(),
  dateTo:z.date(),
  aditionalPeople:z.number().nonnegative({message: "reserve.validations.aditional_people_positive"}).optional()
});

const ReserveProductDtoSchema = z.object({
  idProduct: z.number().positive({ message: "reserve.validations.id_required"}),
  name: z.string().nonempty({ message: "reserve.validations.name_required"}),
  price: z.number().positive({ message: "reserve.validations.price_positive"}),
  quantity: z.number().positive({ message: "reserve.validations.quantity_positive"})
});

const ReserveExperienceDtoSchema = z.object({
  idExperience: z.number().positive({ message: "reserve.validations.id_required"}),
  name: z.string().nonempty({ message: "reserve.validations.name_required"}),
  price: z.number().positive({ message: "reserve.validations.price_positive"}),
  quantity: z.number().positive({ message: "reserve.validations.quantity_positive"}),
  day: z.date(),
});

const ReservePromotionDtoSchema = z.object({
  idPromotion: z.number().positive({ message: "reserve.validations.id_required"}),
  name: z.string().nonempty({ message: "reserve.validations.name_required"}),
  price: z.number().positive({ message: "reserve.validations.price_positive"}),
  nights: z.number().positive({ message: "reserve.validations.nights_positive"}),
  dateFrom: z.date(),
  dateTo: z.date(),
});

const ReserveFormDataSchema = z.object({
  userType: z.string().nonempty({ message: "reserve.validations.user_type_required" }),
  user_email: z.string().email({ message: "user.validations.email_invalid" }),
  tents: z.array(ReserveTentDtoSchema).default([]),
  products: z.array(ReserveProductDtoSchema).default([]),
  experiences: z.array(ReserveExperienceDtoSchema).default([]),
  promotions: z.array(ReservePromotionDtoSchema).default([]),
  discount_code_id: z.number().nonnegative({ message: "reserve.validations.discount_code_id_nonnegative" }).optional(),
  discount_code_name: z.string().optional(),
  gross_import: z.number().positive({ message: "reserve.validations.gross_import_positive" }),
  discount: z.number().nonnegative({ message: "reserve.validations.discount_nonnegative" }),
  net_import: z.number().positive({ message: "reserve.validations.net_import_positive" }),
  canceled_reason: z.string().optional(),
  canceled_status: z.boolean({ message: "reserve.validations.canceled_status_boolean" }),
  payment_status: z.string().nonempty({ message: "reserve.validations.payment_status_required" }),
  reserve_status: z.string().nonempty({ message: "reserve.validations.reserve_status_required" }),

  // Add the optional fields that are conditionally required
  name: z.string().optional(),
  lastname: z.string().optional(),
  cellphone: z.string().optional(),

}).superRefine((data, ctx) => {
  if (data.userType !== "old") {
    const requiredFields = [
      "name",
      "lastname",
      "cellphone"
    ];
    
    requiredFields.forEach((field) => {
      if (!(data as any)[field]) {
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: `user.validations.${field}_required`,
        });
      }
    });
  }
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

const ReserveTentItemFormDataSchema = z.object({
  reserve_tent_option_id: z.number().positive({ message: "reserve.validations.id_required" }),
  reserve_tent_option_date_from: z.date({ message: "reserve.validations.date_from_required" }),
  reserve_tent_option_date_to: z.date({ message: "reserve.validations.date_to_required" }),
  reserve_tent_option_aditional_people: z.number().min(0, { message: "reserve.validations.aditional_people_min" }),
  reserve_tent_option_aditional_people_max: z.number().min(0, { message: "reserve.validations.aditional_people_max_required" }),
}).refine((data) => data.reserve_tent_option_date_from < data.reserve_tent_option_date_to, {
  message: "reserve.validations.date_from_less_than_date_to",
  path: ["reserve_tent_option_date_from"],
}).refine((data) => data.reserve_tent_option_aditional_people <= data.reserve_tent_option_aditional_people_max, {
  message: "reserve.validations.aditional_people_exceed_max",
  path: ["reserve_tent_option_aditional_people"], // Error will point to this field
});

const ReservePromotionItemFormDataSchema = z.object({
  reserve_promotion_option_id: z.number().positive({ message: "reserve.validations.id_required" }),
  reserve_promotion_option_date_from: z.date({ message: "reserve.validations.date_from_required" }),
  reserve_promotion_option_date_to: z.date({ message: "reserve.validations.date_to_required" }),
}).refine((data) => data.reserve_promotion_option_date_from < data.reserve_promotion_option_date_to, {
  message: "reserve.validations.date_from_less_than_date_to",
  path: ["reserve_promotion_option_date_from"],
})


const ReserveExperienceItemFormDataSchema = z.object({
  reserve_experience_option_id: z.number().positive({ message: "reserve.validations.id_required" }),
  reserve_experience_option_day: z.date(),
  reserve_experience_option_quantity: z.number().min(1,{ message: "reserve.validations.quantity_min" }),
})

const ReserveProductItemFormDataSchema = z.object({
  reserve_product_option_id: z.number().positive({ message: "reserve.validations.id_required" }),
  reserve_product_option_quantity: z.number().min(1,{ message: "reserve.validations.quantity_min" }),
})


export { signInSchema, createUserSchema, editUserSchema, TentSchema, ProductSchema, ExperienceSchema, DiscountCodeSchema, PromotionSchema, ReserveFormDataSchema, ReviewSchema, FaqSchema ,ReserveTentItemFormDataSchema, ReserveProductItemFormDataSchema, ReserveExperienceItemFormDataSchema, ReservePromotionItemFormDataSchema};
