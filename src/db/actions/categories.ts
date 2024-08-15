import {toast} from 'sonner';
import axios from 'axios';
import {  ProductCategory, ExperienceCategory } from '../../lib/interfaces';
import { serializeCategoryProduct, serializeCategoryExperience } from '../serializer';

/*********************** PRODUCT CATEGORY CONTROLLERS ***************************/

export const getAllProductsCategory = async( token: string ): Promise<ProductCategory[] | null> => {

  let data:ProductCategory[] | null = null;
  try{
    // Construct the URL with query parameters
    const url = `${import.meta.env.VITE_BACKEND_URL}/categories/product`;

    const fetchCategoryProducts = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    data = fetchCategoryProducts.data.map((categoryProduct: any) => serializeCategoryProduct(categoryProduct));

  }catch(error){
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error retrieving categories.";

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



export const createProductCategory = async (nameCategory: string, token: string): Promise<void> => {
  try {

    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/categories/product`, { name:nameCategory }, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (response.status === 201) {
      toast.success("Category of product was created successfully.");
    } else {
      toast.error("Something went wrong creating the category of product.");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error creating the category of product.";

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


export const updateProductCategory = async (productCategoryId:Number,productCategory: ProductCategory, token: string): Promise<void> => {
  try {

    const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/categories/product/${productCategoryId}`, productCategory, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 200) {
      toast.success("Category of product was successfully updated");
    } else {
      toast.error("Something went wrong trying to update the category of product.");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error updating category of product.";

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



export const deleteProductCategory = async(idProductCategory:Number, token:string ):Promise<void> => {

  try {
    const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/categories/product/${idProductCategory}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 200) {
      toast.success("Category of product deleted successfully");
    } else {
      toast.error("Something went wrong updating the category of product.");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error updating the category of product.";

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


/*********************** EXPERIENCE CATEGORY CONTROLLERS ***************************/

export const getAllExperiencesCategory = async( token: string ): Promise<ExperienceCategory[] | null> => {

  let data:ExperienceCategory[] | null = null;
  try{
    // Construct the URL with query parameters
    const url = `${import.meta.env.VITE_BACKEND_URL}/categories/experience`;

    const fetchCategoryExperiences = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    data = fetchCategoryExperiences.data.map((categoryExperience: any) => serializeCategoryExperience(categoryExperience));

  }catch(error){
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error fetching category of experience.";

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



export const createExperienceCategory = async (nameCategory: string, token: string): Promise<void> => {
  try {

    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/categories/experience`, { name:nameCategory }, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (response.status === 201) {
      toast.success("Category of experience created successfully.");
    } else {
      toast.error("Something went wrong creating the category of experience.");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error creating the category of experience.";

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


export const updateExperienceCategory = async (experienceCategoryId:Number,experienceCategory: ExperienceCategory, token: string): Promise<void> => {
  try {

    const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/categories/experience/${experienceCategoryId}`, experienceCategory, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 200) {
      toast.success("Category of experience updated successfully.");
    } else {
      toast.error("Something went wrong updating the category of experience.");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error updating the category of experience.";

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



export const deleteExperienceCategory = async(idExperienceCategory:Number, token:string ):Promise<void> => {

  try {
    const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/categories/experience/${idExperienceCategory}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 200) {
      toast.success("Category of experience deleted successfully.");
    } else {
      toast.error("Something went wrong deleting the category of experience.");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error deleting the category of experience.";

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
