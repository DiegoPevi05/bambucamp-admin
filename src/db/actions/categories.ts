import {toast} from 'sonner';
import { ZodError } from 'zod';
import axios from 'axios';
import {  ProductCategory } from '../../lib/interfaces';
import { serializeCategoryProduct } from '../serializer';

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
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error((err.message));
      });
    } else {
      toast.error("Error trayendo last categorias de productos.");
      console.error(error);
    }
  }

  return data;
}



export const createProductCategory = async (productCategory: ProductCategory, token: string): Promise<void> => {
  try {

    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/categories/product`, productCategory, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (response.status === 201) {
      toast.success("Categoria de Producto creado exitosamente");
    } else {
      toast.error("Algo salió mal al crear la categoria producto.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error creando la categoria de producto."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error creando la categoria del producto.");
      console.error(error);
    }
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
      toast.success("Categoria de producto actualizado exitosamente");
    } else {
      toast.error("Algo salió mal al actualizar la categoria del producto.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error actualizando la categoria del producto."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error actualizando la categoria de producto.");
      console.error(error);
    }
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
      toast.success("Categoria de producto borrado exitosamente");
    } else {
      toast.error("Algo salió mal al borrar la categoria de producto.");
    }
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        toast.error(err.message);
      });
    } else if (axios.isAxiosError(error)) {
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || "Error borrando la categoria de producto."}`);
      } else {
        toast.error("No se pudo conectar con el servidor.");
      }
    } else {
      toast.error("Error borrando la categoria producto.");
      console.error(error);
    }
  }

}

