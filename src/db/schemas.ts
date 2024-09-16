import { z } from 'zod';


const signInSchema = z.object({
  email: z.string().email({ message: "auth.validations.email_invalid" }),
  password: z.string().min(6, { message: "auth.validations.password_length" }),
});

const createUserSchema = z.object({
  firstName: z.string().nonempty({ message: 'Nombre es requerido' }),
  lastName: z.string().nonempty({ message: 'Apellido es requerido' }),
  phoneNumber: z.string().nonempty({ message: 'Numero de telefono es requerido' }),
  email: z.string().email({ message: 'Debe ser un Correo Electronico Valido' }),
  role: z.string().refine(
    (value) => value === 'SUPERVISOR' || value === 'CLIENT',
    { message: 'Rol tiene que ser Supervisor o Cliente' }
  ),
  password: z.string()
    .min(8, { message: 'La Contraseña debe tener almenos 8 caracteres.' })
    .regex(/[a-zA-Z]/, { message: 'La Contraseña debe tener almenos una letra.' })
    .regex(/[0-9]/, { message: 'La Contraseña debe tener almenos un numero.' })
    .regex(/[^a-zA-Z0-9]/, { message: 'La Contraseña debe contener un caracter especial.' })
});

const editUserSchema = createUserSchema.omit({ password: true }).extend({
  password: z.string().optional()  // Password is optional for editing
});

const CustomPriceSchema = z.object({
  dateFrom: z.date(),
  dateTo: z.date(),
  price: z.number().positive({ message: 'El precio debe ser un número positivo' })
});

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

const imageFileSchema = z.instanceof(File).refine((file) => {
  return allowedMimeTypes.includes(file.type) && file.size <= 2 * 1024 * 1024;
}, {
  message: 'Debe ser un archivo de imagen válido (JPEG, PNG, WEBP) y no mayor de 2MB',
});

const TentSchema = z.object({
  header: z.string().nonempty({ message: 'El encabezado es requerido' }),
  title: z.string().nonempty({ message: 'El título es requerido' }),
  description: z.string().nonempty({ message: 'La descripción es requerida' }),
  existing_images: z.array(z.string()).default([]),
  images: z.array(imageFileSchema).default([]),
  qtypeople: z.number().gt(1, { message: 'La cantidad de personas debe ser mayor que 1' }),
  qtykids: z.number().nonnegative({ message: 'La cantidad de niños debe ser un número no negativo' }),
  aditional_people_price:z.number(),
  max_aditional_people:z.number(),
  price: z.number().positive({ message: 'El precio debe ser un número positivo' }),
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
  status: z.string().nonempty({ message: 'El estado es requerido' }),
}).refine(data => data.existing_images.length > 0 || data.images.length > 0, {
  message: 'Debe haber al menos una imagen',
  path: ['images'] // This can be any path to indicate where the error should appear
});

const ProductSchema = z.object({
  categoryId:z.number().positive({ message:'El producto debe tener una categoria' }),
  name: z.string().nonempty({ message: 'El título es requerido' }),
  description: z.string().nonempty({ message: 'La descripción es requerida' }),
  existing_images: z.array(z.string()).default([]),
  images: z.array(imageFileSchema).default([]),
  stock: z.number().gt(1, { message: 'La cantidad de productos debe ser mayor que 1' }),
  price: z.number().positive({ message: 'El precio debe ser un número positivo' }),
  custom_price: z.array(CustomPriceSchema),
  status: z.string().nonempty({ message: 'El estado es requerido' }),
}).refine(data => data.existing_images.length > 0 || data.images.length > 0, {
  message: 'Debe haber al menos una imagen',
  path: ['images'] // This can be any path to indicate where the error should appear
});

const ExperienceSchema = z.object({
  categoryId:z.number().positive({ message:'El producto debe tener una categoria' }),
  header: z.string().nonempty({ message: 'El encabezado es requerido' }),
  name: z.string().nonempty({ message: 'El título es requerido' }),
  description: z.string().nonempty({ message: 'La descripción es requerida' }),
  existing_images: z.array(z.string()).default([]),
  images: z.array(imageFileSchema).default([]),
  duration: z.number().gt(1, { message: 'La duracion de la experiencia debe ser mayor que 1 min' }),
  limit_age: z.number().gt(1, { message: 'Debe haber un limite de edad minima.' }),
  qtypeople: z.number().gt(1, { message: 'Debe ser alemnos para una persona la actividad.' }),
  suggestions: z.array(z.string()).default([]),
  price: z.number().positive({ message: 'El precio debe ser un número positivo' }),
  custom_price: z.array(CustomPriceSchema),
  status: z.string().nonempty({ message: 'El estado es requerido' }),
}).refine(data => data.existing_images.length > 0 || data.images.length > 0, {
  message: 'Debe haber al menos una imagen',
  path: ['images'] // This can be any path to indicate where the error should appear
});

const DiscountCodeSchema = z.object({
  code: z.string().nonempty({ message: 'El codigo es requerido' }),
  discount: z.number().gt(1, { message: 'El descuento es requerido' }),
  stock: z.number().gt(1, { message: 'El stock debe ser mayor a 1' }),
  expiredDate: z.date(),
  status: z.string().nonempty({ message: 'El estado es requerido' }),
});

const TentPromotion = z.object({
  idTent: z.number().positive({ message: 'El id debe ser un número positivo' }),
  name: z.string().nonempty({message:'El nombre del item no debe estar vacio'}),
  quantity:z.number().positive({ message: 'La cantidad debe ser un número positivo' }),
  price: z.number().positive({ message: 'El precio debe ser un número positivo' })
});

const ProductPromotion = z.object({
  idProduct: z.number().positive({ message: 'El id debe ser un número positivo' }),
  name: z.string().nonempty({message:'El nombre del item no debe estar vacio'}),
  quantity:z.number().positive({ message: 'La cantidad debe ser un número positivo' }),
  price: z.number().positive({ message: 'El precio debe ser un número positivo' })
});

const ExperiencePromotion = z.object({
  idExperience: z.number().positive({ message: 'El id debe ser un número positivo' }),
  name: z.string().nonempty({message:'El nombre del item no debe estar vacio'}),
  quantity:z.number().positive({ message: 'La cantidad debe ser un número positivo' }),
  price: z.number().positive({ message: 'El precio debe ser un número positivo' })
});

const PromotionSchema = z.object({
  title: z.string().nonempty({ message: 'El título es requerido' }),
  description: z.string().nonempty({ message: 'La descripción es requerida' }),
  existing_images: z.array(z.string()).default([]),
  images: z.array(imageFileSchema).default([]),
  status: z.string().nonempty({ message: 'El estado es requerido' }),
  expiredDate: z.date(),
  qtypeople: z.number().gt(1, { message: 'Debe ser almenos para una persona la actividad.' }),
  qtykids: z.number(),
  netImport: z.number().gt(1, { message: 'Debe ser mayor que 0 el importe.' }),
  discount: z.number().gt(1, { message: 'Debe ser mayor que 0 el descuento.' }),
  grossImport: z.number().gt(1, { message: 'Debe ser mayor que 0 el total.' }),
  stock: z.number().gt(1, { message: 'Debe ser mayor que 0 el stock.' }),
  tents: z.array(TentPromotion),
  products: z.array(ProductPromotion),
  experiences: z.array(ExperiencePromotion),
}).refine(data => data.existing_images.length > 0 || data.images.length > 0, {
  message: 'Debe haber al menos una imagen',
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
  name: z.string().nonempty({ message: 'El nombre es requerido' }),
  title: z.string().nonempty({ message: 'El título es requerido' }),
  review: z.string().nonempty({ message: 'La Opinion es requerido' }),
  stars: z.number().nonnegative({ message: 'Las estrellas son requeridas' }),
  day:z.date(),
  href: z.string().nullable(),
  profile_image_url: z.string().nullable(),
});

const FaqSchema = z.object({
  question: z.string().nonempty({ message: 'La pregunta es requerida' }),
  answer: z.string().nonempty({ message: 'La respuesta es requerida' }),
});


export { signInSchema, createUserSchema, editUserSchema, TentSchema, ProductSchema, ExperienceSchema, DiscountCodeSchema, PromotionSchema, ReserveFormDataSchema, ReviewSchema, FaqSchema};
