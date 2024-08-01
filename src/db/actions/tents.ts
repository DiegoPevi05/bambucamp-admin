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
      toast.success("Glamping creado exitosamente");
    } else {
      toast.error("Algo salió mal al crear el glapming.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error creando el glamping."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error creando el glamping.");
      console.error(error);
    }
  }
};


export const updateTent = async (userId:Number,tent: TentFormData, token: string): Promise<void> => {
  try {
    // Create a new FormData object
    const formData = serializeTentToDB(tent);

    const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/tents/${userId}`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    });

    if (response.status === 200) {
      toast.success("Glamping actualizada exitosamente");
    } else {
      toast.error("Algo salió mal al actualizar el glamping.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error actualizando el glamping."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error actualizando el glamping.");
      console.error(error);
    }
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
      toast.success("Glamping borrado exitosamente");
    } else {
      toast.error("Algo salió mal al borrar el glamping.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error borrando el glamping."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error borrando el glamping.");
      console.error(error);
    }
  }

}

