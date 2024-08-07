import { z } from 'zod';


const signInSchema = z.object({
  email: z.string().email({ message: "Correo no es valido." }),
  password: z.string().min(6, { message: "La Contraseña debe tener almenos 8 caracteres." }),
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
  price: z.number().positive({ message: 'El precio debe ser un número positivo' }),
  custom_price: z.array(CustomPriceSchema),
  status: z.string().nonempty({ message: 'El estado es requerido' }),
}).refine(data => data.existing_images.length > 0 || data.images.length > 0, {
  message: 'Debe haber al menos una imagen',
  path: ['images'] // This can be any path to indicate where the error should appear
});

export { signInSchema, createUserSchema, editUserSchema, TentSchema, ProductSchema, ExperienceSchema};
