import {toast} from 'sonner';
import { ZodError } from 'zod';
import axios from 'axios';
import { DiscountCode, DiscountCodeFilters, DiscountCodeFormData } from '../../lib/interfaces';
import { serializeDiscountCode, serializeDiscountCodeToDB } from '../serializer';

export const getAllDiscountCodes = async( token: string, page:Number, filters?:DiscountCodeFilters ): Promise<{discountCodes:DiscountCode[], totalPages:Number ,currentPage:Number}|null> => {

  let data:{ discountCodes:DiscountCode[],totalPages:Number,currentPage:Number } | null = null;
  try{
    // Create a URLSearchParams object to construct the query string
    const params = new URLSearchParams();
    params.append('page', page.toString());

    // Append filters to the query parameters
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key as keyof DiscountCodeFilters]) {
          params.append(key, filters[key as keyof DiscountCodeFilters] as string);
        }
      });
    }

    // Construct the URL with query parameters
    const url = `${import.meta.env.VITE_BACKEND_URL}/discounts?${params.toString()}`;

    const fetchDiscounts = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    data = {
      discountCodes: fetchDiscounts.data.discountCodes.map((discount: any) => serializeDiscountCode(discount)),
      currentPage: parseInt(fetchDiscounts.data.currentPage as string, 10),
      totalPages:parseInt(fetchDiscounts.data.totalPages as string, 10)
    }


  }catch(error){
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error((err.message));
      });
    } else {
      toast.error("Error trayendo los codigos de descuento.");
      console.error(error);
    }
  }

  return data;
}



export const createDiscountCode = async (discountCode: DiscountCodeFormData, token: string): Promise<void> => {
  try {

    console.log(discountCode);
    // Create a new FormData object
    const formData = serializeDiscountCodeToDB(discountCode);

    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/discounts`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    });

    if (response.status === 201) {
      toast.success("Codigo de descuento creado exitosamente");
    } else {
      toast.error("Algo salió mal al crear el codigo de descuento.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error creando el codigo de descuento."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error creando la experiencia .");
      console.error(error);
    }
  }
};


export const updateDiscountCode = async (discountCodeId:Number,discountCode: DiscountCodeFormData, token: string): Promise<void> => {
  try {
    // Create a new FormData object
    const formData = serializeDiscountCodeToDB(discountCode,true);

    const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/discounts/${discountCodeId}`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    });

    if (response.status === 200) {
      toast.success("Codigo de descuento actualizado exitosamente");
    } else {
      toast.error("Algo salió mal al actualizar el codigo de descuento.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error actualizando el codigo de descuento."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error actualizando la experiencia.");
      console.error(error);
    }
  }
};



export const deleteDiscountCode = async(idDiscountCode:Number, token:string ):Promise<void> => {

  try {
    const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/discounts/${idDiscountCode}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 200) {
      toast.success("Codigo de descuento borrado exitosamente");
    } else {
      toast.error("Algo salió mal al borrar el codigo de descuento.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error borrando el codigo de descuento."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error borrando la experiencia.");
      console.error(error);
    }
  }

}

