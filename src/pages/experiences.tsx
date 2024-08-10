import Dashboard from "../components/ui/Dashboard";
import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { Eye, Pen, X, ChevronLeft, ChevronRight, FlameKindlingIcon, CircleX, Image, RefreshCw } from "lucide-react";
import Button from "../components/ui/Button";
import { InputRadio } from "../components/ui/Input";
import {  formatDate, createImagesArray } from "../lib/utils";
import { getAllExperiences, createExperience, updateExperience, deleteExperience } from "../db/actions/experiences";
import { getAllExperiencesCategory , createExperienceCategory, deleteExperienceCategory, updateExperienceCategory} from "../db/actions/categories";
import { useAuth } from "../contexts/AuthContext";
import { Experience, ExperienceFilters, ExperienceFormData, ImageInterface, CustomPrice, ExperienceCategory } from "../lib/interfaces";
import { AnimatePresence, motion } from "framer-motion";
import {fadeIn, fadeOnly} from "../lib/motions";
import {  ZodError } from 'zod';
import { ExperienceSchema } from "../db/schemas";
import Modal from "../components/Modal";
import { toast } from "sonner";


const DashboardAdminExperiences = () => {

    const { user } = useAuth();
    const [datasetExperiences,setDataSetExperiences] = useState<{experiences:Experience[],totalPages:Number,currentPage:Number}>({experiences:[],totalPages:1,currentPage:1});
    const [datasetExperiencesCategory, setDatasetExperiencesCategory] = useState<ExperienceCategory[]>([]);
    const [currentView,setCurrentView] = useState<string>("LOADING");

    useEffect(()=>{
        getExperiencesHandler(1);
        getExperiencesCategory();
    },[])

    const getExperiencesCategory = async() => {
      if(user != null){
          const categories  = await getAllExperiencesCategory(user.token);
          if(categories){
              setDatasetExperiencesCategory(categories);
          }
      }
    }

    const getExperiencesHandler = async (page:Number, filters?:ExperienceFilters) => {
        setCurrentView("LOADING");
        if(user != null){
            const experiences  = await getAllExperiences(user.token,page,filters);
            if(experiences){
                setDataSetExperiences(experiences);
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
          toast.error("La fecha de inicio debe ser menor que la fecha de Fin");
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
        toast.error("Ingresa una fecha valida por favor");
      }
    };

    const handleRemoveCustomPrice = (index: number) => {
      setCustomPrices(customPrices.filter((_, i) => i !== index));
    };

    const [suggestions,setSuggestions] = useState<string[]>([]);

    const handleAddSuggestion = (formName:string) => {
      const form = document.getElementById(formName) as HTMLFormElement;
      const suggestionInput = form.querySelector('textarea[name="suggestion_input"]') as HTMLTextAreaElement;
      const suggestion      = suggestionInput.value;

      if (suggestion) {

        if(suggestion.length == 0){
          toast.error("La sugerencia no puede estar vacia");
          return;
        };   

        setSuggestions([...suggestions, suggestion]);

        // Clear input fields
        suggestionInput.value = '';

      } else {
        // Handle invalid input
        toast.error("Ingresa una sugerencia para poder grabarla");
      }
    };

    const handleRemoveSuggestion = (index: number) => {
      setSuggestions(suggestions.filter((_, i) => i !== index));
    };

    const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

    const validateFields = (formname:string): ExperienceFormData |null => {
        const form = document.getElementById(formname) as HTMLFormElement;
        const categoryId  = Number((form.querySelector('select[name="categoryId"]') as HTMLInputElement).value); 
        const header = (form.querySelector('input[name="header"]') as HTMLInputElement).value;
        const name = (form.querySelector('input[name="name"]') as HTMLInputElement).value;
        const description = (form.querySelector('textarea[name="description"]') as HTMLTextAreaElement).value;
        const price = Number((form.querySelector('input[name="price"]') as HTMLInputElement).value);
        const duration = Number((form.querySelector('input[name="duration"]') as HTMLInputElement).value);
        const limit_age = Number((form.querySelector('input[name="limit_age"]') as HTMLInputElement).value);
        const qtypeople = Number((form.querySelector('input[name="qtypeople"]') as HTMLInputElement).value);
        const status = (form.querySelector('select[name="status"]') as HTMLInputElement).value;

        setErrorMessages({});

        try {
          ExperienceSchema.parse({categoryId, header, name, description, existing_images:existingImages,images: images.map(image => image.file),  status, duration, limit_age,qtypeople, suggestions, price, custom_price:customPrices });

          return {
            categoryId,
            header,
            name,
            description,
            price,
            duration,
            limit_age,
            qtypeople,
            suggestions: JSON.stringify(suggestions),
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
              console.log(fieldName);
              console.log(err.message);
            });
            setErrorMessages(newErrorMessages);
          }
          return null;
        }
    };

    const onSubmitCreation = async (e: FormEvent) => {
        e.preventDefault();
        setLoadingForm(true);
        const fieldsValidated = validateFields('form_create_experience');
        console.log(fieldsValidated);
        if(fieldsValidated != null){
          if(user !== null){
            await createExperience(fieldsValidated, user.token);
          }
          getExperiencesHandler(1);
          setImages([]);
          setCustomPrices([]);
          setSuggestions([]);
          setCurrentView("L")
        }
        setLoadingForm(false);
    };


    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);

    const [selectedExperience, setSelectedExperience] = useState<Experience|null>(null);

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
        const filters: ExperienceFilters = {};
        if (selectedCriteria && searchValue) {
            filters[selectedCriteria as keyof ExperienceFilters] = searchValue;
        }

        if (selectedStatus) {
            filters.status = selectedStatus;
        }

        getExperiencesHandler(1,filters);
    }

    const deleteExperienceHandler = async() => {
        if(user != null && selectedExperience != null){
            await deleteExperience(selectedExperience.id,user.token)
        }
        getExperiencesHandler(1);
        setOpenDeleteModal(false);
    }

    const onChangeSelectedExperience = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, type, value } = e.target;
        const fieldValue = value;

        setSelectedExperience(prevSelectedExperience => {
            return {
                ...prevSelectedExperience,
                [name]: fieldValue,
            };
        });
    };

    const onSubmitUpdate = async (e: FormEvent) => {
        e.preventDefault();
        setLoadingForm(true);
        const fieldsValidated = validateFields('form_update_experience');
        if(fieldsValidated != null){
          fieldsValidated.existing_images = JSON.stringify(existingImages);
          if(user !== null && selectedExperience != null){
              await updateExperience(selectedExperience.id,fieldsValidated, user.token);
          }
          setImages([]);
          setCustomPrices([]);
          setSuggestions([]);
          getExperiencesHandler(1);
          setCurrentView("L")
        }
        setLoadingForm(false);
    };


    const [openModalCategories, setOpenModalCategories] = useState<boolean>(false);
    const [selectedCategory,setSelectedCategory] = useState<ExperienceCategory|null>(null);
    const [loadingCategory,setLoadingCategory] = useState<boolean>(false);

    const onChangeSelectedCategory = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const fieldValue = value;

        setSelectedCategory(prevSelectedCategory => {
            return {
                ...prevSelectedCategory,
                [name]: fieldValue,
            };
        });
    };



    const onSubmitCreationCategory = async(e:FormEvent) => {
        e.preventDefault();
        setLoadingCategory(true);
        const form = document.getElementById("form_create_experience_category") as HTMLFormElement;
        const category = (form.querySelector('input[name="category"]') as HTMLInputElement).value;

        if(category.length == 0){
          toast.error("La categoria debe tener un nombre");
          return;
        };

        if(user !== null){
            await createExperienceCategory(category, user.token);
            getExperiencesCategory();
        }
        setLoadingCategory(false);
    }

    const onSubmitUpdateCategory = async () => {
        setLoadingCategory(true);
        if(user !== null && selectedCategory != null){
            await updateExperienceCategory(selectedCategory.id,selectedCategory, user.token);
            getExperiencesCategory();
        }
        setLoadingCategory(false);
        setSelectedCategory(null);
    };

    const deleteExperienceCategoryHandler = async(idCategory:number) => {
        setLoadingCategory(true);
        if(user != null){
            await deleteExperienceCategory(idCategory,user.token)
            getExperiencesCategory();
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
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><FlameKindlingIcon/>Experiencias</h2>
                    <div className="w-full h-auto flex flex-row justify-between items-center gap-x-4">
                        <div className="w-auto h-auto flex flex-col md:flex-row justify-start items-start gap-y-4 gap-x-4">
                          <div className="flex flex-col md:flex-row items-start md:items-center gap-x-2">
                            <input 
                              type="text" 
                              name="criteria_search_value"
                              placeholder="Buscar Experiencia" 
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
                            <div className="w-full h-10 flex justify-end">
                              <button
                                type="button"
                                onClick={()=>setOpenModalCategories(true)}
                                className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-primary hover:text-white rounded-xl duration-300 hover:border-primary"
                              >
                                Categorias
                              </button>
                            </div>
                          <Button onClick={()=>{setCurrentView("A"); setImages([]); setCustomPrices([]); setSuggestions([]); setExistingImages([])}} size="sm" variant="dark" effect="default" className="min-w-[300px]" isRound={true}>Agregar Experiencia <FlameKindlingIcon/></Button>
                        </div>
                    </div>
                    <table className="h-full w-full shadow-xl rounded-xl text-center p-4">
                        <thead className="font-primary text-md bg-primary text-white">
                            <tr className="">
                                <th className="rounded-tl-xl p-2">#</th>
                                <th className="p-2">Categoria</th>
                                <th className="p-2">Nombre</th>
                                <th className="p-2">Precio</th>
                                <th className="p-2">Duracion</th>
                                <th className="p-2">Imagenes</th>
                                <th className="p-2">Estado</th>
                                <th className="p-2">Creado</th>
                                <th className="p-2">Actualizado</th>
                                <th className="rounded-tr-xl p-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="font-secondary text-sm">
                                {datasetExperiences.experiences.map((experienceItem,index)=>{
                                    return(
                                    <tr key={"user_key"+index} className="text-slate-400 hover:bg-secondary hover:text-white duration-300 cursor-pointer"> 
                                        <td className="">{experienceItem.id}</td>
                                        <td className="">{experienceItem.category.name}</td>
                                        <td className="">{experienceItem.name}</td>
                                        <td className="">{experienceItem.price}</td>
                                        <td className="">{`${experienceItem.duration} min.`}</td>
                                        <td className="flex flex-row flex-wrap items-start justify-start gap-2">
                                          {experienceItem.images.map((img, index) => (
                                            <a key={index} href={`${import.meta.env.VITE_BACKEND_URL}/${img}`} target="_blank">
                                              <Image className="hover:text-tertiary duration-300"/>
                                            </a>
                                          ))}
                                        </td>
                                        <td className="h-full">{experienceItem.status != "ACTIVE" ? "INACTIVO" : "ACTIVO" }</td>
                                        <td className="h-full">{experienceItem.updatedAt != undefined && experienceItem.updatedAt != null ? formatDate(experienceItem.updatedAt) : "None"}</td>
                                        <td className="h-full">{experienceItem.createdAt != undefined && experienceItem.createdAt != null ? formatDate(experienceItem.createdAt) : "None"}</td>
                                        <td className="h-full flex flex-col items-center justify-center">
                                          <div className="w-full h-auto flex flex-row flex-wrap gap-x-2">
                                            <button onClick={()=>{setSelectedExperience(experienceItem); setCurrentView("V")}} className="border rounded-md hover:bg-primary hover:text-white duration-300 active:scale-75 p-1"><Eye className="h-5 w-5"/></button>
                                            <button  onClick={()=>{setSelectedExperience(experienceItem); setCustomPrices(experienceItem.custom_price); setSuggestions(experienceItem.suggestions); setExistingImages(experienceItem.images) ; setImages([]); setCurrentView("E")}} className="border rounded-md hover:bg-primary hover:text-white duration-300 active:scale-75 p-1"><Pen className="h-5 w-5"/></button>
                                            <button onClick={()=>{setOpenDeleteModal(true),setSelectedExperience(experienceItem)}} className="border rounded-md hover:bg-red-400 hover:text-white duration-300 active:scale-75 p-1"><X className="h-5 w-5"/></button>
                                          </div>
                                        </td>
                                    </tr>
                                    )
                                })}
                        </tbody>
                    </table>
                    <div className="flex flex-row justify-between w-full">
                        <Button onClick={ () => getExperiencesHandler( Number(datasetExperiences.currentPage) - 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={datasetExperiences.currentPage == 1}> <ChevronLeft/>  </Button>
                        <Button onClick={ () => getExperiencesHandler( Number(datasetExperiences.currentPage) + 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={datasetExperiences.currentPage >= datasetExperiences.totalPages}> <ChevronRight/> </Button>
                    </div>
                </motion.div>

                <Modal isOpen={openDeleteModal} onClose={()=>setOpenDeleteModal(false)}>
                    <div className="w-[400px] h-auto flex flex-col items-center justify-center text-secondary pb-6 px-6 pt-12 text-center">
                        <CircleX className="h-[60px] w-[60px] text-red-400 "/>
                        <p className="text-primary">Estas seguro de eliminar esta experiencia?</p>
                        <p className="text-sm mt-6 text-secondary">La experiencia se eliminara si haces click en aceptar, las reservas no se perderan, pero no se podra reservar mas la experiencia</p>
                        <div className="flex flex-row justify-around w-full mt-6">
                            <Button size="sm" variant="dark" effect="default" isRound={true} onClick={()=>setOpenDeleteModal(false)}> Cancelar  </Button>
                            <Button size="sm" variant="danger" effect="default" isRound={true} onClick={()=>{deleteExperienceHandler()}}> Aceptar </Button>
                        </div>
                    </div>
                </Modal>

              <Modal isOpen={openModalCategories} onClose={()=>setOpenModalCategories(false)}>
                  <div className="w-[600px] h-auto flex flex-col items-center justify-center text-secondary pb-6 px-6 pt-12 text-center">
                    {loadingCategory ? 
                      <>
                        <div className="loader"></div>
                        <h1 className="font-primary text-white mt-4">{"Cargando..."}</h1>
                      </>
                    :
                    <>
                      <form id="form_create_experience_category" className="h-auto w-full flex flex-row items-end justify-between gap-x-2" onSubmit={(e)=>onSubmitCreationCategory(e)}>
                        <div className="flex flex-col items-start justify-start w-full">
                          <label htmlFor="category" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Nueva Categoria"}</label>
                            <input name="category" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Nombre de Categoria"}/>
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
                        <label htmlFor="category" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Categorias"}</label>
                        { datasetExperiencesCategory.map((category,index)=>{
                          return(
                            <div key={"category_experience"+index} className="w-[90%] h-auto flex flex-row items-center justify-center border border-2 border-slate-200 rounded-md p-2 mx-auto">
                              <div className="flex flex-col items-center justify-center w-full">
                                {selectedCategory?.id == category.id ?
                                  <input name="name" value={selectedCategory.name} onChange={(e)=>onChangeSelectedCategory(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Nombre de Categoria"}/>
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
                                  onClick={()=>deleteExperienceCategoryHandler(category.id)}
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

        {currentView == "V" && selectedExperience && (
                <motion.div 
                    key={"New-View"}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    viewport={{ once: true }}
                    variants={fadeIn("up","",0.5,0.3)}
                    className="w-full h-auto flex flex-col justify-start items-start gap-y-4">
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><FlameKindlingIcon/>Ver Experiencia</h2>

                  <div className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" >

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%] h-full">

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="categoryId" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Categoria"}</label>

                                <select name="categoryId" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                                  <option value={selectedExperience.category.id}>{selectedExperience.category.name}</option>
                                </select>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="header" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Encabezado"}</label>
                            <input name="header" value={selectedExperience.header} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Encabezado"} disabled/>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="name" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Nombre"}</label>
                            <input name="name" value={selectedExperience.name} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Nombre"} disabled/>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="description" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Descripcion"}</label>
                            <textarea name="description" className="w-full h-8 sm:h-24 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary mt-2" placeholder={"Descripcion"}>{ selectedExperience.description }</textarea>
                          </div>

                          <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="price" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Precio Fijo"}</label>
                              <input name="price" value={selectedExperience.price} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Precio Fijo"} disabled/>
                            </div>

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="duration" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Duracion en minutos"}</label>
                              <input name="duration" value={selectedExperience.duration} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Duracion"} disabled/>
                            </div>
                          </div>

                          <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="limit_age" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Limite de Edad"}</label>
                              <input name="limit_age" value={selectedExperience.limit_age} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Limite de Edad"} disabled/>
                            </div>

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="qtypeople" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Limite de Edad"}</label>
                              <input name="qtypeople" value={selectedExperience.qtypeople} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Limite de Edad"} disabled/>
                            </div>
                          </div>



                      </div>

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%]">
                          
                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                            <label htmlFor="price" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Precios Personalizados"}</label>
                            <div className="w-full h-auto flex flex-col items-start justify-start">
                              <AnimatePresence>
                                {selectedExperience.custom_price.map((price, index) => (
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
                                              Desde: <label className="text-tertiary ml-2 text-xs">{formatDate(price.dateFrom)}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              Hasta: <label className="text-tertiary ml-2 text-xs">{formatDate(price.dateTo)}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              Precio: <label className="text-tertiary ml-2">S/{price.price.toFixed(2)}</label>
                                            </span>
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>

                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="status" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Estatus"}</label>
                            <select name="status" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                              <option value={selectedExperience.status}>{selectedExperience.status == "ACTIVE" ? "ACTIVO" : "INACTIVO"}</option>
                            </select>
                          </div>
                          
                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="image" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Imagenes"}</label>
                              <div className="flex flex-row flex-wrap justify-start items-start w-full h-auto p-4 gap-6">
                                <AnimatePresence>
                                  {selectedExperience.images.map((image, index) => (
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

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                            <label htmlFor="price" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Sugerencias de la experiencia"}</label>
                            <div className="w-full h-auto">
                              <AnimatePresence>
                                {selectedExperience.suggestions.map((suggestion, index) => (
                                          <motion.div
                                            key={index}
                                            initial="hidden"
                                            animate="show"
                                            exit="hidden"
                                            viewport={{ once: true }}
                                            variants={fadeIn("up","",0,0.3)}
                                            className="w-full h-auto flex flex-row justify-between items-center rounded-xl border border-slate-200 px-4 py-2 my-2 text-sm"
                                          >
                                            <span className="w-[90%]">
                                              {`Sug. ${index+1}:`} <label className="text-tertiary ml-2 text-xs">{suggestion}</label>
                                            </span>
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>
                          </div>

                          <div className="flex flex-row justify-end gap-x-6 w-full">
                              <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>Volver a lista de Experiencias</Button>
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
                <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><FlameKindlingIcon/>Agregar Experiencia</h2>

              <form id="form_create_experience" className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" onSubmit={(e)=>onSubmitCreation(e)}>

                <div className="flex flex-col justify-start items-start w-full lg:w-[50%] h-full">

                  <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="categoryId" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Categoria"}</label>

                        <select name="categoryId" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                          { datasetExperiencesCategory.map((category,index)=>{
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
                              {errorMessages.categoryId}
                            </motion.p>
                          )}
                        </div>
                  </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="header" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Encabezado de la Experiencia"}</label>
                        <input name="header" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Encabezado de la Experiencia"}/>
                        <div className="w-full h-6">
                          {errorMessages.header && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {errorMessages.header}
                            </motion.p>
                          )}
                        </div>
                      </div>


                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="name" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Nombre de la Experiencia"}</label>
                        <input name="name" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Nombre del Experiencia"}/>
                        <div className="w-full h-6">
                          {errorMessages.name && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {errorMessages.name}
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
                          <label htmlFor="price" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Precio Fijo"}</label>
                          <input name="price" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Precio Fijo"}/>

                          <div className="w-full h-6">
                            {errorMessages.price && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {errorMessages.price}
                              </motion.p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                          <label htmlFor="duration" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Duracion en minutos"}</label>
                          <input name="duration" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Duracion"}/>

                          <div className="w-full h-6">
                            {errorMessages.duration && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {errorMessages.duration}
                              </motion.p>
                            )}
                          </div>
                        </div>

                      </div>

                      <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                        <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                          <label htmlFor="limit_age" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Limite de Edad"}</label>
                          <input name="limit_age" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Limite de edad"}/>

                          <div className="w-full h-6">
                            {errorMessages.limit_age && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {errorMessages.limit_age}
                              </motion.p>
                            )}
                          </div>
                        </div>

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

                      </div>



                  </div>

                <div className="flex flex-col justify-start items-start w-full lg:w-[50%]">

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                        <label htmlFor="price" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Precios Personalizados"}</label>
                        <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-[25%] h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="custom_price_date_from" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Desde"}</label>
                              <input name="custom_price_date_from" type="date" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Desde"}/>
                            </div>

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-[25%] h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="custom_price_date_to" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Hasta"}</label>
                              <input name="custom_price_date_to" type="date" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Hasta"}/>
                            </div>

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-[25%] h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="custom_price_value" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Precio"}</label>
                              <input name="custom_price_value" type="number" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Hasta"}/>
                            </div>
                          <Button onClick={()=>handleAddCustomPrice("form_create_experience")} size="sm" type="button" variant="dark" effect="default" isRound={true} className="w-[10%] my-auto">+</Button>
                        </div>

                        <div className="w-full h-auto">
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
                                          Desde: <label className="text-tertiary ml-2 text-xs">{formatDate(price.dateFrom)}</label>
                                        </span>
                                        <span className="w-[30%]">
                                          Hasta: <label className="text-tertiary ml-2 text-xs">{formatDate(price.dateTo)}</label>
                                        </span>
                                        <span className="w-[30%]">
                                          Precio: <label className="text-tertiary ml-2">S/{price.price.toFixed(2)}</label>
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveCustomPrice(index)}
                                          className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-red-400 hover:text-white rounded-xl duration-300 hover:border-red-400"
                                        >
                                          Borrar
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
                              {errorMessages.customPrices}
                            </motion.p>
                          )}
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

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                        <label htmlFor="price" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Sugerencias de la experiencia"}</label>
                        <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-[75%] h-auto gap-y-2 sm:gap-y-1">
                              <textarea name="suggestion_input" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Sugerencias"}/>
                            </div>
                            <Button onClick={()=>handleAddSuggestion("form_create_experience")} size="sm" type="button" variant="dark" effect="default" isRound={true} className="w-[10%] my-auto">+</Button>
                        </div>

                        <div className="w-full h-auto">
                          <AnimatePresence>
                            {suggestions.map((suggestion, index) => (
                                      <motion.div
                                        key={index}
                                        initial="hidden"
                                        animate="show"
                                        exit="hidden"
                                        viewport={{ once: true }}
                                        variants={fadeIn("up","",0,0.3)}
                                        className="w-full h-auto flex flex-row justify-between items-center rounded-xl border border-slate-200 px-4 py-2 my-2 text-sm"
                                      >
                                        <span className="w-[90%]">
                                          {`Sug. ${index+1}:`} <label className="text-tertiary ml-2 text-xs">{suggestion}</label>
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveSuggestion(index)}
                                          className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-red-400 hover:text-white rounded-xl duration-300 hover:border-red-400"
                                        >
                                          Borrar
                                        </button>
                                      </motion.div>
                                    ))}
                          </AnimatePresence>
                        </div>

                        <div className="w-full h-6">
                          {errorMessages.suggestions && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {errorMessages.suggestions}
                            </motion.p>
                          )}
                        </div>

                      </div>

                      <div className="flex flex-row justify-end gap-x-6 w-full">
                          <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>Cancelar</Button>
                          <Button type="submit" size="sm" variant="dark" effect="default" isRound={true} isLoading={loadingForm}> Crear Experiencia </Button>
                      </div>

                  </div>
                </form>
            </motion.div>
        )}

        {currentView === "E" && selectedExperience && (
                <motion.div 
                    key={"Edit-View"}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    viewport={{ once: true }}
                    variants={fadeIn("up","",0.5,0.3)}
                    className="w-full h-auto flex flex-col justify-start items-start gap-y-4">
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><FlameKindlingIcon/>Editar Experiencia</h2>

                  <form id="form_update_experience" className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" onSubmit={(e)=>onSubmitUpdate(e)}>

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%] h-full">

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="categoryId" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Categoria"}</label>
                                <select name="categoryId" onChange={(e)=>onChangeSelectedExperience(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                                  { datasetExperiencesCategory.map((category,index)=>{
                                    return(
                                      <option key={index} value={category.id} selected={category.id == selectedExperience.category.id}>{category.name}</option>
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
                                      {errorMessages.categoryId}
                                    </motion.p>
                                  )}
                                </div>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="header" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Encabezado de la Experiencia"}</label>
                            <input name="header" value={selectedExperience.header}  onChange={(e)=>onChangeSelectedExperience(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Encabezado de la Experiencia"}/>
                            <div className="w-full h-6">
                              {errorMessages.header && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {errorMessages.header}
                                </motion.p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="name" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Nombre de la Experiencia"}</label>
                            <input name="name" value={selectedExperience.name}  onChange={(e)=>onChangeSelectedExperience(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Nombre de la Experiencia"}/>
                            <div className="w-full h-6">
                              {errorMessages.name && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {errorMessages.name}
                                </motion.p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="description" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Descripcion"}</label>
                            <textarea name="description"  onChange={(e)=>onChangeSelectedExperience(e)} className="w-full h-8 sm:h-24 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary mt-2" placeholder={"Descripcion"}>{selectedExperience.description}</textarea>
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
                              <label htmlFor="price" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Precio Fijo"}</label>
                              <input name="price" value={selectedExperience.price}  onChange={(e)=>onChangeSelectedExperience(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Precio Fijo"}/>

                              <div className="w-full h-6">
                                {errorMessages.price && (
                                  <motion.p 
                                    initial="hidden"
                                    animate="show"
                                    exit="hidden"
                                    variants={fadeIn("up","", 0, 1)}
                                    className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                    {errorMessages.price}
                                  </motion.p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">

                              <label htmlFor="duration" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Duracion en minutos"}</label>
                              <input name="duration" value={selectedExperience.duration}  onChange={(e)=>onChangeSelectedExperience(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Duracion"}/>

                              <div className="w-full h-6">
                                {errorMessages.duration && (
                                  <motion.p 
                                    initial="hidden"
                                    animate="show"
                                    exit="hidden"
                                    variants={fadeIn("up","", 0, 1)}
                                    className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                    {errorMessages.duration}
                                  </motion.p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="limit_age" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Limite de edad"}</label>
                              <input name="limit_age" value={selectedExperience.limit_age}  onChange={(e)=>onChangeSelectedExperience(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Limite de edad"}/>

                              <div className="w-full h-6">
                                {errorMessages.limit_age && (
                                  <motion.p 
                                    initial="hidden"
                                    animate="show"
                                    exit="hidden"
                                    variants={fadeIn("up","", 0, 1)}
                                    className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                    {errorMessages.limit_age}
                                  </motion.p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">

                              <label htmlFor="qtypeople" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Cantidad de personas"}</label>
                              <input name="qtypeople" value={selectedExperience.qtypeople}  onChange={(e)=>onChangeSelectedExperience(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad de personas"}/>

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
                          </div>


                      </div>

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%]">

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                            <label htmlFor="price" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Precios Personalizados"}</label>
                            <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                                <div className="flex flex-col justify-start itemst-start gap-x-6 w-[25%] h-auto gap-y-2 sm:gap-y-1">
                                  <label htmlFor="custom_price_date_from" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Desde"}</label>
                                  <input name="custom_price_date_from" type="date" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Desde"}/>
                                </div>

                                <div className="flex flex-col justify-start itemst-start gap-x-6 w-[25%] h-auto gap-y-2 sm:gap-y-1">
                                  <label htmlFor="custom_price_date_to" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Hasta"}</label>
                                  <input name="custom_price_date_to" type="date" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Hasta"}/>
                                </div>

                                <div className="flex flex-col justify-start itemst-start gap-x-6 w-[25%] h-auto gap-y-2 sm:gap-y-1">
                                  <label htmlFor="custom_price_value" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Precio"}</label>
                                  <input name="custom_price_value" type="number" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Hasta"}/>
                                </div>
                                <Button onClick={()=>handleAddCustomPrice("form_update_experience")} size="sm" type="button" variant="dark" effect="default" isRound={true} className="w-[10%] my-auto">+</Button>
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
                                              Desde: <label className="text-tertiary ml-2 text-xs">{formatDate(price.dateFrom)}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              Hasta: <label className="text-tertiary ml-2 text-xs">{formatDate(price.dateTo)}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              Precio: <label className="text-tertiary ml-2">S/{price.price.toFixed(2)}</label>
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveCustomPrice(index)}
                                              className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-red-400 hover:text-white rounded-xl duration-300 hover:border-red-400"
                                            >
                                              Borrar
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
                                  {errorMessages.customPrices}
                                </motion.p>
                              )}
                            </div>
                          </div>


                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="status" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Estatus"}</label>
                            <select name="status" onChange={(e)=>onChangeSelectedExperience(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                              <option value="ACTIVE" selected={selectedExperience.status == "ACTIVE"}>ACTIVO</option>
                              <option value="INACTIVE" selected={selectedExperience.status == "INACTIVE"}>INACTIVO</option>
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

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                            <label htmlFor="price" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Sugerencias de la experiencia"}</label>
                            <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                                <div className="flex flex-col justify-start itemst-start gap-x-6 w-[75%] h-auto gap-y-2 sm:gap-y-1">
                                  <textarea name="suggestion_input" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Sugerencias"}/>
                                </div>
                                <Button onClick={()=>handleAddSuggestion("form_update_experience")} size="sm" type="button" variant="dark" effect="default" isRound={true} className="w-[10%] my-auto">+</Button>
                            </div>

                            <div className="w-full h-auto">
                              <AnimatePresence>
                                {suggestions.map((suggestion, index) => (
                                          <motion.div
                                            key={index}
                                            initial="hidden"
                                            animate="show"
                                            exit="hidden"
                                            viewport={{ once: true }}
                                            variants={fadeIn("up","",0,0.3)}
                                            className="w-full h-auto flex flex-row justify-between items-center rounded-xl border border-slate-200 px-4 py-2 my-2 text-sm"
                                          >
                                            <span className="w-[90%]">
                                              {`Sug. ${index+1}:`} <label className="text-tertiary ml-2 text-xs">{suggestion}</label>
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveSuggestion(index)}
                                              className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-red-400 hover:text-white rounded-xl duration-300 hover:border-red-400"
                                            >
                                              Borrar
                                            </button>
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>

                            <div className="w-full h-6">
                              {errorMessages.suggestions && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {errorMessages.suggestions}
                                </motion.p>
                              )}
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

export default DashboardAdminExperiences;
