import {toast} from 'sonner';
import axios from 'axios';
import { Review, ReviewFormData } from '../../lib/interfaces';
import { serializeReview } from '../serializer';

export const getAllReviews = async( token: string, page:Number ): Promise<{reviews:Review[], totalPages:Number ,currentPage:Number}|null> => {

  let data:{ reviews:Review[],totalPages:Number,currentPage:Number } | null = null;
  try{
    // Create a URLSearchParams object to construct the query string
    const params = new URLSearchParams();
    params.append('page', page.toString());
    // Construct the URL with query parameters
    const url = `${import.meta.env.VITE_BACKEND_URL}/web/reviews?${params.toString()}`;

    const fetchReviews = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language':'es'
      }
    });

    data = {
      reviews: fetchReviews.data.reviews.map((faq: any) => serializeReview(faq)),
      currentPage: parseInt(fetchReviews.data.currentPage as string, 10),
      totalPages:parseInt(fetchReviews.data.totalPages as string, 10)
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
          toast.error(`${errorData?.error || "Error fetching the reviews."} (Code: ${statusCode})`);
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



export const createReview = async (formData: ReviewFormData, token: string): Promise<boolean> => {
  try {

    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/web/reviews`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language':'es'
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
          toast.error(`${errorData?.error || "Error creating the Review."} (Code: ${statusCode})`);
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

export const deleteReview = async(idReview:Number, token:string ):Promise<boolean> => {

  try {
    const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/web/reviews/${idReview}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language':'es'
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
          toast.error(`${errorData?.error || "Error deleting the review."} (Code: ${statusCode})`);
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


