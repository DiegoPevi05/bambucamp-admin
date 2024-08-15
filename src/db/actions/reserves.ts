import {toast} from 'sonner';
import axios from 'axios';
import { Reserve, ReserveFilters, ReserveFormData, optionsReserve } from '../../lib/interfaces';
import { serializeReserve, serializeReserveOptions } from '../serializer';

export const getAllReserveOptions = async(token:string):Promise<optionsReserve|null> => {
  let data:optionsReserve | null = null;
  try{

    // Construct the URL with query parameters
    const url = `${import.meta.env.VITE_BACKEND_URL}/reserves/options`;

    const fetchReservesOptions = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });


    data = serializeReserveOptions(fetchReservesOptions.data); 



  }catch(error){
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error retrieving reserves.";

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

export const getAllReserves = async( token: string, page:Number, filters?:ReserveFilters ): Promise<{reserves:Reserve[], totalPages:Number ,currentPage:Number}|null> => {

  let data:{ reserves:Reserve[],totalPages:Number,currentPage:Number } | null = null;
  try{
    // Create a URLSearchParams object to construct the query string
    const params = new URLSearchParams();
    params.append('page', page.toString());

    // Append filters to the query parameters
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key as keyof ReserveFilters]) {
          params.append(key, filters[key as keyof ReserveFilters] as string);
        }
      });
    }

    // Construct the URL with query parameters
    const url = `${import.meta.env.VITE_BACKEND_URL}/reserves?${params.toString()}`;

    const fetchReserves = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    data = {
      reserves: fetchReserves.data.reserves.map((reserve: any) => serializeReserve(reserve)),
      currentPage: parseInt(fetchReserves.data.currentPage as string, 10),
      totalPages:parseInt(fetchReserves.data.totalPages as string, 10)
    }


  }catch(error){
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error retrieving reserves.";

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



export const createReserve = async (reserve: ReserveFormData, token: string): Promise<void> => {
  try {

    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/reserves`, reserve, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (response.status === 201) {
      toast.success("Reserve created successfully.");
    } else {
      toast.error("Something went wrong creating the reserve.");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error creating the reserve.";

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


export const updateReserve = async (reserveId:Number,reserve: ReserveFormData, token: string): Promise<void> => {
  try {

    const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/reserves/${reserveId}`, reserve, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (response.status === 200) {
      toast.success("Reserve updated successfully.");
    } else {
      toast.error("Something went wrong updating the reserve.");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error updating reserves.";

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



export const deleteReserve = async(idReserve:Number, token:string ):Promise<void> => {

  try {
    const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/reserves/${idReserve}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 200) {
      toast.success("Reserve deleted successfully.");
    } else {
      toast.error("Something went wrong deleting the reserve.");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error deleting the reserve.";

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

