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
        'Authorization': `Bearer ${token}`,
        'Accept-Language':'es'
      }
    });

    data = fetchCategoryProducts.data.map((categoryProduct: any) => serializeCategoryProduct(categoryProduct));

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
          toast.error(`${errorData?.error || "Error fetching the product category."} (Code: ${statusCode})`);
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



export const createProductCategory = async (nameCategory: string, token: string): Promise<void> => {
  try {

    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/categories/product`, { name:nameCategory }, {
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
          toast.error(`${errorData?.error || "Error creating the product category."} (Code: ${statusCode})`);
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


export const updateProductCategory = async (productCategoryId:Number,productCategory: ProductCategory, token: string): Promise<void> => {
  try {

    const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/categories/product/${productCategoryId}`, productCategory, {
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
          toast.error(`${errorData?.error || "Error udpating the product category."} (Code: ${statusCode})`);
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



export const deleteProductCategory = async(idProductCategory:Number, token:string ):Promise<void> => {

  try {
    const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/categories/product/${idProductCategory}`, {
      headers: {
        Authorization: `Bearer ${token}`,
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
          toast.error(`${errorData?.error || "Error deleting the product category."} (Code: ${statusCode})`);
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


/*********************** EXPERIENCE CATEGORY CONTROLLERS ***************************/

export const getAllExperiencesCategory = async( token: string ): Promise<ExperienceCategory[] | null> => {

  let data:ExperienceCategory[] | null = null;
  try{
    // Construct the URL with query parameters
    const url = `${import.meta.env.VITE_BACKEND_URL}/categories/experience`;

    const fetchCategoryExperiences = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language':'es'
      }
    });

    data = fetchCategoryExperiences.data.map((categoryExperience: any) => serializeCategoryExperience(categoryExperience));

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
          toast.error(`${errorData?.error || "Error fetching the experience categories."} (Code: ${statusCode})`);
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



export const createExperienceCategory = async (nameCategory: string, token: string): Promise<void> => {
  try {

    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/categories/experience`, { name:nameCategory }, {
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
          toast.error(`${errorData?.error || "Error creating the experience category."} (Code: ${statusCode})`);
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


export const updateExperienceCategory = async (experienceCategoryId:Number,experienceCategory: ExperienceCategory, token: string): Promise<void> => {
  try {

    const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/categories/experience/${experienceCategoryId}`, experienceCategory, {
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
          toast.error(`${errorData?.error || "Error updating the experience category."} (Code: ${statusCode})`);
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



export const deleteExperienceCategory = async(idExperienceCategory:Number, token:string ):Promise<void> => {

  try {
    const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/categories/experience/${idExperienceCategory}`, {
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
          toast.error(`${errorData?.error || "Error deleting the experience category."} (Code: ${statusCode})`);
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
