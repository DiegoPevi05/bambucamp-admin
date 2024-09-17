import Dashboard from "../components/ui/Dashboard";
import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { Eye, Pen, X, ChevronLeft, ChevronRight, Pizza, CircleX, Image, RefreshCw } from "lucide-react";
import Button from "../components/ui/Button";
import { InputRadio } from "../components/ui/Input";
import {  formatDate, createImagesArray } from "../lib/utils";
import { getAllProducts, createProduct, deleteProduct, updateProduct } from "../db/actions/products";
import { getAllProductsCategory , createProductCategory, deleteProductCategory, updateProductCategory} from "../db/actions/categories";
import { useAuth } from "../contexts/AuthContext";
import { Product, ProductFilters, ProductFormData, ImageInterface, CustomPrice, ProductCategory } from "../lib/interfaces";
import { AnimatePresence, motion } from "framer-motion";
import {fadeIn, fadeOnly} from "../lib/motions";
import {  ZodError } from 'zod';
import { ProductSchema } from "../db/schemas";
import Modal from "../components/Modal";
import { toast } from "sonner";
import {useTranslation} from "react-i18next";


const DashboardAdminProducts = () => {

    const {t,i18n} = useTranslation();
    const { user } = useAuth();
    const [datasetProducts,setDataSetProducts] = useState<{products:Product[],totalPages:Number,currentPage:Number}>({products:[],totalPages:1,currentPage:1});
    const [datasetProductsCategory, setDatasetProductsCategory] = useState<ProductCategory[]>([]);
    const [currentView,setCurrentView] = useState<string>("LOADING");

    useEffect(()=>{
        getProductsHandler(1);
        getProductsCategory();
    },[])

    const getProductsCategory = async() => {
      if(user != null){
          const categories  = await getAllProductsCategory(user.token);
          if(categories){
              setDatasetProductsCategory(categories);
          }
      }
    }

    const getProductsHandler = async (page:Number, filters?:ProductFilters) => {
        setCurrentView("LOADING");
        if(user != null){
            const products  = await getAllProducts(user.token,page,i18n.language,filters);
            if(products){
                setDataSetProducts(products);
                setCurrentView("L");
            }
        }
    }

    const [loadingForm, setLoadingForm] = useState<boolean>(false);

    const [images, setImages] = useState<ImageInterface[]>([]);
    const [existingImages,setExistingImages] = useState<string[]>([]);

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages: ImageInterface[] = createImagesArray(files);
      setImages(prevImages => [...prevImages, ...newImages]);
      e.target.value = ''; // Resetear el input file
    }
    };

    const handleRemoveExistingImage = (url: string) => {
      setExistingImages(prevExistantImages => prevExistantImages.filter(existantImage => existantImage !== url));
    };

    const handleRemoveImage = (url: string) => {
      setImages(prevImages => prevImages.filter(image => image.url !== url));
    };


    const [customPrices, setCustomPrices] = useState<CustomPrice[]>([]);

    const handleAddCustomPrice = (formName:string) => {
      const form = document.getElementById(formName) as HTMLFormElement;
      const dateFromInput = form.querySelector('input[name="custom_price_date_from"]') as HTMLInputElement;
      const dateToInput = form.querySelector('input[name="custom_price_date_to"]') as HTMLInputElement;
      const priceInput = form.querySelector('input[name="custom_price_value"]') as HTMLInputElement;

      const dateFrom = new Date(dateFromInput.value);
      const dateTo = new Date(dateToInput.value);
      const price = parseFloat(priceInput.value);

      if (!isNaN(dateFrom.getTime()) && !isNaN(dateTo.getTime()) && !isNaN(price)) {
        dateFrom.setHours(12, 0, 0, 0);
        dateTo.setHours(12, 0, 0, 0);

        if(dateFrom > dateTo){
          toast.error(t("product.validations.start_date_lower_than_end_date"));
          return;
        };   

        const newCustomPrice: CustomPrice = { dateFrom, dateTo, price };
        setCustomPrices([...customPrices, newCustomPrice]);

        // Clear input fields
        dateFromInput.value = '';
        dateToInput.value = '';
        priceInput.value = '';
      } else {
        // Handle invalid input
        toast.error(t("product.validations.input_valid_date"));
      }
    };

    const handleRemoveCustomPrice = (index: number) => {
      setCustomPrices(customPrices.filter((_, i) => i !== index));
    };

    const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

    const validateFields = (formname:string): ProductFormData |null => {
        const form = document.getElementById(formname) as HTMLFormElement;
        const categoryId  = Number((form.querySelector('select[name="categoryId"]') as HTMLInputElement).value); 
        const name = (form.querySelector('input[name="name"]') as HTMLInputElement).value;
        const description = (form.querySelector('textarea[name="description"]') as HTMLTextAreaElement).value;
        const price = Number((form.querySelector('input[name="price"]') as HTMLInputElement).value);
        const stock = Number((form.querySelector('input[name="stock"]') as HTMLInputElement).value);
        const status = (form.querySelector('select[name="status"]') as HTMLInputElement).value;

        setErrorMessages({});

        try {
          ProductSchema.parse({categoryId, name, description, existing_images:existingImages,images: images.map(image => image.file),  status, stock, price, custom_price:customPrices });

          return {
            categoryId,
            name,
            description,
            price,
            stock,
            status,
            custom_price:JSON.stringify(customPrices),
            images: images.map(image => image.file)
          };
        } catch (error) {
          if (error instanceof ZodError) {
            const newErrorMessages: Record<string, string> = {};
            error.errors.forEach(err => {
              const fieldName = err.path[0] as string;
              newErrorMessages[fieldName] = err.message;
            });
            setErrorMessages(newErrorMessages);
          }
          return null;
        }
    };

    const onSubmitCreation = async (e: FormEvent) => {
        e.preventDefault();
        setLoadingForm(true);
        const fieldsValidated = validateFields('form_create_product');
        if(fieldsValidated != null){
          if(user !== null){
            const isSuccess = await createProduct(fieldsValidated, user.token, i18n.language);
            if(!isSuccess){
              setLoadingForm(false);
              return;
            }
          }
          getProductsHandler(1);
          setImages([]);
          setCurrentView("L")
        }
        setLoadingForm(false);
    };


    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);

    const [selectedProduct, setSelectedProduct] = useState<Product|null>(null);

    const searchProductHandler = async() => {
        // Get the input value
        const searchValue = (document.querySelector('input[name="criteria_search_value"]') as HTMLInputElement).value.trim();

        // Get the selected criteria from radio buttons
        const selectedCriteria = (
        document.querySelector('input[name="criteria_search"]:checked') as HTMLInputElement
        )?.value;

        // Get the selected role from the select dropdown
        const selectedStatus = (document.querySelector('select[name="criteria_search_status"]') as HTMLSelectElement).value;


        // Construct filters based on input values and selected criteria
        const filters: ProductFilters = {};
        if (selectedCriteria && searchValue) {
            filters[selectedCriteria as keyof ProductFilters] = searchValue;
        }

        if (selectedStatus) {
            filters.status = selectedStatus;
        }

        getProductsHandler(1,filters);
    }

    const deleteProductHandler = async() => {
        if(user != null && selectedProduct != null){
            const isSuccess = await deleteProduct(selectedProduct.id,user.token, i18n.language)
            if(!isSuccess){
              return;
            }
        }
        getProductsHandler(1);
        setOpenDeleteModal(false);
    }

    const onChangeSelectedProduct = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const fieldValue = value;

        setSelectedProduct(prevSelectedProduct => {
            if(!prevSelectedProduct) return null;
            return {
                ...prevSelectedProduct,
                [name]: fieldValue,
            };
        });
    };

    const onSubmitUpdate = async (e: FormEvent) => {
        e.preventDefault();
        setLoadingForm(true);
        const fieldsValidated = validateFields('form_update_product');
        if(fieldsValidated != null){
          fieldsValidated.existing_images = JSON.stringify(existingImages);
          if(user !== null && selectedProduct != null){
              const isSuccess = await updateProduct(selectedProduct.id,fieldsValidated, user.token, i18n.language);
              if(!isSuccess){
                setLoadingForm(false);
                return;
              }
          }
          setImages([]);
          getProductsHandler(1);
          setCurrentView("L")
        }
        setLoadingForm(false);
    };


    const [openModalCategories, setOpenModalCategories] = useState<boolean>(false);
    const [selectedCategory,setSelectedCategory] = useState<ProductCategory|null>(null);
    const [loadingCategory,setLoadingCategory] = useState<boolean>(false);

    const onChangeSelectedCategory = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const fieldValue = value;

        setSelectedCategory(prevSelectedCategory => {
            if(!prevSelectedCategory) return null;
            return {
                ...prevSelectedCategory,
                [name]: fieldValue,
            };
        });
    };



    const onSubmitCreationCategory = async(e:FormEvent) => {
        e.preventDefault();
        setLoadingCategory(true);
        const form = document.getElementById("form_create_product_category") as HTMLFormElement;
        const category = (form.querySelector('input[name="category"]') as HTMLInputElement).value;

        if(category.length == 0){
          toast.error(t("product.validations.category_name"));
          return;
        };

        if(user !== null){
            const isSuccess = await createProductCategory(category, user.token);
            if(!isSuccess){
              setLoadingCategory(false);
              return;
            }
            getProductsCategory();
        }
        setLoadingCategory(false);
    }

    const onSubmitUpdateCategory = async () => {
        setLoadingCategory(true);
        if(user !== null && selectedCategory != null){
            const isSuccess = await updateProductCategory(selectedCategory.id,selectedCategory, user.token);
            if(!isSuccess){
              setLoadingCategory(false);
              return;
            }
            getProductsCategory();
        }
        setLoadingCategory(false);
        setSelectedCategory(null);
    };

    const deleteProductCategoryHandler = async(idCategory:number) => {
        setLoadingCategory(true);
        if(user != null){
            const isSuccess = await deleteProductCategory(idCategory,user.token)
            if(!isSuccess){
              setLoadingCategory(false);
              return;
            }
            getProductsCategory();
        }
        setLoadingCategory(false);
    }





    return (
    <Dashboard>
        <AnimatePresence>
        {currentView == "LOADING" && (
            <motion.div 
                key={"Loading-View"}
                initial="hidden"
                animate="show"
                exit="hidden"
                viewport={{ once: true }}
                variants={fadeIn("up","",0.5,0.3)}
                className="w-full min-h-[300px] flex flex-col justify-center items-center gap-y-4 bg-white pointer-events-none">
                  <div className="loader"></div>
                  <h1 className="font-primary text-secondary mt-4">{t("common.loading")}</h1>
            </motion.div>
        )}

        {currentView == "L" && (
            <>

                <motion.div 
                    key={"List-View"}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    viewport={{ once: true }}
                    variants={fadeIn("up","",0.5,0.3)}
                    className="w-full h-auto flex flex-col justify-start items-start gap-y-4">
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><Pizza/>{t("product.plural")}</h2>
                  <div className="w-full h-auto flex flex-col xl:flex-row justify-start xl:justify-between items-center gap-x-4">
                    <div className="w-full xl:w-auto h-auto flex flex-col md:flex-row justify-start md:justify-between xl:justify-start items-start gap-y-4 gap-x-4">
                          <div className="max-xl:w-[50%] flex flex-col md:flex-row items-start md:items-center gap-x-2">
                            <input 
                              type="text" 
                              name="criteria_search_value"
                              placeholder={t("product.search_product")}
                              className="w-full xl:w-96 h-8 text-xs font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-primary"
                            />
                            <InputRadio name="criteria_search" variant="light" isRound={true} value="title" placeholder="Nombre"/>
                          </div>
                          <div className="max-xl:w-[50%] flex flex-col md:flex-row items-start md:items-center gap-x-2">
                            <label className="max-xl:w-full md:ml-4 flex items-center">
                                {t("product.status")}
                                <select name="criteria_search_status" className="w-full ml-2 h-8 text-xs font-tertiary border-b-2 border-secondary focus:outline-none focus:border-b-primary">
                                  <option value="">{t("product.status")}</option>
                                  <option value="ACTIVE">{t("product.ACTIVE")}</option>
                                  <option value="INACTIVE">{t("product.INACTIVE")}</option>
                                </select>
                              </label>
                              <Button variant="ghostLight" isRound={true} effect="default" className="md:ml-4 mt-4 md:mt-0" onClick={()=>searchProductHandler()}>
                                {t("common.search")}
                            </Button>
                          </div>
                        </div>
                    <div className="w-full xl:w-auto h-auto flex flex-row justify-between xl:justify-end items-start gap-y-4 gap-x-4 max-xl:mt-4">
                      <div className="w-auto xl:w-full h-10 flex justify-end">
                              <button
                                type="button"
                                onClick={()=>setOpenModalCategories(true)}
                                className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-primary hover:text-white rounded-xl duration-300 hover:border-primary"
                              >
                                {t("product.categories")}
                              </button>
                            </div>
                            <Button onClick={()=>{setCurrentView("A"); setImages([]); setExistingImages([])}} size="sm" variant="dark" effect="default" className="min-w-[200px]" isRound={true}>{t("product.add_product")} <Pizza/></Button>
                        </div>
                    </div>
                    <table className="h-full w-full shadow-xl rounded-xl text-center p-4">
                      <thead className="font-primary text-sm xl:text-md bg-primary text-white">
                            <tr className="">
                                <th className="rounded-tl-xl p-2">#</th>
                                <th className="p-2">{t("product.category")}</th>
                                <th className="p-2">{t("product.name")}</th>
                                <th className="p-2">{t("product.price")}</th>
                                <th className="p-2">{t("product.images")}</th>
                                <th className="p-2">{t("product.stock")}</th>
                                <th className="p-2">{t("product.status")}</th>
                                <th className="p-2 max-xl:hidden">{t("product.created")}</th>
                                <th className="p-2 max-xl:hidden">{t("product.updated")}</th>
                                <th className="rounded-tr-xl p-2">{t("product.actions")}</th>
                            </tr>
                        </thead>
                      <tbody className="font-secondary text-xs xl:text-sm">
                                {datasetProducts.products.map((productItem,index)=>{
                                    return(
                                    <tr key={"user_key"+index} className="text-slate-400 hover:bg-secondary hover:text-white duration-300 cursor-pointer"> 
                                        <td className="">{productItem.id}</td>
                                        <td className="">{productItem.category.name}</td>
                                        <td className="">{productItem.name}</td>
                                        <td className="">{productItem.price}</td>
                                        <td className="flex flex-row flex-wrap items-start justify-start gap-2">
                                          {productItem.images.map((img, index) => (
                                            <a key={index} href={`${img}`} target="_blank">
                                              <Image className="hover:text-tertiary duration-300"/>
                                            </a>
                                          ))}
                                        </td>
                                        <td className="">{productItem.stock}</td>
                                        <td className="h-full">{productItem.status != "ACTIVE" ? t("product.INACTIVE") : t("product.ACTIVE") }</td>
                                      <td className="h-full max-xl:hidden">{productItem.updatedAt != undefined && productItem.updatedAt != null ? formatDate(productItem.updatedAt) : t("product.none")}</td>
                                      <td className="h-full max-xl:hidden">{productItem.createdAt != undefined && productItem.createdAt != null ? formatDate(productItem.createdAt) : t("product.none")}</td>
                                        <td className="h-full flex flex-col items-center justify-center">
                                          <div className="w-full h-auto flex flex-row flex-wrap gap-x-2">
                                            <button onClick={()=>{setSelectedProduct(productItem); setCurrentView("V")}} className="border rounded-md hover:bg-primary hover:text-white duration-300 active:scale-75 p-1"><Eye className="h-5 w-5"/></button>
                                            <button  onClick={()=>{setSelectedProduct(productItem);  setExistingImages(productItem.images) ; setImages([]); setCurrentView("E")}} className="border rounded-md hover:bg-primary hover:text-white duration-300 active:scale-75 p-1"><Pen className="h-5 w-5"/></button>
                                            <button onClick={()=>{setOpenDeleteModal(true),setSelectedProduct(productItem)}} className="border rounded-md hover:bg-red-400 hover:text-white duration-300 active:scale-75 p-1"><X className="h-5 w-5"/></button>
                                          </div>
                                        </td>
                                    </tr>
                                    )
                                })}
                        </tbody>
                    </table>
                    <div className="flex flex-row justify-between w-full">
                        <Button onClick={ () => getProductsHandler( Number(datasetProducts.currentPage) - 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={datasetProducts.currentPage == 1}> <ChevronLeft/>  </Button>
                        <Button onClick={ () => getProductsHandler( Number(datasetProducts.currentPage) + 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={datasetProducts.currentPage >= datasetProducts.totalPages}> <ChevronRight/> </Button>
                    </div>
                </motion.div>

                <Modal isOpen={openDeleteModal} onClose={()=>setOpenDeleteModal(false)}>
                    <div className="w-[400px] h-auto flex flex-col items-center justify-center text-secondary pb-6 px-6 pt-12 text-center">
                        <CircleX className="h-[60px] w-[60px] text-red-400 "/>
                        <p className="text-primary">{t("product.secure_delete_product_header")}</p>
                        <p className="text-sm mt-6 text-secondary">{t("product.secure_delete_product_description")}</p>
                        <div className="flex flex-row justify-around w-full mt-6">
                            <Button size="sm" variant="dark" effect="default" isRound={true} onClick={()=>setOpenDeleteModal(false)}>{t("common.cancel")}</Button>
                            <Button size="sm" variant="danger" effect="default" isRound={true} onClick={()=>{deleteProductHandler()}}>{t("common.accept")}</Button>
                        </div>
                    </div>
                </Modal>

              <Modal isOpen={openModalCategories} onClose={()=>setOpenModalCategories(false)}>
                  <div className="w-[600px] h-auto flex flex-col items-center justify-center text-secondary pb-6 px-6 pt-12 text-center">
                    {loadingCategory ? 
                      <>
                        <div className="loader"></div>
                        <h1 className="font-primary text-white mt-4">{t("common.loading")}</h1>
                      </>
                    :
                    <>
                      <form id="form_create_product_category" className="h-auto w-full flex flex-row items-end justify-between gap-x-2" onSubmit={(e)=>onSubmitCreationCategory(e)}>
                        <div className="flex flex-col items-start justify-start w-full">
                          <label htmlFor="category" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.new_category")}</label>
                            <input name="category" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("product.category_name")}/>
                        </div>
                        <div className="flex flex-col items-center justify-center w-auto h-auto">
                          <button
                            type="submit"
                            className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-primary hover:text-white rounded-md duration-300 hover:border-primary h-8 w-8 flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </form>
                      <div className="mt-12 h-[200px] w-full flex flex-col justify-start items-start overflow-y-scroll gap-y-2">
                        <label htmlFor="category" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.categories")}</label>
                        { datasetProductsCategory.map((category,index)=>{
                          return(
                            <div key={"category_product"+index} className="w-[90%] h-auto flex flex-row items-center justify-center border border-2 border-slate-200 rounded-md p-2 mx-auto">
                              <div className="flex flex-col items-center justify-center w-full">
                                {selectedCategory?.id == category.id ?
                                  <input name="name" value={selectedCategory.name} onChange={(e)=>onChangeSelectedCategory(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("product.category_name")}/>
                                :
                                <label className="w-full text-left text-sm">{category.name}</label>
                                }
                              </div>
                              <div className="flex flex-row items-center justify-center w-auto gap-x-2">
                                {selectedCategory?.id == category.id ? 
                                  <button
                                    onClick={()=>{onSubmitUpdateCategory()}}
                                    type="button"
                                    className="border-2 border-slate-200 active:scale-95 hover:bg-primary hover:text-white rounded-md duration-300 hover:border-primary h-8 w-8 flex items-center justify-center"
                                  >
                                    <RefreshCw className="w-4 h-4"/>
                                  </button>
                                :
                                  <button
                                    onClick={()=>setSelectedCategory(category)}
                                    type="button"
                                    className="border-2 border-slate-200 active:scale-95 hover:bg-primary hover:text-white rounded-md duration-300 hover:border-primary h-8 w-8 flex items-center justify-center"
                                  >
                                    <Pen className="w-4 h-4"/>
                                  </button>
                                }
                                <button
                                  type="button"
                                  onClick={()=>deleteProductCategoryHandler(category.id)}
                                  className="border-2 border-slate-200 active:scale-95 hover:bg-primary hover:text-white rounded-md duration-300 hover:border-primary h-8 w-8 flex items-center justify-center"
                                >
                                  <X className="w-4 h-4"/>
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>

                    }
                  </div>
              </Modal>
            </>

        )}

        {currentView == "V" && selectedProduct && (
                <motion.div 
                    key={"View"}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    viewport={{ once: true }}
                    variants={fadeIn("up","",0.5,0.3)}
                    className="w-full h-auto flex flex-col justify-start items-start gap-y-4">
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><Pizza/>{t("product.see_product")}</h2>

                  <div className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" >

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%] h-full">

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="categoryId" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_category")}</label>

                                <select name="categoryId" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                                  <option value={selectedProduct.category.id}>{selectedProduct.category.name}</option>
                                </select>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="name" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_name")}</label>
                            <input name="name" value={selectedProduct.name} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("product.product_name")} />
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="description" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_description")}</label>
                            <textarea name="description" className="w-full h-8 sm:h-24 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary mt-2" placeholder={t("product.product_description")}>{ selectedProduct.description }</textarea>
                          </div>

                          <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="price" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_price")}</label>
                              <input name="price" value={selectedProduct.price} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("product.product_price")} />
                            </div>

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="stock" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_stock")}</label>
                              <input name="stock" value={selectedProduct.stock} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("product.product_stock")} />
                            </div>
                          </div>


                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                            <label htmlFor="price" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_custom_price")}</label>
                            <div className="w-full h-auto flex flex-col items-start justify-start">
                              <AnimatePresence>
                                {selectedProduct.custom_price.map((price, index) => (
                                          <motion.div
                                            key={index}
                                            initial="hidden"
                                            animate="show"
                                            exit="hidden"
                                            viewport={{ once: true }}
                                            variants={fadeIn("up","",0,0.3)}
                                            className="w-full h-auto flex flex-row justify-between items-center rounded-xl border border-slate-200 px-4 py-2 my-2 text-sm"
                                          >
                                            <span className="w-[30%]">
                                              {t("product.product_custom_price_from")}: <label className="text-tertiary ml-2 text-xs">{formatDate(price.dateFrom)}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              {t("product.product_custom_price_to")}: <label className="text-tertiary ml-2 text-xs">{formatDate(price.dateTo)}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              {t("product.product_custom_price_price")}: <label className="text-tertiary ml-2">S/{price.price.toFixed(2)}</label>
                                            </span>
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>

                          </div>
                      </div>

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%]">

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="status" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.status")}</label>
                            <select name="status" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                              <option value={selectedProduct.status}>{selectedProduct.status == "ACTIVE" ? t("product.ACTIVE") : t("product.INACTIVE")}</option>
                            </select>
                          </div>
                          
                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="image" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_images")}</label>
                              <div className="flex flex-row flex-wrap justify-start items-start w-full h-auto p-4 gap-6">
                                <AnimatePresence>
                                  {selectedProduct.images.map((image, index) => (
                                    <motion.div
                                      key={index}
                                      initial="hidden"
                                      animate="show"
                                      exit="hidden"
                                      viewport={{ once: true }}
                                      variants={fadeOnly("",0,0.3)}
                                      className="image-selected"
                                      style={{
                                        backgroundImage: `url(${image})`,
                                        backgroundSize: 'cover',
                                        position: 'relative'
                                      }}
                                    >
                                    </motion.div>
                                  ))}
                                </AnimatePresence>
                              </div>
                          </div>

                          <div className="flex flex-row justify-end gap-x-6 w-full">
                              <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>{t("product.go_back_products_list")}</Button>
                          </div>

                      </div>
                    </div>
                </motion.div>
        )}




        {currentView == "A" && (
            <motion.div 
                key={"New-View"}
                initial="hidden"
                animate="show"
                exit="hidden"
                viewport={{ once: true }}
                variants={fadeIn("up","",0.5,0.3)}
                className="w-full h-auto flex flex-col justify-start items-start gap-y-4">
                <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><Pizza/>{t("product.add_product")}</h2>

              <form id="form_create_product" className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" onSubmit={(e)=>onSubmitCreation(e)}>

                <div className="flex flex-col justify-start items-start w-full lg:w-[50%] h-full">

                  <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="categoryId" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_category")}</label>

                        <select name="categoryId" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                          { datasetProductsCategory.map((category,index)=>{
                            return(
                              <option key={index} value={category.id}>{category.name}</option>
                            )
                          })}
                        </select>

                        <div className="w-full h-6">
                          {errorMessages.categoryId && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {t(errorMessages.categoryId)}
                            </motion.p>
                          )}
                        </div>
                  </div>


                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="name" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_name")}</label>
                        <input name="name" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("product.product_name")}/>
                        <div className="w-full h-6">
                          {errorMessages.name && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {t(errorMessages.name)}
                            </motion.p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="description" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_description")}</label>
                        <textarea name="description" className="w-full h-8 sm:h-24 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary mt-2" placeholder={t("product.product_description")}/>
                        <div className="w-full h-6">
                          {errorMessages.description && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {t(errorMessages.description)}
                            </motion.p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                        <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                          <label htmlFor="price" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_price")}</label>
                          <input name="price" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"product.product_price"}/>

                          <div className="w-full h-6">
                            {errorMessages.price && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {t(errorMessages.price)}
                              </motion.p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                          <label htmlFor="stock" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_stock")}</label>
                          <input name="stock" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("product.product_stock")}/>

                          <div className="w-full h-6">
                            {errorMessages.stock && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {t(errorMessages.stock)}
                              </motion.p>
                            )}
                          </div>
                        </div>

                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                        <label htmlFor="price" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_custom_price")}</label>
                        <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-[25%] h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="custom_price_date_from" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_custom_price_from")}</label>
                              <input name="custom_price_date_from" type="date" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("product.product_custom_price_from")}/>
                            </div>

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-[25%] h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="custom_price_date_to" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_custom_price_to")}</label>
                              <input name="custom_price_date_to" type="date" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("product.product_custom_price_to")}/>
                            </div>

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-[25%] h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="custom_price_value" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_custom_price_price")}</label>
                              <input name="custom_price_value" type="number" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("product.product_custom_price_price")}/>
                            </div>
                          <Button onClick={()=>handleAddCustomPrice("form_create_product")} size="sm" type="button" variant="dark" effect="default" isRound={true} className="w-[10%] my-auto">+</Button>
                        </div>
                        <div id="tent_create_container_custom_prices flex flex-col items-start justify-start"className="w-full h-auto">
                          <AnimatePresence>
                            {customPrices.map((price, index) => (
                                      <motion.div
                                        key={index}
                                        initial="hidden"
                                        animate="show"
                                        exit="hidden"
                                        viewport={{ once: true }}
                                        variants={fadeIn("up","",0,0.3)}
                                        className="w-full h-auto flex flex-row justify-between items-center rounded-xl border border-slate-200 px-4 py-2 my-2 text-sm"
                                      >
                                        <span className="w-[30%]">
                                          {t("product.product_custom_price_from")}: <label className="text-tertiary ml-2 text-xs">{formatDate(price.dateFrom)}</label>
                                        </span>
                                        <span className="w-[30%]">
                                          {t("product.product_custom_price_to")}: <label className="text-tertiary ml-2 text-xs">{formatDate(price.dateTo)}</label>
                                        </span>
                                        <span className="w-[30%]">
                                          {t("product.product_custom_price_price")}: <label className="text-tertiary ml-2">S/{price.price.toFixed(2)}</label>
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveCustomPrice(index)}
                                          className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-red-400 hover:text-white rounded-xl duration-300 hover:border-red-400"
                                        >
                                          {t("product.product_custom_price_delete_btn")}
                                        </button>
                                      </motion.div>
                                    ))}
                          </AnimatePresence>
                        </div>

                        <div className="w-full h-6">
                          {errorMessages.customPrices && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {t(errorMessages.customPrices)}
                            </motion.p>
                          )}
                        </div>

                      </div>

                  </div>

                <div className="flex flex-col justify-start items-start w-full lg:w-[50%]">

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="status" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.status")}</label>
                        <select name="status" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                          <option value="ACTIVE">{t("product.ACTIVE")}</option>
                          <option value="INACTIVE">{t("product.INACTIVE")}</option>
                        </select>

                        <div className="w-full h-6">
                          {errorMessages.status && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {t(errorMessages.status)}
                            </motion.p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="image" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_images")}</label>
                          <div className="flex flex-row flex-wrap justify-start items-start w-full h-auto p-4 gap-6">
                            <AnimatePresence>
                              {images.map((image, index) => (
                                <motion.div
                                  key={index}
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  viewport={{ once: true }}
                                  variants={fadeOnly("",0,0.3)}
                                  className="image-selected"
                                  style={{
                                    backgroundImage: `url(${image.url})`,
                                    backgroundSize: 'cover',
                                    position: 'relative'
                                  }}
                                >
                                  <button
                                    type="button"
                                    className="delete-image-selected"
                                    onClick={() => handleRemoveImage(image.url)}
                                  >
                                    X
                                  </button>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                            <div className="file-select" id="src-tent-image" >
                              <input type="file" name="src-tent-image" aria-label="Archivo" onChange={handleImageChange} multiple/>
                            </div>


                          </div>
                          <div className="w-full h-6">
                            {errorMessages.images && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {t(errorMessages.images)}
                              </motion.p>
                            )}
                          </div>
                      </div>

                      <div className="flex flex-row justify-end gap-x-6 w-full">
                          <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>{t("common.cancel")}</Button>
                          <Button type="submit" size="sm" variant="dark" effect="default" isRound={true} isLoading={loadingForm}>{t("product.create_product")}</Button>
                      </div>

                  </div>
                </form>
            </motion.div>
        )}

        {currentView === "E" && selectedProduct && (
                <motion.div 
                    key={"Edit-View"}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    viewport={{ once: true }}
                    variants={fadeIn("up","",0.5,0.3)}
                    className="w-full h-auto flex flex-col justify-start items-start gap-y-4">
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><Pizza/>{t("product.edit_product")}</h2>

                  <form id="form_update_product" className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" onSubmit={(e)=>onSubmitUpdate(e)}>

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%] h-full">

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="categoryId" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_category")}</label>
                                <select name="categoryId" onChange={(e)=>onChangeSelectedProduct(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                                  { datasetProductsCategory.map((category,index)=>{
                                    return(
                                      <option key={index} value={category.id} selected={category.id == selectedProduct.category.id}>{category.name}</option>
                                    )
                                  })}
                                </select>
                                <div className="w-full h-6">
                                  {errorMessages.categoryId && (
                                    <motion.p 
                                      initial="hidden"
                                      animate="show"
                                      exit="hidden"
                                      variants={fadeIn("up","", 0, 1)}
                                      className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                      {t(errorMessages.categoryId)}
                                    </motion.p>
                                  )}
                                </div>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="name" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_name")}</label>
                            <input name="name" value={selectedProduct.name}  onChange={(e)=>onChangeSelectedProduct(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("product.product_name")}/>
                            <div className="w-full h-6">
                              {errorMessages.name && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {t(errorMessages.name)}
                                </motion.p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="description" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_description")}</label>
                            <textarea name="description"  onChange={(e)=>onChangeSelectedProduct(e)} className="w-full h-8 sm:h-24 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary mt-2" placeholder={t("product.product_description")}>{selectedProduct.description}</textarea>
                            <div className="w-full h-6">
                              {errorMessages.description && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {t(errorMessages.description)}
                                </motion.p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="price" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_price")}</label>
                              <input name="price" value={selectedProduct.price}  onChange={(e)=>onChangeSelectedProduct(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("product.product_price")}/>

                              <div className="w-full h-6">
                                {errorMessages.price && (
                                  <motion.p 
                                    initial="hidden"
                                    animate="show"
                                    exit="hidden"
                                    variants={fadeIn("up","", 0, 1)}
                                    className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                    {t(errorMessages.price)}
                                  </motion.p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">

                              <label htmlFor="stock" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_stock")}</label>
                              <input name="stock" value={selectedProduct.stock}  onChange={(e)=>onChangeSelectedProduct(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("product.product_stock")}/>

                              <div className="w-full h-6">
                                {errorMessages.stock && (
                                  <motion.p 
                                    initial="hidden"
                                    animate="show"
                                    exit="hidden"
                                    variants={fadeIn("up","", 0, 1)}
                                    className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                    {t(errorMessages.stock)}
                                  </motion.p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                            <label htmlFor="price" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_custom_price")}</label>
                            <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                                <div className="flex flex-col justify-start itemst-start gap-x-6 w-[25%] h-auto gap-y-2 sm:gap-y-1">
                                  <label htmlFor="custom_price_date_from" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_custom_price_from")}</label>
                                  <input name="custom_price_date_from" type="date" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("product.product_custom_price_from")}/>
                                </div>

                                <div className="flex flex-col justify-start itemst-start gap-x-6 w-[25%] h-auto gap-y-2 sm:gap-y-1">
                                  <label htmlFor="custom_price_date_to" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_custom_price_to")}</label>
                                  <input name="custom_price_date_to" type="date" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("product.product_custom_price_to")}/>
                                </div>

                                <div className="flex flex-col justify-start itemst-start gap-x-6 w-[25%] h-auto gap-y-2 sm:gap-y-1">
                                  <label htmlFor="custom_price_value" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_custom_price_price")}</label>
                                  <input name="custom_price_value" type="number" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("product.product_custom_price_price")}/>
                                </div>
                                <Button onClick={()=>handleAddCustomPrice("form_update_product")} size="sm" type="button" variant="dark" effect="default" isRound={true} className="w-[10%] my-auto">+</Button>
                            </div>
                            <div id="tent_create_container_custom_prices flex flex-col items-start justify-start"className="w-full h-auto">
                              <AnimatePresence>
                                {customPrices.map((price, index) => (
                                          <motion.div
                                            key={index}
                                            initial="hidden"
                                            animate="show"
                                            exit="hidden"
                                            viewport={{ once: true }}
                                            variants={fadeIn("up","",0,0.3)}
                                            className="w-full h-auto flex flex-row justify-between items-center rounded-xl border border-slate-200 px-4 py-2 my-2 text-sm"
                                          >
                                            <span className="w-[30%]">
                                              {t("product.product_custom_price_from")}: <label className="text-tertiary ml-2 text-xs">{formatDate(price.dateFrom)}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              {t("product.product_custom_price_to")}: <label className="text-tertiary ml-2 text-xs">{formatDate(price.dateTo)}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              {t("product.product_custom_price_price")}: <label className="text-tertiary ml-2">S/{price.price.toFixed(2)}</label>
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveCustomPrice(index)}
                                              className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-red-400 hover:text-white rounded-xl duration-300 hover:border-red-400"
                                            >
                                              {t("product.product_custom_price_delete_btn")}
                                            </button>
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>
                            <div className="w-full h-6">
                              {errorMessages.customPrices && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {t(errorMessages.customPrices)}
                                </motion.p>
                              )}
                            </div>
                          </div>
                      </div>

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%]">

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="status" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.status")}</label>
                            <select name="status" onChange={(e)=>onChangeSelectedProduct(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                              <option value="ACTIVE" selected={selectedProduct.status == "ACTIVE"}>{t("product.ACTIVE")}</option>
                              <option value="INACTIVE" selected={selectedProduct.status == "INACTIVE"}>{t("product.INACTIVE")}</option>
                            </select>
                            <div className="w-full h-6">
                              {errorMessages.status && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {t(errorMessages.status)}
                                </motion.p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="image" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("product.product_images")}</label>
                              <div className="flex flex-row flex-wrap justify-start items-start w-full h-auto p-4 gap-6">
                                <AnimatePresence>
                                  {existingImages.map((image, index) => (
                                    <motion.div
                                      key={"ExistantImage"+index}
                                      initial="hidden"
                                      animate="show"
                                      exit="hidden"
                                      viewport={{ once: true }}
                                      variants={fadeOnly("",0,0.3)}
                                      className="image-selected"
                                      style={{
                                        backgroundImage: `url(${image})`,
                                        backgroundSize: 'cover',
                                        position: 'relative'
                                      }}
                                    >
                                      <button
                                        type="button"
                                        className="delete-image-selected"
                                        onClick={() => handleRemoveExistingImage(image)}
                                      >
                                        X
                                      </button>
                                    </motion.div>
                                  ))}
                                  {images.map((image, index) => (
                                    <motion.div
                                      key={"FilesImages"+index}
                                      initial="hidden"
                                      animate="show"
                                      exit="hidden"
                                      viewport={{ once: true }}
                                      variants={fadeOnly("",0,0.3)}
                                      className="image-selected"
                                      style={{
                                        backgroundImage: `url(${image.url})`,
                                        backgroundSize: 'cover',
                                        position: 'relative'
                                      }}
                                    >
                                      <button
                                        type="button"
                                        className="delete-image-selected"
                                        onClick={() => handleRemoveImage(image.url)}
                                      >
                                        X
                                      </button>
                                    </motion.div>
                                  ))}
                                </AnimatePresence>
                                <div className="file-select" id="src-tent-image" >
                                  <input type="file" name="src-tent-image" aria-label="Archivo" onChange={handleImageChange} multiple/>
                                </div>

                              </div>
                              <div className="w-full h-6">
                                {errorMessages.images && (
                                  <motion.p 
                                    initial="hidden"
                                    animate="show"
                                    exit="hidden"
                                    variants={fadeIn("up","", 0, 1)}
                                    className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                    {t(errorMessages.images)}
                                  </motion.p>
                                )}
                              </div>
                          </div>

                          <div className="flex flex-row justify-end gap-x-6 w-full">
                              <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>{t("common.cancel")}</Button>
                              <Button type="submit" size="sm" variant="dark" effect="default" isRound={true} isLoading={loadingForm}>{t("product.save_changes")}</Button>
                          </div>

                      </div>
                    </form>
                </motion.div>
                )}

        </AnimatePresence>
    </Dashboard>
    )
}

export default DashboardAdminProducts;
