import {toast} from 'sonner';
import axios from 'axios';
import { Experience, Product, PublicExperience, PublicProduct, Reserve, ReserveExperienceDto, ReserveFilters, ReserveFormData, ReserveProductDto, optionsReserve } from '../../lib/interfaces';
import {serializeExperience, serializeMyReserves, serializeMyReservesCalendar, serializeProduct, serializePublicExperience, serializePublicProduct, serializeReserve, serializeReserveOptions } from '../serializer';

export const getAllMyReservesCalendar = async(token:string, page:Number, language:string):Promise<{reserves:{ id:number, external_id:string, dateFrom:Date, dateTo:Date }[]} |null> => {
  let data:{ reserves:{ id:number, external_id:string, dateFrom:Date, dateTo:Date }[]}  | null = null;
  try{

    // Create a URLSearchParams object to construct the query string
    const params = new URLSearchParams();
    params.append('page', page.toString());

    // Construct the URL with query parameters
    const url = `${import.meta.env.VITE_BACKEND_URL}/reserves/me/admin/calendar?${params.toString()}`;

    const fetchReserves = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language':language
      }
    });

    data = {
      reserves: fetchReserves.data.reserves.map((reserve: any) => serializeMyReservesCalendar(reserve)),
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
          toast.error(`${errorData?.error || "Error fetching the dashboard reserves."} (Code: ${statusCode})`);
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

export const getAllMyReserves = async(token:string, page:Number, language:string):Promise<{reserves:Reserve[], totalPages:Number ,currentPage:Number}|null> => {
  let data:{ reserves:Reserve[],totalPages:Number,currentPage:Number } | null = null;
  try{

    // Create a URLSearchParams object to construct the query string
    const params = new URLSearchParams();
    params.append('page', page.toString());

    // Construct the URL with query parameters
    const url = `${import.meta.env.VITE_BACKEND_URL}/reserves/me/admin?${params.toString()}`;

    const fetchReserves = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language':language
      }
    });

    console.log(fetchReserves)

    data = {
      reserves: fetchReserves.data.reserves.map((reserve: any) => serializeMyReserves(reserve)),
      currentPage: parseInt(fetchReserves.data.currentPage as string, 10),
      totalPages:parseInt(fetchReserves.data.totalPages as string, 10)
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
          toast.error(`${errorData?.error || "Error fetching the dashboard reserves."} (Code: ${statusCode})`);
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

export const getAllReserveOptions = async(token:string):Promise<optionsReserve|null> => {
  let data:optionsReserve | null = null;
  try{

    // Construct the URL with query parameters
    const url = `${import.meta.env.VITE_BACKEND_URL}/reserves/options`;

    const fetchReservesOptions = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language':'es'
      }
    });


    data = serializeReserveOptions(fetchReservesOptions.data); 



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
          toast.error(`${errorData?.error || "Error fetching the reserves options."} (Code: ${statusCode})`);
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

export const getAllReserves = async( token: string, page:Number, filters?:ReserveFilters ): Promise<{reserves:Reserve[], totalPages:Number ,currentPage:Number}|null> => {

  let data:{ reserves:Reserve[],totalPages:Number,currentPage:Number } | null = null;
  try{
    // Create a URLSearchParams object to construct the query string
    const params = new URLSearchParams();
    params.append('page', page.toString());

    // Append filters to the query parameters
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key as keyof ReserveFilters]) {
          params.append(key, filters[key as keyof ReserveFilters] as string);
        }
      });
    }

    // Construct the URL with query parameters
    const url = `${import.meta.env.VITE_BACKEND_URL}/reserves?${params.toString()}`;

    const fetchReserves = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language':'es'
      }
    });

    data = {
      reserves: fetchReserves.data.reserves.map((reserve: any) => serializeReserve(reserve)),
      currentPage: parseInt(fetchReserves.data.currentPage as string, 10),
      totalPages:parseInt(fetchReserves.data.totalPages as string, 10)
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
          toast.error(`${errorData?.error || "Error fetching the reserves."} (Code: ${statusCode})`);
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



export const createReserve = async (reserve: ReserveFormData, token: string): Promise<boolean> => {
  try {

    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/reserves`, reserve, {
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
          toast.error(`${errorData?.error || "Error creating the reserve."} (Code: ${statusCode})`);
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


export const updateReserve = async (reserveId:Number,reserve: ReserveFormData, token: string): Promise<boolean> => {
  try {

    const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/reserves/${reserveId}`, reserve, {
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
          toast.error(`${errorData?.error || "Error updating the product."} (Code: ${statusCode})`);
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



export const deleteReserve = async(idReserve:Number, token:string ):Promise<boolean> => {

  try {
    const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/reserves/${idReserve}`, {
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
          toast.error(`${errorData?.error || "Error deleting the product."} (Code: ${statusCode})`);
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



export const addProductToReserve = async (products: ReserveProductDto[], token: string, language:string): Promise<boolean> => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/reserves/reserve/product`, {products:products }, {
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
          toast.error(`${errorData?.error || "Error adding the product to the reserve."} (Code: ${statusCode})`);
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

export const addExperienceToReserve = async (experiences: ReserveExperienceDto[], token: string, language:string): Promise<boolean> => {
  try {


    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/reserves/reserve/experience`, {experiences:experiences }, {
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
          toast.error(`${errorData?.error || "Error adding the experience to the reserve."} (Code: ${statusCode})`);
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

export const getPublicProducts = async (language:string, categories?:string[]): Promise<PublicProduct[]|null> => {
  let data: PublicProduct[]|null = null  

  try {

    const params = new URLSearchParams();

    if (categories && categories.length > 0) {
      categories.forEach(category => {
        params.append('categories[]', category);
      });
    }
    // Construct the URL with query parameters
    const url = `${import.meta.env.VITE_BACKEND_URL}/products/public?${params.toString()}`;


    const PublicProductsResponse = await axios.get(url, {
      headers: {
        'Accept-Language':language,
      }
    });


    data =  PublicProductsResponse.data.map((product: any) => serializePublicProduct(product));

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
          toast.error(`${errorData?.error || "Error during Fetching the products."} (Code: ${statusCode})`);
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

export const getPublicExperiences = async (language:string, categories?:string[]): Promise<PublicExperience[]|null> => {
  let data: PublicExperience[]|null = null  

  try {

    const params = new URLSearchParams();

    if (categories && categories.length > 0) {
      categories.forEach(category => {
        params.append('categories[]', category);
      });
    }
    // Construct the URL with query parameters
    const url = `${import.meta.env.VITE_BACKEND_URL}/experiences/public?${params.toString()}`;


    const PublicExperiencesResponse = await axios.get(url, {
      headers: {
        'Accept-Language':language,
      }
    });


    data =  PublicExperiencesResponse.data.map((experience: any) => serializePublicExperience(experience));

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
          toast.error(`${errorData?.error || "Error during Fetching the experiences."} (Code: ${statusCode})`);
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
