import {toast} from 'sonner';
import axios from 'axios';
import { User, UserFilters } from '../../lib/interfaces';
import { serializeUser } from '../serializer';
import {z} from 'zod';
import { createUserSchema, editUserSchema } from '../schemas';

export const getAllUsers = async(token:string, page:Number, filters?:UserFilters): Promise<{users:User[], totalPages:Number ,currentPage:Number}|null> => {

  let data:{ users:User[],totalPages:Number,currentPage:Number } | null = null;
  try{
    // Create a URLSearchParams object to construct the query string
    const params = new URLSearchParams();
    params.append('page', page.toString());

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


    const fetchUsers = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    data = {
      users: fetchUsers.data.users.map((user: any) => serializeUser(user)),
      currentPage: parseInt(fetchUsers.data.currentPage as string, 10),
      totalPages:parseInt(fetchUsers.data.totalPages as string, 10)
    }

  }catch(error){
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error fetching users.";

      if (statusCode) {
        toast.error(`${errorMessage} (Code: ${statusCode})`);
      } else {
        toast.error(errorMessage);
      }
    } else {
      toast.error("An unexpected error occurred.");
    }
    console.error(error);
  }

  return data;
}


type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const createUser = async (user: CreateUserFormValues, token: string): Promise<void> => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/users`, user, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 201) {
      toast.success("User created successfully.");
    } else {
      toast.error("Something went wrong creating the user.");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error creating the user.";

      if (statusCode) {
        toast.error(`${errorMessage} (Code: ${statusCode})`);
      } else {
        toast.error(errorMessage);
      }
    } else {
      toast.error("An unexpected error occurred.");
    }
    console.error(error);
  }
};

type EditUserFormValues = z.infer<typeof editUserSchema>;

export const updateUser = async (userId:Number,user: EditUserFormValues, token: string): Promise<void> => {
  try {
    const { password, ...userData } = user;
    const payload = password ? { ...userData, password } : userData;
    const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/users/${userId}`, payload, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 200) {
      toast.success("User updated successfully.");
    } else {
      toast.error("Something went wrong updating the user.");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error updating the user.";

      if (statusCode) {
        toast.error(`${errorMessage} (Code: ${statusCode})`);
      } else {
        toast.error(errorMessage);
      }
    } else {
      toast.error("An unexpected error occurred.");
    }
    console.error(error);
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
      toast.success("User deleted successfully.");
    } else {
      toast.error("Something went wrong deleting the user..");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error deleting the user.";

      if (statusCode) {
        toast.error(`${errorMessage} (Code: ${statusCode})`);
      } else {
        toast.error(errorMessage);
      }
    } else {
      toast.error("An unexpected error occurred.");
    }
    console.error(error);
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
      toast.success("User disabled successfully.");
    } else {
      toast.error("Something went wrong disabling the user.");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error disabling the user.";

      if (statusCode) {
        toast.error(`${errorMessage} (Code: ${statusCode})`);
      } else {
        toast.error(errorMessage);
      }
    } else {
      toast.error("An unexpected error occurred.");
    }
    console.error(error);
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
      toast.success("User enable successfully.");
    } else {
      toast.error("Something went wrong enabling the user.");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error enabling the user.";

      if (statusCode) {
        toast.error(`${errorMessage} (Code: ${statusCode})`);
      } else {
        toast.error(errorMessage);
      }
    } else {
      toast.error("An unexpected error occurred.");
    }
    console.error(error);
  }

}
