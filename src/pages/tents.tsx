import Dashboard from "../components/ui/Dashboard";
import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { Eye, Pen, X, ChevronLeft, ChevronRight, Tent as TentIcon, EyeOff, CircleX, UserX, UserRoundCheck, User as UserIcon, MailCheck, UserPen } from "lucide-react";
import Button from "../components/ui/Button";
import { InputRadio } from "../components/ui/Input";
import { formatServices, formatDate } from "../lib/utils";
import { getAllTents, createTent, deleteTent,disableTent, enableTent, updateTent } from "../db/actions/tents";
import { useAuth } from "../contexts/AuthContext";
import { Tent, TentFilters, TentFormData, CustomPrice } from "../lib/interfaces";
import { AnimatePresence, motion } from "framer-motion";
import {fadeIn} from "../lib/motions";
import {  ZodError } from 'zod';
import { TentSchema } from "../db/schemas";
import Modal from "../components/Modal";
import {toast} from "sonner";

interface Image {
  url: string;
  file: File;
}


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

    const [images, setImages] = useState<Image[]>([]);

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages: Image[] = files.map(file => ({
        url: URL.createObjectURL(file),
        file
      }));
      setImages(prevImages => [...prevImages, ...newImages]);
      e.target.value = ''; // Resetear el input file
    }
    };

    const handleRemoveImage = (url: string) => {
      setImages(prevImages => prevImages.filter(image => image.url !== url));
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

    const validateFields = (): boolean => {
        const form = document.getElementById('form_create_tent') as HTMLFormElement;
        const title = (form.querySelector('input[name="title"]') as HTMLInputElement).value;
        const description = (form.querySelector('textarea[name="description"]') as HTMLTextAreaElement).value;
        const header = (form.querySelector('input[name="header"]') as HTMLInputElement).value;
        const qtypeople = Number((form.querySelector('input[name="qtypeople"]') as HTMLInputElement).value);
        const qtykids = Number((form.querySelector('input[name="qtykids"]') as HTMLInputElement).value);
        const price = Number((form.querySelector('input[name="price"]') as HTMLInputElement).value);
        const status = (form.querySelector('select[name="status"]') as HTMLInputElement).value;

        // Clear previous error messages
        form.querySelectorAll('.error-message').forEach(errorElement => {
          errorElement.textContent = '';
        });

        try {
          TentSchema.parse({ title, description, header, images: images.map(image => image.file),  qtypeople, qtykids, price, services:getServices() , custom_price:customPrices, status });
          return true;
        } catch (error) {
          if (error instanceof ZodError) {
            error.errors.forEach(err => {
              console.log(err);
              const fieldName = err.path[0];
              const errorElement = form.querySelector(`#create_tent_error_${fieldName}`) as HTMLLabelElement;
              if (errorElement) {
                errorElement.textContent = err.message;
                errorElement.classList.remove('hidden');
              }
            });
          }
          return false;
        }
    };

    const onSubmitCreation = async (e: FormEvent) => {
        e.preventDefault();
        setLoadingForm(true);
        if (validateFields()) {
          console.log("this is executed")
          const form = document.getElementById('form_create_tent') as HTMLFormElement;
          const title = (form.querySelector('input[name="title"]') as HTMLInputElement).value;
          const description = (form.querySelector('textarea[name="description"]') as HTMLTextAreaElement).value;
          const header = (form.querySelector('input[name="header"]') as HTMLInputElement).value;
          const qtypeople = Number((form.querySelector('input[name="qtypeople"]') as HTMLInputElement).value);
          const qtykids = Number((form.querySelector('input[name="qtykids"]') as HTMLInputElement).value);
          const price = Number((form.querySelector('input[name="price"]') as HTMLInputElement).value);
          const status = (form.querySelector('select[name="status"]') as HTMLInputElement).value;

          const formData: TentFormData = {
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

          if(user !== null){
            await createTent(formData, user.token);
          }
          getTentsHandler(1);
          setLoadingForm(false);
          setCurrentView("L")
        }
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

    const disabledTentHandler = async( userId:Number ) => {
        if(user != null){
            await disableTent(userId,user.token);
        }
        getTentsHandler(1);
    }
    const enabledTentHandler = async(userId:Number) => {
        if(user != null){
            await enableTent(userId,user.token);
        }
        getTentsHandler(1);
    }

    const onSubmitUpdate = async (data: TentFormData) => {
        setLoadingForm(true);
        if(user !== null && selectedTent != null){
            await updateTent(selectedTent.id,data, user.token);
        }
        getTentsHandler(1);
        setLoadingForm(false);
        setCurrentView("L")
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
                                        <td className="">{tentItem.price}</td>
                                        <td className="">{formatServices(tentItem.services)}</td>
                                        <td className="">{tentItem.status != "ACTIVE" ? "INACTIVO" : "ACTIVO" }</td>
                                        <td className="">{tentItem.updatedAt != undefined && tentItem.updatedAt != null ? formatDate(tentItem.updatedAt) : "None"}</td>
                                        <td className="">{tentItem.createdAt != undefined && tentItem.createdAt != null ? formatDate(tentItem.createdAt) : "None"}</td>
                                        <td className="flex flex-row flex-wrap gap-x-2">
                                            <button onClick={()=>{setSelectedTent(tentItem); setCurrentView("V")}} className="border rounded-md hover:bg-primary hover:text-white duration-300 active:scale-75 p-1"><Eye className="h-5 w-5"/></button>
                                            <button  onClick={()=>{setSelectedTent(tentItem); setCurrentView("E")}} className="border rounded-md hover:bg-primary hover:text-white duration-300 active:scale-75 p-1"><Pen className="h-5 w-5"/></button>
                                            <button onClick={()=>{setOpenDeleteModal(true),setSelectedTent(tentItem)}} className="border rounded-md hover:bg-red-400 hover:text-white duration-300 active:scale-75 p-1"><X className="h-5 w-5"/></button>
                                            {tentItem.status == "INACTIVe" ?
                                            <button onClick={()=>{enabledTentHandler(tentItem.id)}} className="border rounded-md hover:bg-primary hover:text-white duration-300 active:scale-75 p-1"><UserRoundCheck className="h-5 w-5"/></button>
                                            :
                                            <button onClick={()=>{disabledTentHandler(tentItem.id)}} className="border rounded-md hover:bg-red-400 hover:text-white duration-300 active:scale-75 p-1"><UserX className="h-5 w-5"/></button>

                                            }
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
                    <div className="w-full h-auto flex flex-col items-center justify-center text-secondary pb-6 px-6 pt-12">
                      <CircleX className="h-[60px] w-[60px] text-red-400"/>
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
                    key={"User-View"}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    viewport={{ once: true }}
                    variants={fadeIn("up","",0.5,0.3)}
                    className="w-full h-auto flex flex-col justify-start items-start gap-y-4">
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><UserIcon/> Ver Usuario</h2>

                    <div className="w-full h-auto grid grid-cols-2 gap-6 p-6">


                      <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1 gap-x-6">
                          <div className="flex flex-col justify-start items-start w-[50%] h-auto">
                            <label htmlFor="isDisabled" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Estado de Usuario"}</label>
                              <div className={`w-full flex flex-row justify-start items-center h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 gap-x-4 ${ selectedTent?.isDisabled ? "text-tertiary" : "text-primary" }`}> <UserIcon className="h-5 w-5"/> { selectedTent?.isDisabled ? "Inhabilitado" : "Habilitado" }</div>
                          </div>
                          <div className="flex flex-col justify-start items-start w-[50%] h-auto">
                            <label htmlFor="EmailVerified" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Estado de Email"}</label>
                              <div className={`w-full flex flex-row justify-start items-center h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 gap-x-4 ${ selectedTent?.emailVerified ? "text-primary" : "text-tertiary" }`} > <MailCheck className="h-5 w-5"/> { selectedTent?.emailVerified ? "Verificado" : "No Verificado" }</div>
                          </div>
                      </div>


                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="email" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Correo Electronico"}</label>
                        <input  name="email" value={selectedTent?.email} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Correo Electronico"} disabled/>
                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="firstName" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Primer Nombre"}</label>
                        <input name="firstName" value={selectedTent?.firstName} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Primer Nombre"} disabled/>
                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="lastName" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Apellido"}</label>
                        <input name="lastName" value={selectedTent?.lastName} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Apellido"} disabled/>
                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="phoneNumber" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Celular"}</label>
                        <input name="phoneNumber" value={selectedTent?.phoneNumber} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Celular"} disabled/>
                      </div>



                    <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                      <label htmlFor="role" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Rol"}</label>
                      <select name="role" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                        <option value={selectedTent?.role} selected>{selectedTent?.role != "SUPERVISOR" ? (selectedTent?.role  != "CLIENT" ? "ADMIN" :"CLIENTE" ) : "SUPERVISOR" }</option>
                      </select>
                    </div>

                  <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                    <label htmlFor="createdAt" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Ultimo Cambio de Contraseña"}</label>
                      <div className="w-full flex flex-col justify-end items-start h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" >{selectedTent?.lastPasswordChanged ? formatDate(selectedTent?.lastPasswordChanged) : "None"}</div>
                  </div>

                  <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                    <label htmlFor="createdAt" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Ultimo Inicio de Sesion"}</label>
                      <div className="w-full flex flex-col justify-end items-start h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" >{selectedTent?.lastLogin ? formatDate(selectedTent?.lastLogin) : "None"}</div>
                  </div>

                  <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                    <label htmlFor="createdAt" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Creado"}</label>
                      <div className="w-full flex flex-col justify-end items-start h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" >{selectedTent?.createdAt ? formatDate(selectedTent?.createdAt) : "None"}</div>
                  </div>

                  <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                    <label htmlFor="updatedAt" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Actualizado"}</label>

                    <div className="w-full flex flex-col justify-end items-start h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" >{selectedTent?.updatedAt ? formatDate(selectedTent?.updatedAt) : "None"}</div>
                  </div>

                    <div className="flex flex-row justify-end gap-x-6 w-full col-span-2">
                        <Button type="button" onClick={()=>{setSelectedUser(null); setCurrentView("L")}} size="sm" variant="dark" effect="default" isRound={true}>Voler a la lista de Usuarios</Button>
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
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><TentIcon/>Agregar Glamping</h2>

                  <form id="form_create_tent" className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" onSubmit={(e)=>onSubmitCreation(e)}>

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%] h-full">

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="header" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Encabezado"}</label>
                            <input name="header" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Encabezado"}/>
                            <div className="w-full h-6">
                              <motion.p 
                                id="create_tent_error_header"
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="hidden h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              </motion.p>
                            </div>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="title" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Titulo"}</label>
                            <input name="title" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Titulo"}/>
                            <div className="w-full h-6">
                              <motion.p 
                                id="create_tent_error_title"
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="hidden h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              </motion.p>
                            </div>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="description" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Descripcion"}</label>
                            <textarea name="description" className="w-full h-8 sm:h-24 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary mt-2" placeholder={"Descripcion"}/>
                            <div className="w-full h-6">
                              <motion.p 
                                id="create_tent_error_description"
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="hidden h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              </motion.p>
                            </div>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="price" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Precio Fijo"}</label>
                            <input name="price" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Precio Fijo"}/>
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
                              {customPrices.map((price, index) => (
                                        <div
                                          key={index}
                                          className="w-full h-auto flex flex-row justify-between items-center rounded-xl border border-slate-200 px-4 py-2 my-2 text-sm"
                                        >
                                          <span className="w-[30%]">
                                            Desde: <label className="text-tertiary ml-2">{price.dateFrom.toLocaleDateString()}</label>
                                          </span>
                                          <span className="w-[30%]">
                                            Hasta: <label className="text-tertiary ml-2">{price.dateTo.toLocaleDateString()}</label>
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
                                        </div>
                                      ))}
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
                          </div>


                          
                          <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                              <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                                <label htmlFor="qtypeople" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Numero de Personas"}</label>
                                <input name="qtypeople" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Numero de Personas"}/>
                              </div>

                              <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                                <label htmlFor="qtykids" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Numero de niños"}</label>
                                <input name="qtykids" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Numero de niños"}/>
                              </div>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="services" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Servicios"}</label>
                              <div id="input_tent_create_services" className="flex flex-row flex-wrap justify-start items-start w-full h-auto p-2 gap-y-4 gap-x-6">
                                <div className="checkbox-wrapper-1">
                                  <input name="wifi" className="substituted" type="checkbox" aria-hidden="true"  />
                                  <label htmlFor="wifi">Wi-fi</label>
                                </div>

                                <div className="checkbox-wrapper-1">
                                  <input name="parking" className="substituted" type="checkbox" aria-hidden="true" />
                                  <label htmlFor="parking">Parking</label>
                                </div>

                                <div className="checkbox-wrapper-1">
                                  <input name="pool" className="substituted" type="checkbox" aria-hidden="true" />
                                  <label htmlFor="pool">Piscina</label>
                                </div>

                                <div className="checkbox-wrapper-1">
                                  <input name="breakfast" className="substituted" type="checkbox" aria-hidden="true" />
                                  <label htmlFor="breakfast">Desayuno</label>
                                </div>

                                <div className="checkbox-wrapper-1">
                                  <input name="lunch" className="substituted" type="checkbox" aria-hidden="true" />
                                  <label htmlFor="lunch">Almuerzo</label>
                                </div>

                                <div className="checkbox-wrapper-1">
                                  <input name="dinner" className="substituted" type="checkbox" aria-hidden="true" />
                                  <label htmlFor="dinner">Cena</label>
                                </div>

                                <div className="checkbox-wrapper-1">
                                  <input name="spa" className="substituted" type="checkbox" aria-hidden="true" />
                                  <label htmlFor="spa">Spa</label>
                                </div>

                                <div className="checkbox-wrapper-1">
                                  <input name="bar" className="substituted" type="checkbox" aria-hidden="true" />
                                  <label htmlFor="bar">Bar</label>
                                </div>

                                <div className="checkbox-wrapper-1">
                                  <input name="hotwater" className="substituted" type="checkbox" aria-hidden="true" />
                                  <label htmlFor="hotwater">Agua Caliente</label>
                                </div>

                                <div className="checkbox-wrapper-1">
                                  <input name="airconditioning" className="substituted" type="checkbox" aria-hidden="true" />
                                  <label htmlFor="airconditioning">Aire Acondicionado</label>
                                </div>

                                <div className="checkbox-wrapper-1">
                                  <input name="grill" className="substituted" type="checkbox" aria-hidden="true" />
                                  <label htmlFor="grill">Aire Acondicionado</label>
                                </div>
                              </div>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="image" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Imagenes"}</label>
                              <div className="flex flex-row flex-wrap justify-start items-start w-full h-auto p-4 gap-6">
                              {images.map((image, index) => (
                                <div
                                  key={index}
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
                                </div>
                              ))}
                                <div className="file-select" id="src-tent-image" >
                                  <input type="file" name="src-tent-image" aria-label="Archivo" onChange={handleImageChange} multiple/>
                                </div>
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
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><UserPen/>Editar Usuario</h2>

                    <form className="w-full h-auto grid grid-cols-2 gap-6 p-6" onSubmit={handleSubmit(onSubmitUpdate)}>
                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="email" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Correo Electronico"}</label>
                        <input {...register("email")} 
                          className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Correo Electronico"}/>
                        <div className="w-full h-6">
                          {errors?.email && 
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">{errors.email.message ? errors.email.message : "Correo es requerido."}
                            </motion.p>
                          }
                        </div>
                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="password" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Contraseña"}</label>
                        <div className="h-auto w-full relative">
                          <input {...register("password")} 
                            defaultValue={selectedTent.password}
                            type={showPassword ? "text" : "password"}  className="relative w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Contraseña"}/>
                          <div onClick={()=>setShowPassword(!showPassword)} className="absolute top-0 right-2 h-full w-8 flex justify-center items-center cursor-pointer z-50">{ showPassword ? <EyeOff/> : <Eye />} </div>
                        </div>
                        <div className="w-full h-6">
                          {errors?.password && 
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">{errors.password.message ? errors.password.message : "Contraseña es requerida."}
                            </motion.p>
                          }
                        </div>
                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="firstName" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Primer Nombre"}</label>
                        <input {...register("firstName")} 
                          className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Primer Nombre"}/>
                        <div className="w-full h-6">
                          {errors?.firstName && 
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">{errors.firstName.message ? errors.firstName.message : "Nombre es requerido."}
                            </motion.p>
                          }
                        </div>
                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="lastName" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Apellido"}</label>
                        <input {...register("lastName")} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Apellido"}/>
                        <div className="w-full h-6">
                          {errors?.lastName && 
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">{errors.lastName.message ? errors.lastName.message : "Apellido es requerido."}
                            </motion.p>
                          }
                        </div>
                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="phoneNumber" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Celular"}</label>
                        <input {...register("phoneNumber")} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Celular"}/>
                        <div className="w-full h-6">
                          {errors?.phoneNumber && 
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">{errors.phoneNumber.message ? errors.phoneNumber.message : "Celular es requerido."}
                            </motion.p>
                          }
                        </div>
                      </div>

                    <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                      <label htmlFor="role" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Rol"}</label>
                      <select {...register("role")} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                        <option value="">Seleccionar Rol</option>
                        <option value="SUPERVISOR">SUPERVISOR</option>
                        <option value="CLIENT">CLIENTE</option>
                      </select>
                      <div className="w-full h-6">
                        {errors?.role && 
                          <motion.p 
                            initial="hidden"
                            animate="show"
                            exit="hidden"
                            variants={fadeIn("up","", 0, 1)}
                            className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {errors.role.message ? errors.role.message : "Rol es requerido."}
                          </motion.p>
                        }
                      </div>
                    </div>

                        <div className="flex flex-row justify-end gap-x-6 w-full col-span-2">
                            <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>Cancelar</Button>
                            <Button type="submit" size="sm" variant="dark" effect="default" isRound={true} isLoading={loadingForm}> Guardar </Button>
                        </div>
                    </form>
                </motion.div>
                )}

        </AnimatePresence>
    </Dashboard>
    )
}

export default DashboardAdminGlapings;
