import {toast} from 'sonner';
import { ZodError } from 'zod';
import axios from 'axios';
import { Promotion, PromotionFilters, PromotionFormData, optionsPromotion } from '../../lib/interfaces';
import { serializePromotion, serializePromotionToDB, serializePromotionOptions } from '../serializer';

export const getAllPromotionOptions = async(token:string):Promise<optionsPromotion|null> => {
  let data:optionsPromotion | null = null;
  try{

    // Construct the URL with query parameters
    const url = `${import.meta.env.VITE_BACKEND_URL}/promotions/options`;

    const fetchPromotionsOptions = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });


    data = serializePromotionOptions(fetchPromotionsOptions.data); 



  }catch(error){
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error((err.message));
        console.log(err.message);
      });
    } else {
      toast.error("Error trayendo las promociones.");
      console.error(error);
    }
  }

  return data;
}

export const getAllPromotions = async( token: string, page:Number, filters?:PromotionFilters ): Promise<{promotions:Promotion[], totalPages:Number ,currentPage:Number}|null> => {

  let data:{ promotions:Promotion[],totalPages:Number,currentPage:Number } | null = null;
  try{
    // Create a URLSearchParams object to construct the query string
    const params = new URLSearchParams();
    params.append('page', page.toString());

    // Append filters to the query parameters
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key as keyof PromotionFilters]) {
          params.append(key, filters[key as keyof PromotionFilters] as string);
        }
      });
    }

    // Construct the URL with query parameters
    const url = `${import.meta.env.VITE_BACKEND_URL}/promotions?${params.toString()}`;

    const fetchPromotions = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log(fetchPromotions);

    data = {
      promotions: fetchPromotions.data.promotions.map((promotion: any) => serializePromotion(promotion)),
      currentPage: parseInt(fetchPromotions.data.currentPage as string, 10),
      totalPages:parseInt(fetchPromotions.data.totalPages as string, 10)
    }


  }catch(error){
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error((err.message));
      });
    } else {
      toast.error("Error trayendo las promociones.");
      console.error(error);
    }
  }

  return data;
}



export const createPromotion = async (promotion: PromotionFormData, token: string): Promise<void> => {
  try {

    // Create a new FormData object
    const formData = serializePromotionToDB(promotion);

    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/promotions`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    });

    if (response.status === 201) {
      toast.success("Promocion creada exitosamente");
    } else {
      toast.error("Algo salió mal al crear la promocion.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error creando la promocion."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error creando la promocion .");
      console.error(error);
    }
  }
};


export const updatePromotion = async (promotionId:Number,promotion: PromotionFormData, token: string): Promise<void> => {
  try {
    // Create a new FormData object
    const formData = serializePromotionToDB(promotion,true);

    const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/promotions/${promotionId}`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    });

    if (response.status === 200) {
      toast.success("Promocion actualizada exitosamente");
    } else {
      toast.error("Algo salió mal al actualizar la promocion.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error actualizando la promocion."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error actualizando la promocion.");
      console.error(error);
    }
  }
};



export const deletePromotion = async(idPromotion:Number, token:string ):Promise<void> => {

  try {
    const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/promotions/${idPromotion}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 200) {
      toast.success("Promocion borrada exitosamente");
    } else {
      toast.error("Algo salió mal al borrar la promocion.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error borrando la promocion."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error borrando la promocion.");
      console.error(error);
    }
  }

}

