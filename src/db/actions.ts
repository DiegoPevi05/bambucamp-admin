import {toast} from 'sonner';
import { ZodError } from 'zod';
import axios from 'axios';
import { User } from '../lib/interfaces';
import {signInSchema } from './schemas';

type signInType = {
  email:string;
  password:string;

}


export const SignInAccount = async (signInValues: signInType, language:string): Promise<User|null> => {

  let user: User | null = null;

  try {
    signInSchema.parse(signInValues);
    const loginResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/auth/signin`, signInValues, {
      headers: {
        'Accept-Language':language
      }
    });
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
    }else if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorData = error.response?.data;
      const errorMessage = errorData?.error;

      if (Array.isArray(errorMessage)) {
        // Handle validation errors (array of errors)
        errorMessage.forEach((err) => {
          toast.error(err.msg || 'Validation error occurred');
        });
      } else {
        // Handle other types of errors
        if (statusCode) {
          toast.error(`${errorData?.error || "Error during Log In."} (Code: ${statusCode})`);
        } else {
          toast.error(errorData?.error || "An error occurred.");
        }
      }
    } else {
      toast.error("An unexpected error occurred.");
    }
    console.error(error);
  }
  return user;
};
