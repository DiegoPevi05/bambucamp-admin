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



export { signInSchema, createUserSchema, editUserSchema};
