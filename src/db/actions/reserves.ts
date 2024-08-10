import {toast} from 'sonner';
import { ZodError } from 'zod';
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
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error((err.message));
        console.log(err.message);
      });
    } else {
      toast.error("Error trayendo las opciones de reservas.");
      console.error(error);
    }
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
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error((err.message));
      });
    } else {
      toast.error("Error trayendo las reservas.");
      console.error(error);
    }
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
      toast.success("Reserva creada exitosamente");
    } else {
      toast.error("Algo salió mal al crear la reserva.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error creando la reserva."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error creando la reserva .");
      console.error(error);
    }
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
      toast.success("Reserva actualizada exitosamente");
    } else {
      toast.error("Algo salió mal al actualizar la reserva.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error actualizando la reserva."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error actualizando la reserva.");
      console.error(error);
    }
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
      toast.success("Reserva borrada exitosamente");
    } else {
      toast.error("Algo salió mal al borrar la reserva.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error borrando la reserva."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error borrando la reserva.");
      console.error(error);
    }
  }

}

