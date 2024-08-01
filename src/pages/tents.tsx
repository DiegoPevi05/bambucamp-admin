import Dashboard from "../components/ui/Dashboard";
import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { Eye, Pen, X, ChevronLeft, ChevronRight, Tent as TentIcon, CircleX, User as UserIcon, Blocks, Image } from "lucide-react";
import Button from "../components/ui/Button";
import { InputRadio } from "../components/ui/Input";
import {  formatDate, getLabelService, createImagesArray } from "../lib/utils";
import { getAllTents, createTent, deleteTent, updateTent } from "../db/actions/tents";
import { useAuth } from "../contexts/AuthContext";
import { Tent, TentFilters, TentFormData, CustomPrice, ImageInterface } from "../lib/interfaces";
import { AnimatePresence, motion } from "framer-motion";
import {fadeIn, fadeOnly} from "../lib/motions";
import {  ZodError } from 'zod';
import { TentSchema } from "../db/schemas";
import Modal from "../components/Modal";
import {toast} from "sonner";


const DashboardAdminGlapings = () => {

    const { user } = useAuth();
    const [datasetTents,setDataSetTents] = useState<{tents:Tent[],totalPages:Number,currentPage:Number}>({tents:[],totalPages:1,currentPage:1})
    const [currentView,setCurrentView] = useState<string>("LOADING");

    useEffect(()=>{
        getTentsHandler(1);
    },[])

    const getTentsHandler = async (page:Number, filters?:TentFilters) => {
        setCurrentView("LOADING");
        if(user != null){
            const tents  = await getAllTents(user.token,page,filters);
            if(tents){
                setDataSetTents(tents);
                setCurrentView("L");
            }
        }
    }

    const [loadingForm, setLoadingForm] = useState<boolean>(false);

    const [images, setImages] = useState<ImageInterface[]>([]);

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages: ImageInterface[] = createImagesArray(files);
      setImages(prevImages => [...prevImages, ...newImages]);
      e.target.value = ''; // Resetear el input file
    }
    };

    const handleRemoveImage = (url: string) => {
      setImages(prevImages => prevImages.filter(image => image.url !== url));
    };

    
    type Services = typeof TentSchema._type.services;

    const formatServices = (services: Services) => {
      const serviceEntries = Object.entries(services);

      const serviceItems = serviceEntries.map(([key, value]) => {
        if (value) {
          return getLabelService(key);
        }
        return null;
      }).filter(item => item !== null);

      if(serviceItems.length > 0) return serviceItems.join(', ');

      return 'No hay Servicios';
    };

    const [customPrices, setCustomPrices] = useState<CustomPrice[]>([]);

    const handleAddCustomPrice = () => {
      const form = document.getElementById('form_create_tent') as HTMLFormElement;
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

    const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

    const validateFields = (formname:string): TentFormData |null => {
        const form = document.getElementById(formname) as HTMLFormElement;
        const title = (form.querySelector('input[name="title"]') as HTMLInputElement).value;
        const description = (form.querySelector('textarea[name="description"]') as HTMLTextAreaElement).value;
        const header = (form.querySelector('input[name="header"]') as HTMLInputElement).value;
        const qtypeople = Number((form.querySelector('input[name="qtypeople"]') as HTMLInputElement).value);
        const qtykids = Number((form.querySelector('input[name="qtykids"]') as HTMLInputElement).value);
        const price = Number((form.querySelector('input[name="price"]') as HTMLInputElement).value);
        const status = (form.querySelector('select[name="status"]') as HTMLInputElement).value;

        setErrorMessages({});

        try {
          TentSchema.parse({ title, description, header, images: images.map(image => image.file),  qtypeople, qtykids, price, services: getServices(), custom_price:customPrices, status });

          return {
            title,
            description,
            header,
            qtypeople,
            qtykids,
            price,
            status,
            custom_price:JSON.stringify(customPrices),
            images: images.map(image => image.file),
            services: JSON.stringify(getServices())
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
        const fieldsValidated = validateFields('form_create_tent');
        if(fieldsValidated != null){
          if(user !== null){
            await createTent(fieldsValidated, user.token);
          }
          getTentsHandler(1);
          setImages([]);
          setCustomPrices([]);
          setCurrentView("L")
        }
        setLoadingForm(false);
    };


    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);

    const [selectedTent, setSelectedTent] = useState<Tent|null>(null);

    const searchUserHandler = async() => {
        // Get the input value
        const searchValue = (document.querySelector('input[name="criteria_search_value"]') as HTMLInputElement).value.trim();

        // Get the selected criteria from radio buttons
        const selectedCriteria = (
        document.querySelector('input[name="criteria_search"]:checked') as HTMLInputElement
        )?.value;

        // Get the selected role from the select dropdown
        const selectedStatus = (document.querySelector('select[name="criteria_search_status"]') as HTMLSelectElement).value;

        // Construct filters based on input values and selected criteria
        const filters: TentFilters = {};
        if (selectedCriteria && searchValue) {
            filters[selectedCriteria as keyof TentFilters] = searchValue;
        }
        if (selectedStatus) {
            filters.status = selectedStatus;
        }

        getTentsHandler(1,filters);
    }

    const deleteTentHandler = async() => {
        if(user != null && selectedTent != null){
            await deleteTent(selectedTent.id,user.token)
        }
        getTentsHandler(1);
        setOpenDeleteModal(false);
    }

    const onChangeSelectedTent = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, type, checked, value } = e.target;
        const fieldValue = type === 'checkbox' ? checked : value;

        setSelectedTent(prevSelectedTent => {
            // Check if the field is part of the services
            if (prevSelectedTent.services.hasOwnProperty(name)) {
                return {
                    ...prevSelectedTent,
                    services: {
                        ...prevSelectedTent.services,
                        [name]: fieldValue,
                    },
                };
            } else {
                // Handle other fields
                return {
                    ...prevSelectedTent,
                    [name]: fieldValue,
                };
            }
        });
    };

    const onSubmitUpdate = async (e: FormEvent) => {
        e.preventDefault();
        setLoadingForm(true);
        const fieldsValidated = validateFields('form_update_tent');
        if(fieldsValidated != null){
          if(user !== null && selectedTent != null){
              await updateTent(selectedTent.id,fieldsValidated, user.token);
          }
          getTentsHandler(1);
          setCurrentView("L")
        }
        setLoadingForm(false);
    };

    const getServices = (): { [key: string]: boolean } => {
      const servicesDiv = document.getElementById('input_tent_create_services');
      const checkboxes = servicesDiv?.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
      const services: { [key: string]: boolean } = {};
      
      checkboxes?.forEach(checkbox => {
        services[checkbox.name] = checkbox.checked;
      });

      return services;
    };


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
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><TentIcon/>Glampings</h2>
                    <div className="w-full h-auto flex flex-row justify-between items-center gap-x-4">
                        <div className="w-auto h-auto flex flex-col md:flex-row justify-start items-start gap-y-4 gap-x-4">
                          <div className="flex flex-col md:flex-row items-start md:items-center gap-x-2">
                            <input 
                              type="text" 
                              name="criteria_search_value"
                              placeholder="Buscar usuario" 
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
                              <Button size="sm" variant="dark" effect="default" className="md:ml-4 mt-4 md:mt-0" onClick={()=>searchUserHandler()}>
                              Buscar
                            </Button>
                          </div>
                        </div>
                        <div className="w-auto h-auto flex flex-row justify-end items-start gap-y-4">
                            <Button onClick={()=>setCurrentView("A")} size="sm" variant="dark" effect="default" isRound={true}>Agregar Glamping <TentIcon/></Button>
                        </div>

                    </div>
                    <table className="h-full w-full shadow-xl rounded-xl text-center p-4">
                        <thead className="font-primary text-md bg-primary text-white">
                            <tr className="">
                                <th className="rounded-tl-xl p-2">#</th>
                                <th className="p-2">Nombre</th>
                                <th className="p-2">Personas</th>
                                <th className="p-2">Precio</th>
                                <th className="p-2">Servicios</th>
                                <th className="p-2">Imagenes</th>
                                <th className="p-2">Estatus</th>
                                <th className="p-2">Creado</th>
                                <th className="p-2">Actualizado</th>
                                <th className="rounded-tr-xl p-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="font-secondary text-sm">
                                {datasetTents.tents.map((tentItem,index)=>{
                                    return(
                                    <tr key={"user_key"+index} className="text-slate-400 hover:bg-secondary hover:text-white duration-300 cursor-pointer"> 
                                        <td className="">{tentItem.id}</td>
                                        <td className="">{tentItem.title}</td>
                                        <td className="flex flex-row gap-x-4 justify-around">
                                          <div className="flex flex-row gap-x-4"><UserIcon/>{tentItem.qtypeople}</div>
                                          <div className="flex flex-row gap-x-4"><Blocks/>{tentItem.qtykids}</div>
                                        </td>
                                        <td className="">{tentItem.price}</td>
                                        <td className="w-48">{formatServices(tentItem.services)}</td>
                                        <td className="flex flex-row flex-wrap items-start justify-start gap-2">
                                          {tentItem.images.map((img, index) => (
                                            <a key={index} href={`${import.meta.env.VITE_BACKEND_URL}/${img}`} target="_blank">
                                              <Image className="hover:text-tertiary duration-300"/>
                                            </a>
                                          ))}
                                        </td>
                                        <td className="h-full">{tentItem.status != "ACTIVE" ? "INACTIVO" : "ACTIVO" }</td>
                                        <td className="h-full">{tentItem.updatedAt != undefined && tentItem.updatedAt != null ? formatDate(tentItem.updatedAt) : "None"}</td>
                                        <td className="h-full">{tentItem.createdAt != undefined && tentItem.createdAt != null ? formatDate(tentItem.createdAt) : "None"}</td>
                                        <td className="h-full flex flex-col items-center justify-center">
                                          <div className="w-full h-auto flex flex-row flex-wrap gap-x-2">
                                            <button onClick={()=>{setSelectedTent(tentItem); setCurrentView("V")}} className="border rounded-md hover:bg-primary hover:text-white duration-300 active:scale-75 p-1"><Eye className="h-5 w-5"/></button>
                                            <button  onClick={()=>{setSelectedTent(tentItem); setCustomPrices(tentItem.custom_price) ; setCurrentView("E")}} className="border rounded-md hover:bg-primary hover:text-white duration-300 active:scale-75 p-1"><Pen className="h-5 w-5"/></button>
                                            <button onClick={()=>{setOpenDeleteModal(true),setSelectedTent(tentItem)}} className="border rounded-md hover:bg-red-400 hover:text-white duration-300 active:scale-75 p-1"><X className="h-5 w-5"/></button>
                                          </div>
                                        </td>
                                    </tr>
                                    )
                                })}
                        </tbody>
                    </table>
                    <div className="flex flex-row justify-between w-full">
                        <Button onClick={ () => getTentsHandler( Number(datasetTents.currentPage) - 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={datasetTents.currentPage == 1}> <ChevronLeft/>  </Button>
                        <Button onClick={ () => getTentsHandler( Number(datasetTents.currentPage) + 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={datasetTents.currentPage >= datasetTents.totalPages}> <ChevronRight/> </Button>
                    </div>
                </motion.div>

                <Modal isOpen={openDeleteModal} onClose={()=>setOpenDeleteModal(false)}>
                    <div className="w-[400px] h-auto flex flex-col items-center justify-center text-secondary pb-6 px-6 pt-12 text-center">
                        <CircleX className="h-[60px] w-[60px] text-red-400 "/>
                        <p className="text-primary">Estas seguro de eliminar esta tienda?</p>
                        <p className="text-sm mt-6 text-secondary">La tienda se eliminara si haces click en aceptar, las reservas no se perderan, pero no podran hacer mas reservas en la pagina</p>
                        <div className="flex flex-row justify-around w-full mt-6">
                            <Button size="sm" variant="dark" effect="default" isRound={true} onClick={()=>setOpenDeleteModal(false)}> Cancelar  </Button>
                            <Button size="sm" variant="danger" effect="default" isRound={true} onClick={()=>{deleteTentHandler()}}> Aceptar </Button>
                        </div>
                    </div>
                </Modal>
            </>

        )}

        {currentView == "V" && selectedTent && (
                <motion.div 
                    key={"New-View"}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    viewport={{ once: true }}
                    variants={fadeIn("up","",0.5,0.3)}
                    className="w-full h-auto flex flex-col justify-start items-start gap-y-4">
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><TentIcon/>Agregar Glamping</h2>

                  <form id="form_create_tent" className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" onSubmit={(e)=>onSubmitCreation(e)}>

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%] h-full">

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="header" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Encabezado"}</label>
                            <input name="header" value={selectedTent.header} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Encabezado"} disabled/>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="title" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Titulo"}</label>
                            <input name="title" value={selectedTent.title} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Titulo"} disabled/>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="description" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Descripcion"}</label>
                            <textarea name="description" className="w-full h-8 sm:h-24 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary mt-2" placeholder={"Descripcion"}>{ selectedTent.description }</textarea>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="price" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Precio Fijo"}</label>
                            <input name="price" value={selectedTent.price} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Precio Fijo"} disabled/>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                            <label htmlFor="price" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Precios Personalizados"}</label>
                            <div className="w-full h-auto flex flex-col items-start justify-start">
                              <AnimatePresence>
                                {selectedTent.custom_price.map((price, index) => (
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
                      </div>

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%]">
                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="status" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Estatus"}</label>
                            <select name="status" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                              <option value={selectedTent.status}>{selectedTent.status == "ACTIVE" ? "ACTIVO" : "INACTIVO"}</option>
                            </select>
                          </div>


                          
                          <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                              <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                                <label htmlFor="qtypeople" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Numero de Personas"}</label>
                                <input name="qtypeople" value={selectedTent.qtypeople} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Numero de Personas"} disabled/>
                              </div>

                              <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                                <label htmlFor="qtykids" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Numero de niños"}</label>
                                <input name="qtykids" value={selectedTent.qtykids} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Numero de niños"} disabled/>
                              </div>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="services" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Servicios"}</label>
                              <div id="input_tent_create_services" className="flex flex-row flex-wrap justify-start items-start w-full h-auto p-2 gap-y-4 gap-x-6">

                                <div className="checkbox-wrapper-13">
                                  <input name="wifi" type="checkbox" aria-hidden="true" checked={selectedTent.services.wifi}/>
                                  <label htmlFor="wifi">Wi-fi</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="parking"  type="checkbox" aria-hidden="true" checked={selectedTent.services.parking} />
                                  <label htmlFor="parking">Parking</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="pool"  type="checkbox" aria-hidden="true" checked={selectedTent.services.pool}/>
                                  <label htmlFor="pool">Piscina</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="breakfast"  type="checkbox" aria-hidden="true" checked={selectedTent.services.breakfast} />
                                  <label htmlFor="breakfast">Desayuno</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="lunch"  type="checkbox" aria-hidden="true" checked={selectedTent.services.lunch}/>
                                  <label htmlFor="lunch">Almuerzo</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="dinner"  type="checkbox" aria-hidden="true" checked={selectedTent.services.dinner}/>
                                  <label htmlFor="dinner">Cena</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="spa"  type="checkbox" aria-hidden="true" checked={selectedTent.services.spa}/>
                                  <label htmlFor="spa">Spa</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="bar"  type="checkbox" aria-hidden="true" checked={selectedTent.services.bar}/>
                                  <label htmlFor="bar">Bar</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="hotwater"  type="checkbox" aria-hidden="true" checked={selectedTent.services.hotwater}/>
                                  <label htmlFor="hotwater">Agua Caliente</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="airconditioning" type="checkbox" aria-hidden="true" checked={selectedTent.services.airconditioning}/>
                                  <label htmlFor="airconditioning">Aire Acondicionado</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="grill" type="checkbox" aria-hidden="true" checked={selectedTent.services.grill}/>
                                  <label htmlFor="grill">Parrilla</label>
                                </div>
                              </div>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="image" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Imagenes"}</label>
                              <div className="flex flex-row flex-wrap justify-start items-start w-full h-auto p-4 gap-6">
                                <AnimatePresence>
                                  {selectedTent.images.map((image, index) => (
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

                          <div className="flex flex-row justify-end gap-x-6 w-full">
                              <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>Volver a lista de Glampings</Button>
                          </div>

                      </div>
                    </form>
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
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><TentIcon/>Agregar Glamping</h2>

                  <form id="form_create_tent" className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" onSubmit={(e)=>onSubmitCreation(e)}>

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%] h-full">

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="header" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Encabezado"}</label>
                            <input name="header" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Encabezado"}/>
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
                            <label htmlFor="title" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Titulo"}</label>
                            <input name="title" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Titulo"}/>
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

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
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
                                <Button onClick={handleAddCustomPrice} size="sm" type="button" variant="dark" effect="default" isRound={true} className="w-[10%] my-auto">+</Button>
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
                      </div>

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%]">
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


                          
                          <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                              <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                                <label htmlFor="qtypeople" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Numero de Personas"}</label>
                                <input name="qtypeople" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Numero de Personas"}/>

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
                                <label htmlFor="qtykids" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Numero de niños"}</label>
                                <input name="qtykids" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Numero de niños"}/>
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
                            <label htmlFor="services" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Servicios"}</label>
                              <div id="input_tent_create_services" className="flex flex-row flex-wrap justify-start items-start w-full h-auto p-2 gap-y-4 gap-x-6">

                                <div className="checkbox-wrapper-13">
                                  <input name="wifi" type="checkbox" aria-hidden="true" />
                                  <label htmlFor="wifi">Wi-fi</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="parking"  type="checkbox" aria-hidden="true" />
                                  <label htmlFor="parking">Parking</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="pool"  type="checkbox" aria-hidden="true" />
                                  <label htmlFor="pool">Piscina</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="breakfast"  type="checkbox" aria-hidden="true" />
                                  <label htmlFor="breakfast">Desayuno</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="lunch"  type="checkbox" aria-hidden="true" />
                                  <label htmlFor="lunch">Almuerzo</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="dinner"  type="checkbox" aria-hidden="true" />
                                  <label htmlFor="dinner">Cena</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="spa"  type="checkbox" aria-hidden="true" />
                                  <label htmlFor="spa">Spa</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="bar"  type="checkbox" aria-hidden="true" />
                                  <label htmlFor="bar">Bar</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="hotwater"  type="checkbox" aria-hidden="true" />
                                  <label htmlFor="hotwater">Agua Caliente</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="airconditioning" type="checkbox" aria-hidden="true" />
                                  <label htmlFor="airconditioning">Aire Acondicionado</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="grill" type="checkbox" aria-hidden="true" />
                                  <label htmlFor="grill">Parrilla</label>
                                </div>
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

                          <div className="flex flex-row justify-end gap-x-6 w-full">
                              <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>Cancelar</Button>
                              <Button type="submit" size="sm" variant="dark" effect="default" isRound={true} isLoading={loadingForm}> Crear Glamping </Button>
                          </div>

                      </div>
                    </form>
                </motion.div>
        )}

        {currentView === "E" && selectedTent && (
                <motion.div 
                    key={"Edit-View"}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    viewport={{ once: true }}
                    variants={fadeIn("up","",0.5,0.3)}
                    className="w-full h-auto flex flex-col justify-start items-start gap-y-4">
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><TentIcon/>Editar Glamping</h2>

                  <form id="form_update_tent" className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" onSubmit={(e)=>onSubmitUpdate(e)}>

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%] h-full">

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="header" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Encabezado"}</label>
                            <input name="header" value={selectedTent.header}  onChange={(e)=>onChangeSelectedTent(e)}  className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Encabezado"}/>
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
                            <label htmlFor="title" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Titulo"}</label>
                            <input name="title" value={selectedTent.title}  onChange={(e)=>onChangeSelectedTent(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Titulo"}/>
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
                            <textarea name="description"  onChange={(e)=>onChangeSelectedTent(e)} className="w-full h-8 sm:h-24 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary mt-2" placeholder={"Descripcion"}>{selectedTent.description}</textarea>
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

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="price" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Precio Fijo"}</label>
                            <input name="price" value={selectedTent.price}  onChange={(e)=>onChangeSelectedTent(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Precio Fijo"}/>

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
                                <Button onClick={handleAddCustomPrice} size="sm" type="button" variant="dark" effect="default" isRound={true} className="w-[10%] my-auto">+</Button>
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
                      </div>

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%]">
                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="status" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Estatus"}</label>
                            <select name="status" onChange={(e)=>onChangeSelectedTent(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                              <option value="ACTIVE" selected={selectedTent.status == "ACTIVE"}>ACTIVO</option>
                              <option value="INACTIVE" selected={selectedTent.status == "INACTIVE"}>INACTIVO</option>
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


                          
                          <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                              <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                                <label htmlFor="qtypeople" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Numero de Personas"}</label>
                                <input name="qtypeople" value={selectedTent.qtypeople}  onChange={(e)=>onChangeSelectedTent(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Numero de Personas"}/>

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
                                <label htmlFor="qtykids" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Numero de niños"}</label>
                                <input name="qtykids" value={selectedTent.qtykids}  onChange={(e)=>onChangeSelectedTent(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Numero de niños"}/>

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
                            <label htmlFor="services" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Servicios"}</label>
                              <div id="input_tent_create_services" className="flex flex-row flex-wrap justify-start items-start w-full h-auto p-2 gap-y-4 gap-x-6">

                                <div className="checkbox-wrapper-13">
                                  <input name="wifi" type="checkbox" aria-hidden="true" onChange={onChangeSelectedTent}  checked={selectedTent.services.wifi}/>
                                  <label htmlFor="wifi">Wi-fi</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="parking"  type="checkbox" aria-hidden="true" onChange={onChangeSelectedTent}  checked={selectedTent.services.parking} />
                                  <label htmlFor="parking">Parking</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="pool"  type="checkbox" aria-hidden="true" onChange={onChangeSelectedTent}  checked={selectedTent.services.pool}/>
                                  <label htmlFor="pool">Piscina</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="breakfast"  type="checkbox" aria-hidden="true" onChange={onChangeSelectedTent}  checked={selectedTent.services.breakfast} />
                                  <label htmlFor="breakfast">Desayuno</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="lunch"  type="checkbox" aria-hidden="true" onChange={onChangeSelectedTent}  checked={selectedTent.services.lunch}/>
                                  <label htmlFor="lunch">Almuerzo</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="dinner"  type="checkbox" aria-hidden="true" onChange={onChangeSelectedTent}  checked={selectedTent.services.dinner}/>
                                  <label htmlFor="dinner">Cena</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="spa"  type="checkbox" aria-hidden="true" onChange={onChangeSelectedTent}  checked={selectedTent.services.spa}/>
                                  <label htmlFor="spa">Spa</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="bar"  type="checkbox" aria-hidden="true" onChange={onChangeSelectedTent}  checked={selectedTent.services.bar}/>
                                  <label htmlFor="bar">Bar</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="hotwater"  type="checkbox" aria-hidden="true" onChange={onChangeSelectedTent}  checked={selectedTent.services.hotwater}/>
                                  <label htmlFor="hotwater">Agua Caliente</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="airconditioning" type="checkbox" aria-hidden="true" onChange={onChangeSelectedTent}  checked={selectedTent.services.airconditioning} />
                                  <label htmlFor="airconditioning">Aire Acondicionado</label>
                                </div>

                                <div className="checkbox-wrapper-13">
                                  <input name="grill" type="checkbox" aria-hidden="true" onChange={onChangeSelectedTent}  checked={selectedTent.services.grill}/>
                                  <label htmlFor="grill">Parrilla</label>
                                </div>
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

export default DashboardAdminGlapings;
