import {toast} from 'sonner';
import { ZodError } from 'zod';
import axios from 'axios';
import { Product, ProductFilters, ProductFormData } from '../../lib/interfaces';
import { serializeProduct, serializeProductToDB } from '../serializer';

export const getAllProducts = async( token: string, page:Number, filters?:ProductFilters ): Promise<{products:Product[], totalPages:Number ,currentPage:Number}|null> => {

  let data:{ products:Product[],totalPages:Number,currentPage:Number } | null = null;
  try{
    // Create a URLSearchParams object to construct the query string
    const params = new URLSearchParams();
    params.append('page', page.toString());

    // Append filters to the query parameters
    if (filters) {
      Object.keys(filters).forEach((key) => {
        if (filters[key as keyof ProductFilters]) {
          params.append(key, filters[key as keyof ProductFilters] as string);
        }
      });
    }

    // Construct the URL with query parameters
    const url = `${import.meta.env.VITE_BACKEND_URL}/products?${params.toString()}`;

    const fetchProducts = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    data = {
      products: fetchProducts.data.products.map((product: any) => serializeProduct(product)),
      currentPage: parseInt(fetchProducts.data.currentPage as string, 10),
      totalPages:parseInt(fetchProducts.data.totalPages as string, 10)
    }


  }catch(error){
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error((err.message));
      });
    } else {
      toast.error("Error trayendo los productos.");
      console.error(error);
    }
  }

  return data;
}



export const createProduct = async (product: ProductFormData, token: string): Promise<void> => {
  try {

    // Create a new FormData object
    const formData = serializeProductToDB(product);

    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/products`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    });

    if (response.status === 201) {
      toast.success("Producto creado exitosamente");
    } else {
      toast.error("Algo salió mal al crear el producto.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error creando el producto."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error creando el producto.");
      console.error(error);
    }
  }
};


export const updateProduct = async (productId:Number,tent: ProductFormData, token: string): Promise<void> => {
  try {
    // Create a new FormData object
    const formData = serializeProductToDB(tent,true);

    const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/products/${productId}`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      }
    });

    if (response.status === 200) {
      toast.success("Producto actualizado exitosamente");
    } else {
      toast.error("Algo salió mal al actualizar el producto.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error actualizando el producto."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error actualizando el producto.");
      console.error(error);
    }
  }
};



export const deleteProduct = async(idProduct:Number, token:string ):Promise<void> => {

  try {
    const response = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/products/${idProduct}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.status === 200) {
      toast.success("Producto borrado exitosamente");
    } else {
      toast.error("Algo salió mal al borrar el producto.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error borrando el producto."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error borrando el producto.");
      console.error(error);
    }
  }

}

