import { signInSchema } from './schemas';
import {toast} from 'sonner';
import { ZodError } from 'zod';
import axios from 'axios';
import { User } from '../lib/interfaces';
import { serializeUser } from './serializer';
import {z} from 'zod';
import { createUserSchema } from './schemas';

type signInType = {
  email:string;
  password:string;

}


export const SignInAccount = async (signInValues: signInType): Promise<User|null> => {

  let user: User | null = null;

  try {
    signInSchema.parse(signInValues);
    const loginResponse = await axios.post(`${import.meta.env.VITE_FRONTEND_URL}/auth/signin`, signInValues);
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

export const getAllUsers = async(user:User): Promise<User[]|null> => {

  let users:User[] | null = null;
  try{
    const fetchUsers = await axios.get(`${import.meta.env.VITE_FRONTEND_URL}/users`, {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });

    users = fetchUsers.data.map((user: any) => serializeUser(user));

  }catch(error){
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error((err.message));
      });
    } else {
      toast.error("Error trayendo los usuarios.");
      console.error(error);
    }
  }

  return users;
}


type CreateFormValues = z.infer<typeof createUserSchema>;

export const createUser = async (user: CreateFormValues, token: string): Promise<void> => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_FRONTEND_URL}/users`, user, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 201) {
      toast.success("Usuario creado exitosamente");
    } else {
      toast.error("Algo salió mal al crear el usuario.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error creando el usuario."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error creando el usuario.");
      console.error(error);
    }
  }
};

export const deleteUser = async(idUser:Number, token:string ):Promise<void> => {

  try {
    const response = await axios.delete(`${import.meta.env.VITE_FRONTEND_URL}/users/${idUser}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 200) {
      toast.success("Usuario borrado exitosamente");
    } else {
      toast.error("Algo salió mal al borrar el usuario.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error borrando el usuario."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error borrando el usuario.");
      console.error(error);
    }
  }

}

/*
// Define the type for the data returned by the fetch
type SomeData = {
  // Define the structure of the data you expect from the API
  // For example:
  id: number;
  name: string;
  // Add other fields as needed
};

export const fetchSomeData = async (): Promise<SomeData | null> => {
  try {
    const response = await fetch('https://api.example.com/data');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data: SomeData = await response.json();
    return data;
  } catch (error) {
    toast.error("Failed to fetch data.");
    console.error(error);
    return null;
  }
};*/
