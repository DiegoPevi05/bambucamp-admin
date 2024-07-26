import { signInSchema } from './schemas';
import {toast} from 'sonner';
import { ZodError } from 'zod';
import axios from 'axios';
import { User, UserFilters } from '../lib/interfaces';
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

export const getAllUsers = async(user:User, page:Number, filters?:UserFilters): Promise<{users:User[], totalPages:Number ,currentPage:Number}|null> => {

  let data:{ users:User[],totalPages:Number,currentPage:Number } | null = null;
  try{
    // Create a URLSearchParams object to construct the query string
    const params = new URLSearchParams();
    params.append('page', page.toString());

    console.log(filters);
    // Append filters to the query parameters
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key as keyof UserFilters]) {
          params.append(key, filters[key as keyof UserFilters] as string);
        }
      });
    }

    // Construct the URL with query parameters
    const url = `${import.meta.env.VITE_BACKEND_URL}/users?${params.toString()}`;

    console.log(url)

    const fetchUsers = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${user.token}`
      }
    });

    data = {
      users: fetchUsers.data.users.map((user: any) => serializeUser(user)),
      currentPage: parseInt(fetchUsers.data.currentPage as string, 10),
      totalPages:parseInt(fetchUsers.data.totalPages as string, 10)
    }

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

  return data;
}


type UserFormValues = z.infer<typeof createUserSchema>;

export const createUser = async (user: UserFormValues, token: string): Promise<void> => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/users`, user, {
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

export const updateUser = async (userId:Number,user: UserFormValues, token: string): Promise<void> => {
  try {
    const { password, ...userData } = user;
    const payload = password ? { ...userData, password } : userData;
    const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/users/${userId}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 200) {
      toast.success("Usuario actualizado exitosamente");
    } else {
      toast.error("Algo salió mal al actualizar el usuario.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error actualizando el usuario."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error actualizando el usuario.");
      console.error(error);
    }
  }
};




export const deleteUser = async(idUser:Number, token:string ):Promise<void> => {

  try {
    const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/users/${idUser}`, {
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

export const disableUser = async(idUser:Number, token:string ):Promise<void> => {

  try {
    const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/users/${idUser}/disable`,{}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 200) {
      toast.success("Usuario Inhabilitado exitosamente");
    } else {
      toast.error("Algo salió mal al inhabilitar el usuario.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error inhabilitando el usuario."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error inhabilitando el usuario.");
      console.error(error);
    }
  }

}

export const enableUser = async(idUser:Number, token:string ):Promise<void> => {

  try {
    const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/users/${idUser}/enable`,{}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log(response);

    if (response.status === 200) {
      toast.success("Usuario Habilitado exitosamente");
    } else {
      toast.error("Algo salió mal al habilitar el usuario.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error habilitando el usuario."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error habilitando el usuario.");
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
