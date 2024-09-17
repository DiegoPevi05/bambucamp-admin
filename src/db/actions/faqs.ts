import {toast} from 'sonner';
import axios from 'axios';
import { Faq, FaqFormData } from '../../lib/interfaces';
import { serializeFaq } from '../serializer';

export const getAllFaqs = async( token: string, page:Number, language:string ): Promise<{faqs:Faq[], totalPages:Number ,currentPage:Number}|null> => {

  let data:{ faqs:Faq[],totalPages:Number,currentPage:Number } | null = null;
  try{
    // Create a URLSearchParams object to construct the query string
    const params = new URLSearchParams();
    params.append('page', page.toString());
    // Construct the URL with query parameters
    const url = `${import.meta.env.VITE_BACKEND_URL}/web/faqs?${params.toString()}`;

    const fetchFaqs = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language':language
      }
    });

    data = {
      faqs: fetchFaqs.data.faqs.map((faq: any) => serializeFaq(faq)),
      currentPage: parseInt(fetchFaqs.data.currentPage as string, 10),
      totalPages:parseInt(fetchFaqs.data.totalPages as string, 10)
    }


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
          toast.error(`${errorData?.error || "Error fetching the faqs."} (Code: ${statusCode})`);
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



export const createFaq = async (formData: FaqFormData, token: string, language:string): Promise<boolean> => {
  try {

    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/web/faqs`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language':language
      }
    });
    toast.success(response.data.message);
    return true;
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
          toast.error(`${errorData?.error || "Error creating the Faq."} (Code: ${statusCode})`);
        } else {
          toast.error(errorData?.error || "An error occurred.");
        }
      }
    } else {
      toast.error("An unexpected error occurred.");
    }
    console.error(error);
    return false;
  }
};

export const deleteFaq = async(idFaq:Number, token:string, language:string ):Promise<boolean> => {

  try {
    const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/web/faqs/${idFaq}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language':language
      }
    });
    toast.success(response.data.message);
    return true;
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
          toast.error(`${errorData?.error || "Error deleting the faq."} (Code: ${statusCode})`);
        } else {
          toast.error(errorData?.error || "An error occurred.");
        }
      }
    } else {
      toast.error("An unexpected error occurred.");
    }
    console.error(error);
    return false;
  }

}

