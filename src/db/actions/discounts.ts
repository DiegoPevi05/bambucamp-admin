import {toast} from 'sonner';
import { ZodError } from 'zod';
import axios from 'axios';
import { Experience, ExperienceFilters, ExperienceFormData } from '../../lib/interfaces';
import { serializeExperience, serializeExperienceToDB } from '../serializer';

export const getAllExperiences = async( token: string, page:Number, filters?:ExperienceFilters ): Promise<{experiences:Experience[], totalPages:Number ,currentPage:Number}|null> => {

  let data:{ experiences:Experience[],totalPages:Number,currentPage:Number } | null = null;
  try{
    // Create a URLSearchParams object to construct the query string
    const params = new URLSearchParams();
    params.append('page', page.toString());

    // Append filters to the query parameters
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key as keyof ExperienceFilters]) {
          params.append(key, filters[key as keyof ExperienceFilters] as string);
        }
      });
    }

    // Construct the URL with query parameters
    const url = `${import.meta.env.VITE_BACKEND_URL}/experiences?${params.toString()}`;

    const fetchProducts = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    data = {
      experiences: fetchProducts.data.experiences.map((experience: any) => serializeExperience(experience)),
      currentPage: parseInt(fetchProducts.data.currentPage as string, 10),
      totalPages:parseInt(fetchProducts.data.totalPages as string, 10)
    }


  }catch(error){
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error((err.message));
      });
    } else {
      toast.error("Error trayendo las experiencias.");
      console.error(error);
    }
  }

  return data;
}



export const createExperience = async (experience: ExperienceFormData, token: string): Promise<void> => {
  try {

    // Create a new FormData object
    const formData = serializeExperienceToDB(experience);

    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/experiences`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    });

    if (response.status === 201) {
      toast.success("Experiencia creada exitosamente");
    } else {
      toast.error("Algo salió mal al crear la experiencia.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error creando la experiencia."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error creando la experiencia .");
      console.error(error);
    }
  }
};


export const updateExperience = async (experienceId:Number,experience: ExperienceFormData, token: string): Promise<void> => {
  try {
    // Create a new FormData object
    const formData = serializeExperienceToDB(experience,true);

    const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/experiences/${experienceId}`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    });

    if (response.status === 200) {
      toast.success("Experiencia actualizado exitosamente");
    } else {
      toast.error("Algo salió mal al actualizar la experiencia.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error actualizando la experiencia."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error actualizando la experiencia.");
      console.error(error);
    }
  }
};



export const deleteExperience = async(idExperience:Number, token:string ):Promise<void> => {

  try {
    const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/experiences/${idExperience}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 200) {
      toast.success("Experiencia borrada exitosamente");
    } else {
      toast.error("Algo salió mal al borrar la experiencia.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error borrando la experiencia."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error borrando la experiencia.");
      console.error(error);
    }
  }

}

