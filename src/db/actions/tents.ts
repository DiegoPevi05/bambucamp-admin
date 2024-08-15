import {toast} from 'sonner';
import { ZodError } from 'zod';
import axios from 'axios';
import { Tent, TentFilters, TentFormData } from '../../lib/interfaces';
import { serializeTent } from '../serializer';
import { serializeTentToDB } from '../serializer';

export const getAllTents = async( token: string, page:Number, filters?:TentFilters ): Promise<{tents:Tent[], totalPages:Number ,currentPage:Number}|null> => {

  let data:{ tents:Tent[],totalPages:Number,currentPage:Number } | null = null;
  try{
    // Create a URLSearchParams object to construct the query string
    const params = new URLSearchParams();
    params.append('page', page.toString());

    // Append filters to the query parameters
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key as keyof TentFilters]) {
          params.append(key, filters[key as keyof TentFilters] as string);
        }
      });
    }

    // Construct the URL with query parameters
    const url = `${import.meta.env.VITE_BACKEND_URL}/tents?${params.toString()}`;

    const fetchTents = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    data = {
      tents: fetchTents.data.tents.map((tent: any) => serializeTent(tent)),
      currentPage: parseInt(fetchTents.data.currentPage as string, 10),
      totalPages:parseInt(fetchTents.data.totalPages as string, 10)
    }


  }catch(error){
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error fetching glampings.";

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



export const createTent = async (tent: TentFormData, token: string): Promise<void> => {
  try {

    // Create a new FormData object
    const formData = serializeTentToDB(tent);

    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/tents`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    });

    if (response.status === 201) {
      toast.success("Glamping created successfully");
    } else {
      toast.error("Something went wrong creating the glamping.");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error creating the glamping.";

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


export const updateTent = async (userId:Number,tent: TentFormData, token: string): Promise<void> => {
  try {
    // Create a new FormData object
    const formData = serializeTentToDB(tent,true);

    const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/tents/${userId}`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    });

    if (response.status === 200) {
      toast.success("Glamping updated successfully.");
    } else {
      toast.error("Something went wrong updating the glamping.");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error updating the glamping.";

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



export const deleteTent = async(idTent:Number, token:string ):Promise<void> => {

  try {
    const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/tents/${idTent}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 200) {
      toast.success("Glamping deleted successfully.");
    } else {
      toast.error("Something went wrong deleting the glamping.");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error deleting the glamping.";

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

