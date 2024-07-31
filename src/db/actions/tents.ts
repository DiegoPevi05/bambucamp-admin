import {toast} from 'sonner';
import { ZodError } from 'zod';
import axios from 'axios';
import { Tent, TentFilters, TentFormData } from '../../lib/interfaces';
import { serializeTent } from '../serializer';

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
    const formData = new FormData();

    // Append basic fields
    formData.append('title', tent.title);
    formData.append('description', tent.description);
    formData.append('header', tent.header);
    formData.append('qtypeople', tent.qtypeople.toString());
    formData.append('qtykids', tent.qtykids.toString());
    formData.append('price', tent.price.toString());
    formData.append('status', tent.status);

    // Append custom prices as a JSON string
    formData.append('custom_price', tent.custom_price);

    // Append images
    tent.images.forEach((image, index) => {
      formData.append(`images[${index}]`, image);
    });

    // Append services as a JSON string
    formData.append('services', tent.services);
    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/tents`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
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


export const updateTent = async (userId:Number,user: TentFormData, token: string): Promise<void> => {
  try {
    const { password, ...userData } = user;
    const payload = password ? { ...userData, password } : userData;
    const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/tents/${userId}`, payload, {
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




export const deleteTent = async(idUser:Number, token:string ):Promise<void> => {

  try {
    const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/tents/${idUser}`, {
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

export const disableTent = async(idUser:Number, token:string ):Promise<void> => {

  try {
    const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/tents/${idUser}/disable`,{}, {
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

export const enableTent = async(idUser:Number, token:string ):Promise<void> => {

  try {
    const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/users/${idUser}/enable`,{}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

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
