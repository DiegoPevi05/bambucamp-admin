import { z } from 'zod';


const signInSchema = z.object({
  email: z.string().email({ message: "Email is not valid." }),
  password: z.string().min(6, { message: "Password must be at least 8 characters." }),
});



export { signInSchema};
