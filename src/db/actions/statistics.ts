import axios from "axios";
import { toast } from "sonner";
import {serializeStatisticsNetSales, serializeStatisticsReserves} from "../serializer";

export const getReserveQuantityStatistics = async (token:string, filters:{step:string,type:string}, language:string): Promise<{ date: string; quantity: number }[]|null> => {
  let data: { date: string; quantity: number }[]|null = null  

  try {
    // Create a URLSearchParams object to construct the query string
    const params = new URLSearchParams();
    params.append('step', filters.step);
    params.append('type', filters.type);

    // Construct the URL with query parameters
    const url = `${import.meta.env.VITE_BACKEND_URL}/statistics/reserves?${params.toString()}`;


    const fetchStatisticsResponse = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language':language,
      }
    });


    data =  serializeStatisticsReserves(fetchStatisticsResponse.data);

    return data;

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
          toast.error(`${errorData?.error || "Error during Fetching the statistics."} (Code: ${statusCode})`);
        } else {
          toast.error(errorData?.error || "An error occurred.");
        }
      }
    } else {
      toast.error("An unexpected error occurred.");
    }
    console.error(error);
  }
  return null;
};

export const getNetSalesStatistics = async (token:string, filters:{step:string,type:string}, language:string): Promise<{ date: string; amount: number }[]|null> => {
  let data: { date: string; amount: number }[]|null = null  

  try {
    // Create a URLSearchParams object to construct the query string
    const params = new URLSearchParams();
    params.append('step', filters.step);
    params.append('type', filters.type);

    // Construct the URL with query parameters
    const url = `${import.meta.env.VITE_BACKEND_URL}/statistics/net-import?${params.toString()}`;


    const fetchStatisticsResponse = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language':language,
      }
    });


    data = serializeStatisticsNetSales(fetchStatisticsResponse.data);

    return data;

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
          toast.error(`${errorData?.error || "Error during Fetching the statistics."} (Code: ${statusCode})`);
        } else {
          toast.error(errorData?.error || "An error occurred.");
        }
      }
    } else {
      toast.error("An unexpected error occurred.");
    }
    console.error(error);
  }
  return null;
};
