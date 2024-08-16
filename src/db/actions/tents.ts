import {toast} from 'sonner';
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
        'Authorization': `Bearer ${token}`,
        'Accept-Language':'es'
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
          toast.error(`${errorData?.error || "Error fetching the tents."} (Code: ${statusCode})`);
        } else {
          toast.error(errorData?.error || "An error occurred.");
        }
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
        'Accept-Language':'es'
      }
    });

    toast.success(response.data.message);

  } catch (error) {
    if (axios.isAxiosError(error)) {
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
          toast.error(`${errorData?.error || "Error creating the tent."} (Code: ${statusCode})`);
        } else {
          toast.error(errorData?.error || "An error occurred.");
        }
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
        'Accept-Language':'es'
      }
    });

    toast.success(response.data.message);
  } catch (error) {
    if (axios.isAxiosError(error)) {
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
          toast.error(`${errorData?.error || "Error updating the tent."} (Code: ${statusCode})`);
        } else {
          toast.error(errorData?.error || "An error occurred.");
        }
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
        'Authorization': `Bearer ${token}`,
        'Accept-Language':'es'
      }
    });

    toast.success(response.data.message);

  } catch (error) {
    if (axios.isAxiosError(error)) {
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
          toast.error(`${errorData?.error || "Error deleting the tent."} (Code: ${statusCode})`);
        } else {
          toast.error(errorData?.error || "An error occurred.");
        }
      }
    } else {
      toast.error("An unexpected error occurred.");
    }
    console.error(error);
  }

}

