import {toast} from 'sonner';
import axios from 'axios';
import { DiscountCode, DiscountCodeFilters, DiscountCodeFormData } from '../../lib/interfaces';
import { serializeDiscountCode } from '../serializer';

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
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error fetching discount codes.";

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



export const createDiscountCode = async (discountCode: DiscountCodeFormData, token: string): Promise<void> => {
  try {

    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/discounts`, discountCode, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (response.status === 201) {
      toast.success("Discount code created successfully.");
    } else {
      toast.error("Something went wrong creating the discount code.");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error creating the discount code.";

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


export const updateDiscountCode = async (discountCodeId:Number,discountCode: DiscountCodeFormData, token: string): Promise<void> => {
  try {

    const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/discounts/${discountCodeId}`, discountCode, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (response.status === 200) {
      toast.success("Discount code updated successfully.");
    } else {
      toast.error("Something went wrong updating the discount code.");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error updating the discount code.";

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



export const deleteDiscountCode = async(idDiscountCode:Number, token:string ):Promise<void> => {

  try {
    const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/discounts/${idDiscountCode}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 200) {
      toast.success("Discount code deleted successfully.");
    } else {
      toast.error("Something went wrong deleting the discount.");
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const errorMessage = error.response?.data?.error || "Error deleting the discount code.";

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

