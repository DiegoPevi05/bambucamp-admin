import {toast} from 'sonner';
import { ZodError } from 'zod';
import axios from 'axios';
import { User } from '../lib/interfaces';
import {signInSchema } from './schemas';

type signInType = {
  email:string;
  password:string;

}


export const SignInAccount = async (signInValues: signInType): Promise<User|null> => {

  let user: User | null = null;

  try {
    signInSchema.parse(signInValues);
    const loginResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/auth/signin`, signInValues);
    user = {
      id: loginResponse.data.user.id,
      email: loginResponse.data.user.email,
      firstName: loginResponse.data.user.firstName,
      lastName:loginResponse.data.user.lastName,
      role: loginResponse.data.user.role,
      phoneNumber: loginResponse.data.user.phoneNumber,
      token:loginResponse.data.token
    };
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error((err.message));
      });
    } else {
      toast.error("Error durante Inicio de Sesion.");
      console.error(error);
    }
  }
  return user;
};
