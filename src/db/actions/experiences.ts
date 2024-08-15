import {toast} from 'sonner';
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
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error retrieving experiences.";

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
      toast.success("Experience created successfully");
    } else {
      toast.error("Something went wrong during the creation.");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error creating the experience.";

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
      toast.success("Experience update successfully");
    } else {
      toast.error("Something went wrong updating the experience.");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error updating the experience.";

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



export const deleteExperience = async(idExperience:Number, token:string ):Promise<void> => {

  try {
    const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/experiences/${idExperience}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 200) {
      toast.success("Experience deleted successfully");
    } else {
      toast.error("Something went wrong deleting experience.");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error deleting the experience.";

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

