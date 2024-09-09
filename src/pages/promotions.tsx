import Dashboard from "../components/ui/Dashboard";
import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { Eye, Pen, X, ChevronLeft, ChevronRight, Disc, CircleX, Image, UserIcon, Blocks  } from "lucide-react";
import Button from "../components/ui/Button";
import { InputRadio } from "../components/ui/Input";
import {  formatDate, createImagesArray, formatToISODate, getTotalPromotionCalculated } from "../lib/utils";
import { getAllPromotions, getAllPromotionOptions, createPromotion, updatePromotion, deletePromotion } from "../db/actions/promotions";
import { useAuth } from "../contexts/AuthContext";
import { Promotion, ProductFilters, PromotionFormData, optionsPromotion, optTentPromotionDto, optProductPromotionDto, optExperiencePromotionDto, ImageInterface } from "../lib/interfaces";
import { AnimatePresence, motion } from "framer-motion";
import {fadeIn, fadeOnly} from "../lib/motions";
import {  ZodError } from 'zod';
import { PromotionSchema } from "../db/schemas";
import Modal from "../components/Modal";
import { toast } from "sonner";


const DashboardAdminPromotions = () => {

    const { user } = useAuth();
    const [datasetPromotions,setDataSetPromotions] = useState<{promotions:Promotion[],totalPages:Number,currentPage:Number}>({promotions:[],totalPages:1,currentPage:1});
    const [datasetPromotionsOptions, setDatasetPromotionsOptions] = useState<optionsPromotion>({ tents:[], products:[], experiences:[] });
    const [idTents,setIdTents] = useState<optTentPromotionDto[]>([]);
    const [idProducts,setIdProducts] = useState<optProductPromotionDto[]>([]);
    const [idExperiences,setIdExperiences] = useState<optExperiencePromotionDto[]>([]);

    const [currentView,setCurrentView] = useState<string>("LOADING");

    useEffect(()=>{
        getPromotionsHandler(1);
        getPromotionsOptions();
    },[])

    const getPromotionsOptions = async() => {
      if(user != null){
          const PromotionOptions  = await getAllPromotionOptions(user.token);
          if(PromotionOptions){
              setDatasetPromotionsOptions(PromotionOptions);
          }
      }
    }

    const getPromotionsHandler = async (page:Number, filters?:ProductFilters) => {
        setCurrentView("LOADING");
        if(user != null){
            const promotions  = await getAllPromotions(user.token,page,filters);
            console.log(promotions)
            if(promotions){
                setDataSetPromotions(promotions);
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



    const handleAddPromotionOption = (formName:string, type:string) => {
      const form = document.getElementById(formName) as HTMLFormElement;
      const optionInput = form.querySelector(`select[name="promotion_option_${type}_id"]`) as HTMLSelectElement;
      const quantityInput = form.querySelector(`input[name="promotion_option_${type}_qty"]`) as HTMLInputElement;

      if (!optionInput || !quantityInput) {
        console.error(`Option input or quantity input not found.`);
        return;
      }

      const id = Number(optionInput.value);
      const quantity = Number(quantityInput.value);

      if (isNaN(id) || isNaN(quantity) || quantity <= 0 || !id ) {
        toast.error("Marca una opcion valida");
        return;
      }


      let data:any = null;
      let label:string|null = null;
      let price:number = 0;

      if(type == "tent"){
        data = datasetPromotionsOptions.tents.find((i)=> i.id == id);
        label = data.title;
        price = data.price;
      }else if(type == "product"){
        data = datasetPromotionsOptions.products.find((i)=> i.id == id);
        label = data.name;
        price = data.price;
      }else if(type == "experience"){
        data = datasetPromotionsOptions.experiences.find((i)=> i.id == id);
        label = data.name;
        price = data.price;
      } 

      if (data && label) {
        if(type =="tent") {
          setIdTents([...idTents, { idTent:id, name: label, quantity, price }]);
        }else if(type == "product"){
          setIdProducts([...idProducts, { idProduct:id, name:label, quantity, price }]);
        }else if(type =="experience"){
          setIdExperiences([...idExperiences, { idExperience:id, name:label, quantity, price }]);
        }
        // Clear input fields
        optionInput.value = '';
        quantityInput.value = '';
      } else {
        // Handle invalid input
        toast.error("Marca una opcion valida");
      }
      };

    const handleRemovePromotionOption = (index: number,type:string) => {
        if(type == "tent") setIdTents(idTents.filter((_,i)=> i !== index));
        if(type == "product") setIdProducts(idProducts.filter((_,i)=> i !== index));
        if(type == "experience") setIdExperiences(idExperiences.filter((_,i)=> i !== index))
    };


    const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

    const validateFields = (formname:string): PromotionFormData |null => {
        const form = document.getElementById(formname) as HTMLFormElement;
        const title = (form.querySelector('input[name="title"]') as HTMLInputElement).value;
        const description = (form.querySelector('textarea[name="description"]') as HTMLTextAreaElement).value;
        const status = (form.querySelector('select[name="status"]') as HTMLInputElement).value;
        const qtypeople = Number((form.querySelector('input[name="qtypeople"]') as HTMLInputElement).value);
        const qtykids = Number((form.querySelector('input[name="qtykids"]') as HTMLInputElement).value);
        const netImport = Number((form.querySelector('input[name="netImport"]') as HTMLInputElement).value);
        const discount = Number((form.querySelector('input[name="discount"]') as HTMLInputElement).value);
        const grossImport = Number((form.querySelector('input[name="grossImport"]') as HTMLInputElement).value);
        const expiredDate = new Date ((form.querySelector('input[name="expiredDate"]') as HTMLInputElement).value); 
        const stock = Number((form.querySelector('input[name="stock"]') as HTMLInputElement).value);


        setErrorMessages({});

        try {
          PromotionSchema.parse({title, description, existing_images:existingImages,images: images.map(image => image.file),  status, qtykids,qtypeople, netImport, discount, grossImport , stock,  tents:idTents, products:idProducts, experiences: idExperiences, expiredDate});

          return {
            title,
            description,
            qtypeople,
            qtykids,
            expiredDate,
            status,
            netImport,
            discount,
            grossImport,
            stock,
            tents: JSON.stringify(idTents),
            products: JSON.stringify(idProducts),
            experiences :JSON.stringify(idExperiences),
            images: images.map(image => image.file)
          };
        } catch (error) {
          console.log(error)
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
        const fieldsValidated = validateFields('form_create_promotion');
        if(fieldsValidated != null){
          if(user !== null){
            const isSuccess = await createPromotion(fieldsValidated, user.token);
            if(!isSuccess){
              setLoadingForm(false);
              return;
            }
          }
          getPromotionsHandler(1);
          setImages([]);
          setCurrentView("L")
        }
        setLoadingForm(false);
    };


    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);

    const [selectedPromotion, setSelectedPromotion] = useState<Promotion|null>(null);

    const searchExperienceHandler = async() => {
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

        getPromotionsHandler(1,filters);
    }

    const deletePromotionHandler = async() => {
        if(user != null && selectedPromotion != null){
            const isSuccess = await deletePromotion(selectedPromotion.id,user.token)
            if(!isSuccess){
              return;
            }
        }
        getPromotionsHandler(1);
        setOpenDeleteModal(false);
    }

    const onChangeSelectedPromotion = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, type, value } = e.target;
        
        // Convert the value to a Date object if the input type is 'date'
        let fieldValue: any = value;

        if (type === 'date') {
          const date = new Date(value);
          const localOffset = date.getTimezoneOffset();
          const localDate = new Date( date.getTime() + localOffset );
          fieldValue = localDate;
        }

        setSelectedPromotion(prevSelectedPromotion => {
            if(!prevSelectedPromotion) return null;
            return {
                ...prevSelectedPromotion,
                [name]: fieldValue,
            };
        });
    };

    const onSubmitUpdate = async (e: FormEvent) => {
        e.preventDefault();
        setLoadingForm(true);
        const fieldsValidated = validateFields('form_update_promotion');
        if(fieldsValidated != null){
          fieldsValidated.existing_images = JSON.stringify(existingImages);
          if(user !== null && selectedPromotion != null){
              const isSuccess = await updatePromotion(selectedPromotion.id,fieldsValidated, user.token);
              if(!isSuccess){
                setLoadingForm(false);
                return;
              }
          }
          setImages([]);
          getPromotionsHandler(1);
          setCurrentView("L")
        }
        setLoadingForm(false);
    };

    const calculatedDiscountLocally = (formname:string) => {
        const form = document.getElementById(formname) as HTMLFormElement;
        const discountInput = (form.querySelector('input[name="discount"]') as HTMLInputElement);
        const netImportInput = (form.querySelector('input[name="netImport"]') as HTMLInputElement);
        const grossImportInput = (form.querySelector('input[name="grossImport"]') as HTMLInputElement); 

        const discountValue = Number(discountInput.value);
        const netImportValue = Number(netImportInput.value);

        if(discountValue <= 0) return grossImportInput.value = netImportValue.toString();
        if(discountValue > 100) return grossImportInput.value ="0";

        const valueDiscounted = (1 - (discountValue)/100)* netImportValue;

        grossImportInput.value = valueDiscounted.toString();
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
                  <h1 className="font-primary text-secondary mt-4">{"Cargando..."}</h1>
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
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><Disc/>Promociones</h2>
                    <div className="w-full h-auto flex flex-row justify-between items-center gap-x-4">
                        <div className="w-auto h-auto flex flex-col md:flex-row justify-start items-start gap-y-4 gap-x-4">
                          <div className="flex flex-col md:flex-row items-start md:items-center gap-x-2">
                            <input 
                              type="text" 
                              name="criteria_search_value"
                              placeholder="Buscar Promocion" 
                              className="w-96 h-8 text-xs font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-primary"
                            />
                            <InputRadio name="criteria_search" variant="dark" value="title" placeholder="Nombre"/>
                          </div>
                          <div className="flex flex-col md:flex-row items-start md:items-center gap-x-2">
                              <label className="md:ml-4 flex items-center">
                                Estatus
                                <select name="criteria_search_status" className="ml-2 h-8 text-xs font-tertiary border-b-2 border-secondary focus:outline-none focus:border-b-primary">
                                  <option value="">Seleccionar Estatus</option>
                                  <option value="ACTIVE">ACTIVO</option>
                                  <option value="INACTIVE">INACTIVO</option>
                                </select>
                              </label>
                              <Button size="sm" variant="dark" effect="default" className="md:ml-4 mt-4 md:mt-0" onClick={()=>searchExperienceHandler()}>
                              Buscar
                            </Button>
                          </div>
                        </div>
                        <div className="w-auto h-auto flex flex-row justify-end items-start gap-y-4 gap-x-4">
                          <Button onClick={()=>{setCurrentView("A"); setImages([]); setExistingImages([]); setIdTents([]); setIdProducts([]); setIdExperiences([]);}} size="sm" variant="dark" effect="default" className="min-w-[300px]" isRound={true}>Agregar Promocion <Disc/></Button>
                        </div>
                    </div>
                    <table className="h-full w-full shadow-xl rounded-xl text-center p-4">
                        <thead className="font-primary text-md bg-primary text-white">
                            <tr className="">
                                <th className="rounded-tl-xl p-2">#</th>
                                <th className="p-2">Titulo</th>
                                <th className="p-2">Expira</th>
                                <th className="p-2">Personas</th>
                                <th className="p-2">Descuento</th>
                                <th className="p-2">Total</th>
                                <th className="p-2">Imagenes</th>
                                <th className="p-2">Estado</th>
                                <th className="p-2">Creado</th>
                                <th className="p-2">Actualizado</th>
                                <th className="rounded-tr-xl p-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="font-secondary text-sm">
                                {datasetPromotions.promotions.map((promotionItem,index)=>{
                                    return(
                                    <tr key={"user_key"+index} className="text-slate-400 hover:bg-secondary hover:text-white duration-300 cursor-pointer"> 
                                        <td className="">{promotionItem.id}</td>
                                        <td className="">{promotionItem.title}</td>
                                        <td className="">{promotionItem.expiredDate !== undefined && promotionItem.expiredDate != null ? formatToISODate(promotionItem.expiredDate) : "None"}</td>

                                        <td className="flex flex-row gap-x-4 justify-around">
                                          <div className="flex flex-row gap-x-4"><UserIcon/>{promotionItem.qtypeople}</div>
                                          <div className="flex flex-row gap-x-4"><Blocks/>{promotionItem.qtykids}</div>
                                        </td>

                                        <td className="">{promotionItem.discount}</td>
                                        <td className="">{`$ ${promotionItem.grossImport}`}</td>
                                        <td className="flex flex-row flex-wrap items-start justify-start gap-2">
                                          {promotionItem.images.map((img, index) => (
                                            <a key={index} href={`${import.meta.env.VITE_BACKEND_URL}/${img}`} target="_blank">
                                              <Image className="hover:text-tertiary duration-300"/>
                                            </a>
                                          ))}
                                        </td>
                                        <td className="h-full">{promotionItem.status != "ACTIVE" ? "INACTIVO" : "ACTIVO" }</td>
                                        <td className="h-full">{promotionItem.updatedAt != undefined && promotionItem.updatedAt != null ? formatDate(promotionItem.updatedAt) : "None"}</td>
                                        <td className="h-full">{promotionItem.createdAt != undefined && promotionItem.createdAt != null ? formatDate(promotionItem.createdAt) : "None"}</td>
                                        <td className="h-full flex flex-col items-center justify-center">
                                          <div className="w-full h-auto flex flex-row flex-wrap gap-x-2">
                                            <button onClick={()=>{setSelectedPromotion(promotionItem); setExistingImages(promotionItem.images); setIdTents(promotionItem.tents); setIdProducts(promotionItem.products); setIdExperiences(promotionItem.experiences); setCurrentView("V")}} className="border rounded-md hover:bg-primary hover:text-white duration-300 active:scale-75 p-1"><Eye className="h-5 w-5"/></button>
                                            <button  onClick={()=>{setSelectedPromotion(promotionItem); setExistingImages(promotionItem.images) ; setIdTents(promotionItem.tents); setIdProducts(promotionItem.products); setIdExperiences(promotionItem.experiences); setImages([]); setCurrentView("E")}} className="border rounded-md hover:bg-primary hover:text-white duration-300 active:scale-75 p-1"><Pen className="h-5 w-5"/></button>
                                            <button onClick={()=>{setOpenDeleteModal(true),setSelectedPromotion(promotionItem)}} className="border rounded-md hover:bg-red-400 hover:text-white duration-300 active:scale-75 p-1"><X className="h-5 w-5"/></button>
                                          </div>
                                        </td>
                                    </tr>
                                    )
                                })}
                        </tbody>
                    </table>
                    <div className="flex flex-row justify-between w-full">
                        <Button onClick={ () => getPromotionsHandler( Number(datasetPromotions.currentPage) - 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={datasetPromotions.currentPage == 1}> <ChevronLeft/>  </Button>
                        <Button onClick={ () => getPromotionsHandler( Number(datasetPromotions.currentPage) + 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={datasetPromotions.currentPage >= datasetPromotions.totalPages}> <ChevronRight/> </Button>
                    </div>
                </motion.div>

                <Modal isOpen={openDeleteModal} onClose={()=>setOpenDeleteModal(false)}>
                    <div className="w-[400px] h-auto flex flex-col items-center justify-center text-secondary pb-6 px-6 pt-12 text-center">
                        <CircleX className="h-[60px] w-[60px] text-red-400 "/>
                        <p className="text-primary">Estas seguro de eliminar esta promocion?</p>
                        <p className="text-sm mt-6 text-secondary">La promocion se eliminara si haces click en aceptar, las reservas no se perderan, pero no se podra usar mas la promocion</p>
                        <div className="flex flex-row justify-around w-full mt-6">
                            <Button size="sm" variant="dark" effect="default" isRound={true} onClick={()=>setOpenDeleteModal(false)}> Cancelar  </Button>
                            <Button size="sm" variant="danger" effect="default" isRound={true} onClick={()=>{deletePromotionHandler()}}> Aceptar </Button>
                        </div>
                    </div>
                </Modal>
            </>

        )}

        {currentView == "V" && selectedPromotion && (
                <motion.div 
                    key={"New-View"}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    viewport={{ once: true }}
                    variants={fadeIn("up","",0.5,0.3)}
                    className="w-full h-auto flex flex-col justify-start items-start gap-y-4">
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><Disc/>Ver Promocion</h2>

                  <div className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" >

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%] h-full">

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="title" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Titulo de la promocion"}</label>
                            <input name="title" value={selectedPromotion.title} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Titulo de la promocion"} disabled/>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="description" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Descripcion"}</label>
                            <textarea name="description" className="w-full h-8 sm:h-24 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary mt-2" placeholder={"Descripcion"}>{ selectedPromotion.description }</textarea>
                          </div>

                          <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="expiredDate" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Fecha de Expiracion"}</label>
                              <input name="expiredDate" type="date" value={formatToISODate(selectedPromotion.expiredDate)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Fecha de expiracion"} disabled/>
                            </div>

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="stock" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Cantidad de promociones"}</label>
                              <input name="stock" value={selectedPromotion.stock} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Duracion"} disabled/>
                            </div>
                          </div>

                          <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="qtypeople" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Cantidad de Personas"}</label>
                              <input name="qtypeople" value={selectedPromotion.qtypeople} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad de Personas"} disabled/>
                            </div>

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="qtykids" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Cantidad de Niños"}</label>
                              <input name="qtykids" value={selectedPromotion.qtykids} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad de Niños"} disabled/>
                            </div>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="status" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Estatus"}</label>
                            <select name="status" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                              <option value={selectedPromotion.status}>{selectedPromotion.status == "ACTIVE" ? "ACTIVO" : "INACTIVO"}</option>
                            </select>
                          </div>
                          
                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="image" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Imagenes"}</label>
                              <div className="flex flex-row flex-wrap justify-start items-start w-full h-auto p-4 gap-6">
                                <AnimatePresence>
                                  {selectedPromotion.images.map((image, index) => (
                                    <motion.div
                                      key={index}
                                      initial="hidden"
                                      animate="show"
                                      exit="hidden"
                                      viewport={{ once: true }}
                                      variants={fadeOnly("",0,0.3)}
                                      className="image-selected"
                                      style={{
                                        backgroundImage: `url(${import.meta.env.VITE_BACKEND_URL}/${image})`,
                                        backgroundSize: 'cover',
                                        position: 'relative'
                                      }}
                                    >
                                    </motion.div>
                                  ))}
                                </AnimatePresence>
                              </div>
                          </div>

                      </div>

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%]">

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                            <label htmlFor="glampings" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Glampings en la promocion"}</label>
                            <div className="w-full h-auto">
                              <AnimatePresence>
                                {idTents.map((item, index) => (
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
                                              Tienda: <label className="text-tertiary ml-2 text-xs">{item.name}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              Cantidad: <label className="text-tertiary ml-2 text-xs">{item.quantity}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              Precio Unt.: <label className="text-tertiary ml-2">S/{item.price.toFixed(2)}</label>
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => handleRemovePromotionOption(index,"tent")}
                                              className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-red-400 hover:text-white rounded-xl duration-300 hover:border-red-400"
                                            >
                                              Borrar
                                            </button>
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                            <label htmlFor="products" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Productos en la promocion"}</label>
                            <div className="w-full h-auto">
                              <AnimatePresence>
                                {idProducts.map((item, index) => (
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
                                              Tienda: <label className="text-tertiary ml-2 text-xs">{item.name}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              Cantidad: <label className="text-tertiary ml-2 text-xs">{item.quantity}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              Precio Unt.: <label className="text-tertiary ml-2">S/{item.price.toFixed(2)}</label>
                                            </span>
                                            <button
                                              type="button"

                                              onClick={() => handleRemovePromotionOption(index,"product")}
                                              className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-red-400 hover:text-white rounded-xl duration-300 hover:border-red-400"
                                            >
                                              Borrar
                                            </button>
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                            <label htmlFor="experiences" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Experiencias en la promocion"}</label>
                            <div className="w-full h-auto">
                              <AnimatePresence>
                                {idExperiences.map((item, index) => (
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
                                              Tienda: <label className="text-tertiary ml-2 text-xs">{item.name}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              Cantidad: <label className="text-tertiary ml-2 text-xs">{item.quantity}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              Precio Unt.: <label className="text-tertiary ml-2">S/{item.price.toFixed(2)}</label>
                                            </span>
                                            <button
                                              type="button"

                                              onClick={() => handleRemovePromotionOption(index,"experience")}
                                              className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-red-400 hover:text-white rounded-xl duration-300 hover:border-red-400"
                                            >
                                              Borrar
                                            </button>
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>
                          </div>

                          <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="importe_calculado" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Importe Total Calculado"}</label>
                              <input name="importe_calculado" value={ `$ ${getTotalPromotionCalculated(idTents,idProducts,idExperiences)}` } className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary"  disabled/>
                            </div>

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="discount" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Descuento en %"}</label>
                              <input name="discount" value={selectedPromotion.discount} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Descuento en %"} disabled/>
                            </div>

                          </div>

                          <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="netImport" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Importe Neto"}</label>
                              <input name="netImport" value={selectedPromotion.netImport} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Importe Neto"} disabled/>
                            </div>

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="grossImport" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Importe Total"}</label>
                              <input name="grossImport" value={selectedPromotion.grossImport} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Importe Total"} disabled/>
                            </div>

                          </div>

                          <div className="flex flex-row justify-end gap-x-6 w-full">
                              <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>Volver a lista de Promociones</Button>
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
                <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><Disc/>Agregar Promocion</h2>

              <form id="form_create_promotion" className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" onSubmit={(e)=>onSubmitCreation(e)}>

                <div className="flex flex-col justify-start items-start w-full lg:w-[50%] h-full">

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="title" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Titulo de la promocion"}</label>
                        <input name="title" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Titulo de la Promocion"}/>
                        <div className="w-full h-6">
                          {errorMessages.title && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {errorMessages.title}
                            </motion.p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="description" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Descripcion"}</label>
                        <textarea name="description" className="w-full h-8 sm:h-24 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary mt-2" placeholder={"Descripcion"}/>
                        <div className="w-full h-6">
                          {errorMessages.description && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {errorMessages.description}
                            </motion.p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                        <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                          <label htmlFor="expiredDate" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Fecha de Expiracion"}</label>
                          <input name="expiredDate" type="date" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Fecha de Expiracion"}/>

                          <div className="w-full h-6">
                            {errorMessages.expiredDate && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {errorMessages.expiredDate}
                              </motion.p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                          <label htmlFor="stock" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Cantidad de promociones"}</label>
                          <input name="stock" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad de promociones"}/>

                          <div className="w-full h-6">
                            {errorMessages.stock && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {errorMessages.stock}
                              </motion.p>
                            )}
                          </div>
                        </div>

                      </div>

                      <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">

                        <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                          <label htmlFor="qtypeople" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Cantidad de personas"}</label>
                          <input name="qtypeople" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad de personas"}/>

                          <div className="w-full h-6">
                            {errorMessages.qtypeople && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {errorMessages.qtypeople}
                              </motion.p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                          <label htmlFor="qtykids" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Cantidad  de niños"}</label>
                          <input name="qtykids" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad de niños"}/>

                          <div className="w-full h-6">
                            {errorMessages.qtykids && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {errorMessages.qtykids}
                              </motion.p>
                            )}
                          </div>
                        </div>

                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="status" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Estatus"}</label>
                        <select name="status" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                          <option value="ACTIVE">ACTIVO</option>
                          <option value="INACTIVE">INACTIVO</option>
                        </select>

                        <div className="w-full h-6">
                          {errorMessages.status && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {errorMessages.status}
                            </motion.p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="image" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Imagenes"}</label>
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
                                {errorMessages.images}
                              </motion.p>
                            )}
                          </div>
                      </div>

                  </div>

                <div className="flex flex-col justify-start items-start w-full lg:w-[50%]">

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                        <label htmlFor="glampings" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Glampings en la promocion"}</label>
                        <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-[75%] h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="promotion_option_tent_id" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Glamping"}</label>
                                <select name="promotion_option_tent_id" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                                    { datasetPromotionsOptions.tents.map((tent,index) => {
                                        return(
                                          <option key={index} value={tent.id}>{`${tent.title} | Precio: $${tent.price}`}</option>
                                        )
                                    })}
                                </select>
                            </div>

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-[25%] h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="promotion_option_qty" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Cantidad"}</label>
                              <input name="promotion_option_tent_qty" type="number" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad"}/>
                            </div>
                            <Button onClick={()=>handleAddPromotionOption("form_create_promotion","tent")} size="sm" type="button" variant="dark" effect="default" isRound={true} className="w-[10%] my-auto">+</Button>
                        </div>

                        <div className="w-full h-auto">
                          <AnimatePresence>
                            {idTents.map((item, index) => (
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
                                          Tienda: <label className="text-tertiary ml-2 text-xs">{item.name}</label>
                                        </span>
                                        <span className="w-[30%]">
                                          Cantidad: <label className="text-tertiary ml-2 text-xs">{item.quantity}</label>
                                        </span>
                                        <span className="w-[30%]">
                                          Precio Unt.: <label className="text-tertiary ml-2">S/{item.price.toFixed(2)}</label>
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemovePromotionOption(index,"tent")}
                                          className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-red-400 hover:text-white rounded-xl duration-300 hover:border-red-400"
                                        >
                                          Borrar
                                        </button>
                                      </motion.div>
                                    ))}
                          </AnimatePresence>
                        </div>

                        <div className="w-full h-6">
                          {errorMessages.idTents && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {errorMessages.idTents}
                            </motion.p>
                          )}
                        </div>

                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                        <label htmlFor="products" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Productos en la promocion"}</label>
                        <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-[75%] h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="promotion_option_product_id" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Productos"}</label>
                                <select name="promotion_option_product_id" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                                    { datasetPromotionsOptions.products.map((product,index) => {
                                        return(
                                            <option key={index} value={product.id}>{`${product.name} | Precio: $${product.price}`}</option>
                                        )
                                    })}
                                </select>
                            </div>

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-[25%] h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="promotion_option_product_qty" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Cantidad"}</label>
                              <input name="promotion_option_product_qty" type="number" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad"}/>
                            </div>
                            <Button onClick={()=>handleAddPromotionOption("form_create_promotion","product")} size="sm" type="button" variant="dark" effect="default" isRound={true} className="w-[10%] my-auto">+</Button>
                        </div>

                        <div className="w-full h-auto">
                          <AnimatePresence>
                            {idProducts.map((item, index) => (
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
                                          Producto: <label className="text-tertiary ml-2 text-xs">{item.name}</label>
                                        </span>
                                        <span className="w-[30%]">
                                          Cantidad: <label className="text-tertiary ml-2 text-xs">{item.quantity}</label>
                                        </span>
                                        <span className="w-[30%]">
                                          Precio Unt.: <label className="text-tertiary ml-2">S/{item.price.toFixed(2)}</label>
                                        </span>
                                        <button
                                          type="button"

                                          onClick={() => handleRemovePromotionOption(index,"product")}
                                          className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-red-400 hover:text-white rounded-xl duration-300 hover:border-red-400"
                                        >
                                          Borrar
                                        </button>
                                      </motion.div>
                                    ))}
                          </AnimatePresence>
                        </div>

                        <div className="w-full h-6">
                          {errorMessages.idProducts && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {errorMessages.idProducts}
                            </motion.p>
                          )}
                        </div>

                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                        <label htmlFor="experiences" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Experiencias en la promocion"}</label>
                        <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-[75%] h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="promotion_option_experience_id" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Experiencia"}</label>
                                <select name="promotion_option_experience_id" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                                    { datasetPromotionsOptions.experiences.map((experience,index) => {
                                        return(
                                            <option key={index} value={experience.id}>{`${experience.name} | Precio: $${experience.price}`}</option>
                                        )
                                    })}
                                </select>
                            </div>

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-[25%] h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="promotion_option_experience_qty" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Cantidad"}</label>
                              <input name="promotion_option_experience_qty" type="number" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad"}/>
                            </div>
                            <Button onClick={()=>handleAddPromotionOption("form_create_promotion","experience")} size="sm" type="button" variant="dark" effect="default" isRound={true} className="w-[10%] my-auto">+</Button>
                        </div>

                        <div className="w-full h-auto">
                          <AnimatePresence>
                            {idExperiences.map((item, index) => (
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
                                          Experiencia: <label className="text-tertiary ml-2 text-xs">{item.name}</label>
                                        </span>
                                        <span className="w-[30%]">
                                          Cantidad: <label className="text-tertiary ml-2 text-xs">{item.quantity}</label>
                                        </span>
                                        <span className="w-[30%]">
                                          Precio Unt.: <label className="text-tertiary ml-2">S/{item.price.toFixed(2)}</label>
                                        </span>
                                        <button
                                          type="button"

                                          onClick={() => handleRemovePromotionOption(index,"experience")}
                                          className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-red-400 hover:text-white rounded-xl duration-300 hover:border-red-400"
                                        >
                                          Borrar
                                        </button>
                                      </motion.div>
                                    ))}
                          </AnimatePresence>
                        </div>

                        <div className="w-full h-6">
                          {errorMessages.idProducts && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {errorMessages.idProducts}
                            </motion.p>
                          )}
                        </div>

                      </div>

                      <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">

                        <div className="flex flex-col justify-start itemst-start gap-x-6 w-[50%] h-auto gap-y-2 sm:gap-y-1">
                          <label htmlFor="importe_calculado" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Importe Total Calculado"}</label>
                          <input name="importe_calculado" value={ `$ ${getTotalPromotionCalculated(idTents,idProducts,idExperiences)}` } className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary"  disabled/>
                        </div>

                        <div className="flex flex-col justify-start itemst-start gap-x-6 w-[40%] h-auto gap-y-2 sm:gap-y-1">
                          <label htmlFor="discount" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Descuento en %"}</label>
                          <input name="discount" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Descuento en %"}/>

                          <div className="w-full h-6">
                            {errorMessages.discount && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {errorMessages.discount}
                              </motion.p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col justify-center itemst-center gap-x-6 w-[10%] h-full gap-y-2 sm:gap-y-1">
                          <button
                            type="button"

                            onClick={()=>calculatedDiscountLocally("form_create_promotion")}
                            className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-primary hover:text-white rounded-xl duration-300 hover:border-primary"
                          >
                             %
                          </button>
                        </div>

                      </div>

                      <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">

                        <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                          <label htmlFor="netImport" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Importe Neto"}</label>
                          <input name="netImport" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Importe Neto"}/>

                          <div className="w-full h-6">
                            {errorMessages.netImport && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {errorMessages.netImport}
                              </motion.p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                          <label htmlFor="grossImport" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Importe Total"}</label>
                          <input name="grossImport" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Importe Total"}/>

                          <div className="w-full h-6">
                            {errorMessages.grossImport && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {errorMessages.grossImport}
                              </motion.p>
                            )}
                          </div>
                        </div>

                      </div>


                      <div className="flex flex-row justify-end gap-x-6 w-full">
                          <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>Cancelar</Button>
                          <Button type="submit" size="sm" variant="dark" effect="default" isRound={true} isLoading={loadingForm}> Crear Promocion </Button>
                      </div>

                  </div>
                </form>
            </motion.div>
        )}

        {currentView === "E" && selectedPromotion && (
                <motion.div 
                    key={"Edit-View"}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    viewport={{ once: true }}
                    variants={fadeIn("up","",0.5,0.3)}
                    className="w-full h-auto flex flex-col justify-start items-start gap-y-4">
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><Disc/>Editar Experiencia</h2>

                  <form id="form_update_promotion" className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" onSubmit={(e)=>onSubmitUpdate(e)}>

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%] h-full">

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="title" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Titulo de la promocion"}</label>
                            <input name="title" value={selectedPromotion.title}  onChange={(e)=>onChangeSelectedPromotion(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Titulo de la promocion"}/>
                            <div className="w-full h-6">
                              {errorMessages.title && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {errorMessages.title}
                                </motion.p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="description" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Descripcion"}</label>
                            <textarea name="description"  onChange={(e)=>onChangeSelectedPromotion(e)} className="w-full h-8 sm:h-24 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary mt-2" placeholder={"Descripcion"}>{selectedPromotion.description}</textarea>
                            <div className="w-full h-6">
                              {errorMessages.description && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {errorMessages.description}
                                </motion.p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="expiredDate" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Fecha de Expiracion"}</label>
                              <input name="expiredDate" type="date" value={formatToISODate(selectedPromotion.expiredDate)}  onChange={(e)=>onChangeSelectedPromotion(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Fecha de Expiracion"}/>

                              <div className="w-full h-6">
                                {errorMessages.expiredDate && (
                                  <motion.p 
                                    initial="hidden"
                                    animate="show"
                                    exit="hidden"
                                    variants={fadeIn("up","", 0, 1)}
                                    className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                    {errorMessages.expiredDate}
                                  </motion.p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="stock" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Cantidad de promociones"}</label>
                              <input name="stock" value={selectedPromotion.stock}  onChange={(e)=>onChangeSelectedPromotion(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad de promociones"}/>

                              <div className="w-full h-6">
                                {errorMessages.stock && (
                                  <motion.p 
                                    initial="hidden"
                                    animate="show"
                                    exit="hidden"
                                    variants={fadeIn("up","", 0, 1)}
                                    className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                    {errorMessages.stock}
                                  </motion.p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">

                              <label htmlFor="qtypeople" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Cantidad de personas"}</label>
                              <input name="qtypeople" value={selectedPromotion.qtypeople}  onChange={(e)=>onChangeSelectedPromotion(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad de personas"}/>

                              <div className="w-full h-6">
                                {errorMessages.qtypeople && (
                                  <motion.p 
                                    initial="hidden"
                                    animate="show"
                                    exit="hidden"
                                    variants={fadeIn("up","", 0, 1)}
                                    className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                    {errorMessages.qtypeople}
                                  </motion.p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="qtykids" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Cantidad de Niños"}</label>
                              <input name="qtykids" value={selectedPromotion.qtykids}  onChange={(e)=>onChangeSelectedPromotion(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad de Niños"}/>

                              <div className="w-full h-6">
                                {errorMessages.qtykids && (
                                  <motion.p 
                                    initial="hidden"
                                    animate="show"
                                    exit="hidden"
                                    variants={fadeIn("up","", 0, 1)}
                                    className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                    {errorMessages.qtykids}
                                  </motion.p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="status" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Estatus"}</label>
                            <select name="status" onChange={(e)=>onChangeSelectedPromotion(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                              <option value="ACTIVE" selected={selectedPromotion.status == "ACTIVE"}>ACTIVO</option>
                              <option value="INACTIVE" selected={selectedPromotion.status == "INACTIVE"}>INACTIVO</option>
                            </select>
                            <div className="w-full h-6">
                              {errorMessages.status && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {errorMessages.status}
                                </motion.p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="image" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Imagenes"}</label>
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
                                        backgroundImage: `url(${import.meta.env.VITE_BACKEND_URL}/${image})`,
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
                                    {errorMessages.images}
                                  </motion.p>
                                )}
                              </div>
                          </div>


                      </div>

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%]">

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                            <label htmlFor="glampings" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Glampings en la promocion"}</label>
                            <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                                <div className="flex flex-col justify-start itemst-start gap-x-6 w-[75%] h-auto gap-y-2 sm:gap-y-1">
                                  <label htmlFor="promotion_option_tent_id" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Glamping"}</label>
                                    <select name="promotion_option_tent_id" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                                        { datasetPromotionsOptions.tents.map((tent,index) => {
                                            return(
                                                <option key={index} value={tent.id}>{`${tent.title} | Precio: $${tent.price}`}</option>
                                            )
                                        })}
                                    </select>
                                </div>

                                <div className="flex flex-col justify-start itemst-start gap-x-6 w-[25%] h-auto gap-y-2 sm:gap-y-1">
                                  <label htmlFor="promotion_option_qty" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Cantidad"}</label>
                                  <input name="promotion_option_tent_qty" type="number" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad"}/>
                                </div>
                                <Button onClick={()=>handleAddPromotionOption("form_update_promotion","tent")} size="sm" type="button" variant="dark" effect="default" isRound={true} className="w-[10%] my-auto">+</Button>
                            </div>

                            <div className="w-full h-auto">
                              <AnimatePresence>
                                {idTents.map((item, index) => (
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
                                              Tienda: <label className="text-tertiary ml-2 text-xs">{item.name}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              Cantidad: <label className="text-tertiary ml-2 text-xs">{item.quantity}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              Precio Unt.: <label className="text-tertiary ml-2">S/{item.price.toFixed(2)}</label>
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => handleRemovePromotionOption(index,"tent")}
                                              className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-red-400 hover:text-white rounded-xl duration-300 hover:border-red-400"
                                            >
                                              Borrar
                                            </button>
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>

                            <div className="w-full h-6">
                              {errorMessages.idTents && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {errorMessages.idTents}
                                </motion.p>
                              )}
                            </div>

                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                            <label htmlFor="products" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Productos en la promocion"}</label>
                            <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                                <div className="flex flex-col justify-start itemst-start gap-x-6 w-[75%] h-auto gap-y-2 sm:gap-y-1">
                                  <label htmlFor="promotion_option_product_id" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Productos"}</label>
                                    <select name="promotion_option_product_id" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                                        { datasetPromotionsOptions.products.map((product,index) => {
                                            return(
                                                <option key={index} value={product.id}>{`${product.name} | Precio: $${product.price}`}</option>
                                            )
                                        })}
                                    </select>
                                </div>

                                <div className="flex flex-col justify-start itemst-start gap-x-6 w-[25%] h-auto gap-y-2 sm:gap-y-1">
                                  <label htmlFor="promotion_option_product_qty" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Cantidad"}</label>
                                  <input name="promotion_option_product_qty" type="number" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad"}/>
                                </div>
                                <Button onClick={()=>handleAddPromotionOption("form_update_promotion","product")} size="sm" type="button" variant="dark" effect="default" isRound={true} className="w-[10%] my-auto">+</Button>
                            </div>

                            <div className="w-full h-auto">
                              <AnimatePresence>
                                {idProducts.map((item, index) => (
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
                                              Producto: <label className="text-tertiary ml-2 text-xs">{item.name}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              Cantidad: <label className="text-tertiary ml-2 text-xs">{item.quantity}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              Precio Unt.: <label className="text-tertiary ml-2">S/{item.price.toFixed(2)}</label>
                                            </span>
                                            <button
                                              type="button"

                                              onClick={() => handleRemovePromotionOption(index,"product")}
                                              className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-red-400 hover:text-white rounded-xl duration-300 hover:border-red-400"
                                            >
                                              Borrar
                                            </button>
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>

                            <div className="w-full h-6">
                              {errorMessages.idProducts && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {errorMessages.idProducts}
                                </motion.p>
                              )}
                            </div>

                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                            <label htmlFor="experiences" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Experiencias en la promocion"}</label>
                            <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                                <div className="flex flex-col justify-start itemst-start gap-x-6 w-[75%] h-auto gap-y-2 sm:gap-y-1">
                                  <label htmlFor="promotion_option_experience_id" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Experiencia"}</label>
                                    <select name="promotion_option_experience_id" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                                        { datasetPromotionsOptions.experiences.map((experience,index) => {
                                            return(
                                                <option key={index} value={experience.id}>{`${experience.name} | Precio: $${experience.price}`}</option>
                                            )
                                        })}
                                    </select>
                                </div>

                                <div className="flex flex-col justify-start itemst-start gap-x-6 w-[25%] h-auto gap-y-2 sm:gap-y-1">
                                  <label htmlFor="promotion_option_experience_qty" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Cantidad"}</label>
                                  <input name="promotion_option_experience_qty" type="number" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad"}/>
                                </div>
                                <Button onClick={()=>handleAddPromotionOption("form_update_promotion","experience")} size="sm" type="button" variant="dark" effect="default" isRound={true} className="w-[10%] my-auto">+</Button>
                            </div>

                            <div className="w-full h-auto">
                              <AnimatePresence>
                                {idExperiences.map((item, index) => (
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
                                              Experiencia: <label className="text-tertiary ml-2 text-xs">{item.name}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              Cantidad: <label className="text-tertiary ml-2 text-xs">{item.quantity}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              Precio Unt.: <label className="text-tertiary ml-2">S/{item.price.toFixed(2)}</label>
                                            </span>
                                            <button
                                              type="button"

                                              onClick={() => handleRemovePromotionOption(index,"experience")}
                                              className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-red-400 hover:text-white rounded-xl duration-300 hover:border-red-400"
                                            >
                                              Borrar
                                            </button>
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>

                            <div className="w-full h-6">
                              {errorMessages.idProducts && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {errorMessages.idProducts}
                                </motion.p>
                              )}
                            </div>

                          </div>

                          <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-[50%] h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="importe_calculado" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Importe Total Calculado"}</label>
                              <input name="importe_calculado" value={ `$ ${getTotalPromotionCalculated(idTents,idProducts,idExperiences)}` } className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary"  disabled/>
                            </div>

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-[40%] h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="discount" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Descuento en %"}</label>
                              <input name="discount" value={selectedPromotion.discount} onChange={(e)=>onChangeSelectedPromotion(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Descuento en %"}/>

                              <div className="w-full h-6">
                                {errorMessages.discount && (
                                  <motion.p 
                                    initial="hidden"
                                    animate="show"
                                    exit="hidden"
                                    variants={fadeIn("up","", 0, 1)}
                                    className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                    {errorMessages.discount}
                                  </motion.p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col justify-center itemst-center gap-x-6 w-[10%] h-full gap-y-2 sm:gap-y-1">
                              <button
                                type="button"

                                onClick={()=>calculatedDiscountLocally("form_update_promotion")}
                                className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-primary hover:text-white rounded-xl duration-300 hover:border-primary"
                              >
                                 %
                              </button>
                            </div>

                          </div>

                          <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="netImport" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Importe Neto"}</label>
                              <input name="netImport" value={selectedPromotion.netImport} onChange={(e)=>onChangeSelectedPromotion(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Importe Neto"}/>

                              <div className="w-full h-6">
                                {errorMessages.netImport && (
                                  <motion.p 
                                    initial="hidden"
                                    animate="show"
                                    exit="hidden"
                                    variants={fadeIn("up","", 0, 1)}
                                    className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                    {errorMessages.netImport}
                                  </motion.p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="grossImport" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Importe Total"}</label>
                              <input name="grossImport" value={selectedPromotion.grossImport} onChange={(e)=>onChangeSelectedPromotion(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Importe Total"}/>

                              <div className="w-full h-6">
                                {errorMessages.grossImport && (
                                  <motion.p 
                                    initial="hidden"
                                    animate="show"
                                    exit="hidden"
                                    variants={fadeIn("up","", 0, 1)}
                                    className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                    {errorMessages.grossImport}
                                  </motion.p>
                                )}
                              </div>
                            </div>

                          </div>

                          <div className="flex flex-row justify-end gap-x-6 w-full">
                              <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>Cancelar</Button>
                              <Button type="submit" size="sm" variant="dark" effect="default" isRound={true} isLoading={loadingForm}> Guardar Cambios </Button>
                          </div>

                      </div>
                    </form>
                </motion.div>
                )}

        </AnimatePresence>
    </Dashboard>
    )
}

export default DashboardAdminPromotions;
