import Dashboard from "../components/ui/Dashboard";
import { useState, useEffect, FormEvent } from "react";
import { Eye, Pen, X, ChevronLeft, ChevronRight, Calendar, CircleX,   FlameKindling, Tent, Pizza, Search  } from "lucide-react";
import Button from "../components/ui/Button";
import {  formatDate, formatToISODate, getTotalReserveCalculated, getCurrentCustomPrice,  calculatePrice } from "../lib/utils";
import { getAllReserveOptions, getAllReserves, createReserve, updateReserve, deleteReserve } from "../db/actions/reserves";
import { getAllUsers } from "../db/actions/users";
import { useAuth } from "../contexts/AuthContext";
import { UserFilters, Reserve, ReserveFilters, ReserveFormData, optionsReserve, ReserveTentDto, ReserveProductDto, ReserveExperienceDto, User } from "../lib/interfaces";
import { AnimatePresence, motion } from "framer-motion";
import {fadeIn, fadeOnly} from "../lib/motions";
import {  ZodError } from 'zod';
import { ReserveFormDataSchema } from "../db/schemas";
import Modal from "../components/Modal";
import { toast } from "sonner";
import {InputRadio} from "../components/ui/Input";


const DashboardAdminReserves = () => {

    const { user } = useAuth();
    const [datasetReserves,setDataSetReserves] = useState<{reserves:Reserve[],totalPages:Number,currentPage:Number}>({reserves:[],totalPages:1,currentPage:1});
    const [datasetReservesOptions, setDatasetReservesOptions] = useState<optionsReserve>({ tents:[], products:[], experiences:[], promotions:[], discounts:[] });
    const [tents,setTents] = useState<ReserveTentDto[]>([]);
    const [products,setProducts] = useState<ReserveProductDto[]>([]);
    const [experiences,setExperiences] = useState<ReserveExperienceDto[]>([]);
    const [criteriaReserve,setCriteriaReserve] = useState<string>("NORMAL");

    const [currentView,setCurrentView] = useState<string>("LOADING");

    useEffect(()=>{
        getReservesHandler(1);
        getReservesOptions();
    },[])

    const getReservesOptions = async() => {
      if(user != null){
          const ReserveOptions  = await getAllReserveOptions(user.token);
          if(ReserveOptions){
              setDatasetReservesOptions(ReserveOptions);
          }
      }
    }

    const getReservesHandler = async (page:Number, filters?:ReserveFilters) => {
        setCurrentView("LOADING");
        if(user != null){
            const reserves  = await getAllReserves(user.token,page,filters);
            if(reserves){
                setDataSetReserves(reserves);
                setCurrentView("L");
            }
        }
    }

    const [loadingForm, setLoadingForm] = useState<boolean>(false);

    const handleAddReserveOption = (formName:string, type:string) => {
      const form = document.getElementById(formName) as HTMLFormElement;
      const optionInput = form.querySelector(`select[name="promotion_option_${type}_id"]`) as HTMLSelectElement;
      const quantityInput = form.querySelector(`input[name="promotion_option_${type}_qty"]`) as HTMLInputElement;

      const no_custom_price = (form.querySelector(`input[name="promotion_option_${type}_no_special_price"]`) as HTMLInputElement).checked;


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

      if(type == "tent"){
        data = datasetReservesOptions.tents.find((i)=> i.id == id);
        if(data){
          const newOption: ReserveTentDto = { idTent: id , name: data.title , quantity, price: calculatePrice (data.price,data.custom_price, no_custom_price)};
          setTents([...tents, newOption]);
        }
      }else if(type == "product"){
        data = datasetReservesOptions.products.find((i)=> i.id == id);
        if(data){
          const newOption: ReserveProductDto = { idProduct: id , name: data.name , quantity, price:calculatePrice (data.price,data.custom_price, no_custom_price)  };
          setProducts([...products, newOption]);
        }
      }else if(type == "experience"){
        data = datasetReservesOptions.experiences.find((i)=> i.id == id);
        if(data){
          const newOption: ReserveExperienceDto = { idExperience: id , name: data.name , quantity, price:calculatePrice (data.price,data.custom_price, no_custom_price)  };
          setExperiences([...experiences, newOption]);
        }
      } 

      // Clear input fields
      optionInput.value = '';
      quantityInput.value = '';
      handleApplyDiscount(formName);

    };


    const handleRemoveReserveOption = (index: number,type:string) => {
        if(type == "tent") setTents(tents.filter((_,i)=> i !== index));
        if(type == "product") setProducts(products.filter((_,i)=> i !== index));
        if(type == "experience") setExperiences(experiences.filter((_,i)=> i !== index))
    };


    const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

    const validateFields = (formname:string): ReserveFormData |null => {
        const form = document.getElementById(formname) as HTMLFormElement;
        const userId = Number((form.querySelector('input[name="userId"]') as HTMLInputElement).value);
        const qtypeople = Number((form.querySelector('input[name="qtypeople"]') as HTMLInputElement).value);
        const qtykids = Number((form.querySelector('input[name="qtykids"]') as HTMLInputElement).value);
        const dateFrom = new Date ((form.querySelector('input[name="dateFrom"]') as HTMLInputElement).value);
        const dateTo = new Date ((form.querySelector('input[name="dateTo"]') as HTMLInputElement).value);

        const promotionId =  criteriaReserve == "PROMOTION" ? Number((form.querySelector('input[name="promotion_id"]') as HTMLInputElement).value) : 0;
        const price_is_calculated = criteriaReserve == "PROMOTION" ?  true : (form.querySelector('input[name="price_is_calculated"]') as HTMLInputElement).checked;

        const canceled_status = (form.querySelector('input[name="canceled_status"]') as HTMLInputElement).checked;
        const discountCodeId = Number((form.querySelector('select[name="discount_code_id"]') as HTMLInputElement).value) 

        const netImport = Number((form.querySelector('input[name="netImport"]') as HTMLInputElement).value);
        const discount = Number((form.querySelector('input[name="discount"]') as HTMLInputElement).value);
        const grossImport = Number((form.querySelector('input[name="grossImport"]') as HTMLInputElement).value);
        const canceled_reason = (form.querySelector('textarea[name="canceled_reason"]') as HTMLInputElement).value;
        const paymentStatus = (form.querySelector('select[name="payment_status"]') as HTMLInputElement).value;
        const aditionalPeople = Number((form.querySelector('input[name="additional_people"]') as HTMLInputElement).value);


        setErrorMessages({});

        try {

          ReserveFormDataSchema.parse({userId, tents, products,experiences , dateFrom, dateTo, promotionId, price_is_calculated, discountCodeId, qtykids,qtypeople, netImport, discount, grossImport , canceled_reason, canceled_status, paymentStatus, aditionalPeople });

          return {
            userId,
            tents,
            products,
            experiences,
            dateFrom,
            dateTo,
            dateSale: new Date(),
            promotionId,
            price_is_calculated,
            discountCodeId,
            qtykids,
            qtypeople,
            netImport,
            discount,
            grossImport,
            canceled_reason,
            canceled_status,
            paymentStatus,
            aditionalPeople
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
        const fieldsValidated = validateFields('form_create_reserve');
        if(fieldsValidated != null){
          if(user !== null){
            const isSuccess = await createReserve(fieldsValidated, user.token);
            if(!isSuccess){
              setLoadingForm(false);
              return;
            } 
          }
          getReservesHandler(1);
          setCurrentView("L")
        }
        setLoadingForm(false);
    };


    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);

    const [selectedReserve, setSelectedReserve] = useState<Reserve|null>(null);

    const searchReserveHandler = async() => {
      
        // Get the input value
        const searchValueFrom = (document.querySelector('input[name="criteria_search_value_date_from"]') as HTMLInputElement).value;
        const searchValueTo = (document.querySelector('input[name="criteria_search_value_date_from"]') as HTMLInputElement).value ;

        const selectedPaymentStatus = (document.querySelector('select[name="criteria_search_status"]') as HTMLSelectElement).value;

        // Construct filters based on input values and selected criteria
        const filters: ReserveFilters = {};

        if (searchValueFrom) {
            filters["dateFrom"] = searchValueFrom;
        }

        if (searchValueFrom) {
            filters["dateTo"] = searchValueTo;
        }

        if(selectedPaymentStatus){
          filters.paymentStatus =  selectedPaymentStatus;
        }

        getReservesHandler(1,filters);
    }

    const deleteReserveHandler = async() => {
        if(user != null && selectedReserve != null){
            const isSuccess = await deleteReserve(selectedReserve.id,user.token)
            if(!isSuccess){
              return;
            } 
        }
        getReservesHandler(1);
        setOpenDeleteModal(false);
    }

    const onChangeSelectedReserve = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, type, value } = e.target;
        
        // Convert the value to a Date object if the input type is 'date'
        let fieldValue: any = value;

        if (type === 'date') {
          const date = new Date(value);
          const localOffset = date.getTimezoneOffset();
          const localDate = new Date( date.getTime() + localOffset );
          fieldValue = localDate;
        }

        setSelectedReserve(prevSelectedReserve => {
            if (!prevSelectedReserve) return null;
            return {
                ...prevSelectedReserve,
                [name]: fieldValue,
            };
        });
    };

    const onSubmitUpdate = async (e: FormEvent) => {
        e.preventDefault();
        setLoadingForm(true);
        const fieldsValidated = validateFields('form_update_promotion');
        if(fieldsValidated != null){
          if(user !== null && selectedReserve != null){
            const isSuccess =  await updateReserve(selectedReserve.id,fieldsValidated, user.token);
            if(!isSuccess){
              setLoadingForm(false);
              return;
            } 
          }
          getReservesHandler(1);
          setCurrentView("L")
        }
        setLoadingForm(false);
    };


    const calculateAmountLocally = (formname:string) => {
        const form = document.getElementById(formname) as HTMLFormElement;
        const discountInput = (form.querySelector('input[name="discount"]') as HTMLInputElement);
        const netImportInput = (form.querySelector('input[name="netImport"]') as HTMLInputElement);
        const grossImportInput = (form.querySelector('input[name="grossImport"]') as HTMLInputElement); 

        const discountValue = Number(discountInput.value);
        const netImportValue = Number(netImportInput.value);

        if(discountValue <= 0) return grossImportInput.value = netImportValue.toString();
        if(discountValue > 100) return grossImportInput.value ="0";

        const valueCalendarounted = (1 - (discountValue)/100)* netImportValue;

        grossImportInput.value = valueCalendarounted.toString();
    }

    const [users,setUsers] = useState<User[]>([])

    const searchUsersByEmail = async(formname:string) => {
      const form = document.getElementById(formname) as HTMLFormElement;
      const email = (form.querySelector('input[name="search_user_email"]') as HTMLInputElement).value;

      const filters: UserFilters = {}

      if(email){
        filters['email'] =  email;
      }

      filters.role = "CLIENT";

      if(user != null){
          const usersDB  = await getAllUsers(user.token, 1, filters );
          if(usersDB){
              setUsers(usersDB.users);
          }
      }
    }
    const selectUserId = async(formname:string, user:User) => {
      const form = document.getElementById(formname) as HTMLFormElement;
      const userIdInput = form.querySelector('input[name="userId"]') as HTMLInputElement;
      const userIdNameInput = form.querySelector('input[name="userId_name"]') as HTMLInputElement;

      userIdInput.value = user.id.toString();
      userIdNameInput.value = user.firstName ? user.firstName : "";
      setUsers([]);
    }

    const handleApplyDiscount = async(formname:string) => {
      const form = document.getElementById(formname) as HTMLFormElement;
      const discountInput = form.querySelector('input[name="discount"]') as HTMLInputElement;
      const discountCodeInput = form.querySelector('select[name="discount_code_id"]') as HTMLInputElement;
      const discountCodeId = Number(discountCodeInput.value);
      if(discountCodeId > 0){
        const discount = datasetReservesOptions.discounts.find((i)=> i.id == Number(discountCodeId));
        discountInput.value = discount?.discount ? discount?.discount.toString() : "0";
        discountInput.disabled = true;
        calculateAmountLocally(formname);
      }else{
        discountInput.disabled = false;
        discountInput.value = "0";
      }

    }

    const changeReserveType = (e:React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setTents([]);
      setProducts([]);
      setExperiences([]);
      setCriteriaReserve(value);

     const inputs = document.querySelectorAll('input[name="netImport"], input[name="discount"], input[name="grossImport"]');

      inputs.forEach((input) => {
        (input as HTMLInputElement).disabled = false;
        (input as HTMLInputElement).value = '0';
      });
    }


    const mapItems = (items:any, idKey:any) => 
      items.map((item:any) => ({
        [`id${idKey.slice(2, 3).toUpperCase() + idKey.slice(3).toLowerCase()}`]: item.id,
        name: item.label,
        price: item.price,
        quantity: item.qty
    }));

    const applyPromotionToReserve = (formname:string) => {

      const form = document.getElementById(formname) as HTMLFormElement;
      const promotionInput = (form.querySelector('select[name="promotion_option_id"]') as HTMLInputElement);
      const promotionIdInput = (form.querySelector('input[name="promotion_id"]') as HTMLInputElement);
      const promotionId = Number(promotionInput.value);
      if(promotionId > 0){

        const discountInput = (form.querySelector('input[name="discount"]') as HTMLInputElement);
        const netImportInput = (form.querySelector('input[name="netImport"]') as HTMLInputElement);
        const grossImportInput = (form.querySelector('input[name="grossImport"]') as HTMLInputElement); 



        promotionIdInput.value = promotionId.toString();
        const promotion = datasetReservesOptions.promotions.find((i)=> i.id == Number(promotionId));

        if(promotion){
          netImportInput.value = promotion?.netImport.toString();
          netImportInput.disabled = true;
          discountInput.value = promotion?.discount.toString();
          discountInput.disabled = true;
          grossImportInput.value = promotion?.grossImport.toString();
          grossImportInput.disabled = true;

          const tents = promotion?.idtents ? mapItems(promotion.idtents, 'idtent') : [];
          setTents(tents);
          const products = promotion?.idproducts ? mapItems(promotion.idproducts, 'idProduct') : [];
          setProducts(products);
          const experiences = promotion?.idexperiences ? mapItems(promotion.idexperiences, 'idExperience') : [];
          setExperiences(experiences);
        }
      }
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
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><Calendar/>Reservas</h2>
                    <div className="w-full h-auto flex flex-row justify-between items-center gap-x-4">
                        <div className="w-auto h-auto flex flex-col md:flex-row justify-start items-start gap-y-4 gap-x-4">
                          <div className="flex flex-col md:flex-row items-start md:items-center gap-x-2">
                            <input 
                              type="date" 
                              name="criteria_search_value_date_from"
                              placeholder="Desde" 
                              className="w-48 h-8 text-xs font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-primary"
                            />
                            <input 
                              type="date" 
                              name="criteria_search_value_date_to"
                              placeholder="Hasta" 
                              className="w-48 h-8 text-xs font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-primary"
                            />
                          </div>
                          <div className="flex flex-col md:flex-row items-start md:items-center gap-x-2">
                              <label className="md:ml-4 flex items-center">
                                Estado de Pago
                                <select name="criteria_search_status" className="ml-2 h-8 text-xs font-tertiary border-b-2 border-secondary focus:outline-none focus:border-b-primary">
                                  <option value="">Seleccionar Estatus</option>
                                  <option value="PAID">PAGADO</option>
                                  <option value="PENDING">PENDIENTE</option>
                                  <option value="DEBT">DEBE</option>
                                </select>
                              </label>
                              <Button size="sm" variant="dark" effect="default" className="md:ml-4 mt-4 md:mt-0" onClick={()=>searchReserveHandler()}>
                              Buscar
                            </Button>
                          </div>
                        </div>
                        <div className="w-auto h-auto flex flex-row justify-end items-start gap-y-4 gap-x-4">
                          <Button onClick={()=>{setCurrentView("A"); setTents([]); setProducts([]); setExperiences([]);}} size="sm" variant="dark" effect="default" className="min-w-[300px]" isRound={true}>Agregar Reserva <Calendar/></Button>
                        </div>
                    </div>
                    <table className="h-full w-full shadow-xl rounded-xl text-center p-4">
                        <thead className="font-primary text-md bg-primary text-white">
                            <tr className="">
                                <th className="rounded-tl-xl p-2">#</th>
                                <th className="p-2">Usuario</th>
                                <th className="p-2">Desde</th>
                                <th className="p-2">Hasta</th>
                                <th className="p-2">Servicios y Productos</th>
                                <th className="p-2">Importe Total</th>
                                <th className="p-2">Cancelado</th>
                                <th className="p-2">Estado de Pago</th>
                                <th className="p-2">Creado</th>
                                <th className="p-2">Actualizado</th>
                                <th className="rounded-tr-xl p-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="font-secondary text-sm">
                                {datasetReserves.reserves.map((reserveItem,index)=>{
                                    return(
                                    <tr key={"user_key"+index} className="text-slate-400 hover:bg-secondary hover:text-white duration-300 cursor-pointer"> 
                                        <td className="">{reserveItem.id}</td>
                                        <td className="">{reserveItem.userId}</td>

                                        <td className="">{reserveItem.dateFrom !== undefined && reserveItem.dateFrom != null ? formatDate(reserveItem.dateFrom) : "None"}</td>
                                        <td className="">{reserveItem.dateFrom !== undefined && reserveItem.dateTo != null ? formatDate(reserveItem.dateTo) : "None"}</td>

                                        <td className="flex flex-row gap-x-4 justify-around">
                                          <div className="flex flex-row gap-x-2"><Tent/>{reserveItem.tents.length}</div>
                                          <div className="flex flex-row gap-x-2"><FlameKindling/>{reserveItem.experiences.length}</div>
                                          <div className="flex flex-row gap-x-2"><Pizza/>{reserveItem.products.length}</div>
                                        </td>
                                        <td className="">{`$ ${reserveItem.grossImport}`}</td>
                                      <td className="h-full">{reserveItem.canceled_status ? "CANCELADA": "ACTIVA" }</td>
                                        <td className="h-full">{reserveItem.paymentStatus != "PAID" ?  ( reserveItem.paymentStatus != "DEBT" ? "PENDIENTE" : "SIN PAGAR" ) : "PAGADO" }</td>
                                        <td className="h-full">{reserveItem.updatedAt != undefined && reserveItem.updatedAt != null ? formatDate(reserveItem.updatedAt) : "None"}</td>
                                        <td className="h-full">{reserveItem.createdAt != undefined && reserveItem.createdAt != null ? formatDate(reserveItem.createdAt) : "None"}</td>
                                        <td className="h-full flex flex-col items-center justify-center">
                                          <div className="w-full h-auto flex flex-row flex-wrap gap-x-2">
                                            <button onClick={()=>{setSelectedReserve(reserveItem);  setTents(reserveItem.tents); setProducts(reserveItem.products); setExperiences(reserveItem.experiences); setCurrentView("V")}} className="border rounded-md hover:bg-primary hover:text-white duration-300 active:scale-75 p-1"><Eye className="h-5 w-5"/></button>
                                            <button  onClick={()=>{setSelectedReserve(reserveItem); setTents(reserveItem.tents); setProducts(reserveItem.products); setExperiences(reserveItem.experiences); setCurrentView("E")}} className="border rounded-md hover:bg-primary hover:text-white duration-300 active:scale-75 p-1"><Pen className="h-5 w-5"/></button>
                                            <button onClick={()=>{setOpenDeleteModal(true),setSelectedReserve(reserveItem)}} className="border rounded-md hover:bg-red-400 hover:text-white duration-300 active:scale-75 p-1"><X className="h-5 w-5"/></button>
                                          </div>
                                        </td>
                                    </tr>
                                    )
                                })}
                        </tbody>
                    </table>
                    <div className="flex flex-row justify-between w-full">
                        <Button onClick={ () => getReservesHandler( Number(datasetReserves.currentPage) - 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={datasetReserves.currentPage == 1}> <ChevronLeft/>  </Button>
                        <Button onClick={ () => getReservesHandler( Number(datasetReserves.currentPage) + 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={datasetReserves.currentPage >= datasetReserves.totalPages}> <ChevronRight/> </Button>
                    </div>
                </motion.div>

                <Modal isOpen={openDeleteModal} onClose={()=>setOpenDeleteModal(false)}>
                    <div className="w-[400px] h-auto flex flex-col items-center justify-center text-secondary pb-6 px-6 pt-12 text-center">
                        <CircleX className="h-[60px] w-[60px] text-red-400 "/>
                        <p className="text-primary">Estas seguro de eliminar esta reserva?</p>
                        <div className="flex flex-row justify-around w-full mt-6">
                            <Button size="sm" variant="dark" effect="default" isRound={true} onClick={()=>setOpenDeleteModal(false)}> Cancelar  </Button>
                            <Button size="sm" variant="danger" effect="default" isRound={true} onClick={()=>{deleteReserveHandler()}}> Aceptar </Button>
                        </div>
                    </div>
                </Modal>
            </>

        )}

        {currentView == "V" && selectedReserve && (
                <motion.div 
                    key={"New-View"}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    viewport={{ once: true }}
                    variants={fadeIn("up","",0.5,0.3)}
                    className="w-full h-auto flex flex-col justify-start items-start gap-y-4">
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><Calendar/>Ver Promocion</h2>

                  <div className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" >

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%] h-full">

                          <div className="flex flex-col justify-start items-start w-full h-auto my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="userId" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6"> Usuario</label>
                            <input name="userId" value={selectedReserve.id} className="hidden"/>
                            <input name="userId_name" value={selectedReserve.id} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Usuario seleccionado"} disabled/>
                          </div>

                        <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">

                          <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                            <label htmlFor="qtypeople" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Cantidad de personas"}</label>
                            <input name="qtypeople" type="number" value={selectedReserve.qtypeople} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad de personas"} disabled/>
                          </div>

                          <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                            <label htmlFor="qtykids"  className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Cantidad  de niños"}</label>
                            <input name="qtykids" type="number" value={selectedReserve.qtykids} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad de niños"} disabled/>
                          </div>

                        </div>

                        <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                          <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                            <label htmlFor="dateFrom" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Desde"}</label>
                            <input name="dateFrom" type="date" value={selectedReserve.dateFrom.toISOString()} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Hasta"} disabled/>
                          </div>

                          <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                            <label htmlFor="dateTo" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Hasta"}</label>
                            <input name="dateTo" type="date" value={selectedReserve.dateTo.toISOString()} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Hasta"} disabled/>
                          </div>

                        </div>

                        <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">

                          <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                            <label htmlFor="payment_status" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Estado de Pago"}</label>
                            <select name="payment_status" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                              <option value={selectedReserve.paymentStatus}>{selectedReserve.paymentStatus != "PAID" ?  (selectedReserve.paymentStatus == "DEBT" ? "DEBE" : "PENDIENTE")  : "PAGADO"}</option>
                            </select>
                          </div>

                          <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                            <label htmlFor="additional_people" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Cantidad de Personas adicionales"}</label>
                            <input name="additional_people" type="number" step="0.01" value={selectedReserve.aditionalPeople} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad de Personas adicionales"} disabled/>
                          </div>

                        </div>

                        <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1  gap-y-2">

                          <label htmlFor="canceled_reason" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6 mb-2">{"Cancelacion"}</label>

                            <div className="checkbox-wrapper-13 px-2">
                              <input name="canceled_status" type="checkbox" aria-hidden="true" checked={selectedReserve.canceled_status}/>
                              <label htmlFor="canceled_status">Reserva Cancelada?</label>
                            </div>

                            <textarea name="canceled_reason" className="w-full h-8 sm:h-20 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Razon de cancelacion"} disabled>{selectedReserve.canceled_reason}</textarea>
                        </div>
                    </div>

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%]">
                      {criteriaReserve === "NORMAL" ? 
                        <>
                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="price_is_calculated" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Precios Calculados?"}</label>
                            <div className="checkbox-wrapper-13 px-2">
                              <input name="price_is_calculated" type="checkbox" aria-hidden="true" checked={selectedReserve.price_is_calculated} />
                              <label className="text-[12px]" htmlFor="price_is_calculated">Los precios se calcularan en base a los precios de los productos</label>
                            </div>
                          </div>
                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                            <label htmlFor="glampings" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Glampings en la reserva"}</label>
                            <div className="w-full h-auto">
                              <AnimatePresence>
                                {tents.map((item, index) => (
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
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                            <label htmlFor="products" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Productos en la reserva"}</label>
                            <div className="w-full h-auto">
                              <AnimatePresence>
                                {products.map((item, index) => (
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
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                            <label htmlFor="experiences" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Experiencias en la reserva"}</label>
                            <div className="w-full h-auto">
                              <AnimatePresence>
                                {experiences.map((item, index) => (
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
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>
                          </div>
                        </>
                      :
                        <>
                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                            <label htmlFor="promotion_id" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Selecciona la promocion a aplicar en la reserva"}</label>
                            <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                                  <select name="promotion_option_id" className="w-[100%] h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                                      <option value={selectedReserve.promotionId}>{`Nombre: ${selectedReserve.promotionId} | Precio: $${selectedReserve.promotionId} | Descuento: ${selectedReserve.promotionId}%`}</option>
                                  </select>
                            </div>
                            <input name="promotion_id" value={selectedReserve.promotionId} className="hidden" disabled/>
                            <div className="w-full h-auto">
                              <AnimatePresence>
                                {tents.map((item, index) => (
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
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>
                            <div className="w-full h-auto">
                              <AnimatePresence>
                                {products.map((item, index) => (
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
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>
                            <div className="w-full h-auto">
                              <AnimatePresence>
                                {experiences.map((item, index) => (
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

                                              onClick={() => handleRemoveReserveOption(index,"experience")}
                                              className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-red-400 hover:text-white rounded-xl duration-300 hover:border-red-400"
                                            >
                                              Borrar
                                            </button>
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>
                          </div>
                        </>
                      }



                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                        <label htmlFor="discount_code_id" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Aplicar codigo de descuento"}</label>
                        <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                              <select name="discount_code_id" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                                  <option value={selectedReserve.discountCodeId}>{`${selectedReserve.discountCodeId} | Descuento: ${selectedReserve.discountCodeId}%`}</option>
                              </select>
                        </div>
                      </div>

                      <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">

                        <div className="flex flex-col justify-start itemst-start gap-x-6 w-[50%] h-auto gap-y-2 sm:gap-y-1">
                          <label htmlFor="importe_calculado" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Importe Total Calculado"}</label>
                          <input name="importe_calculado" value={ `$ ${getTotalReserveCalculated(tents,products,experiences)}` } className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary"  disabled/>
                        </div>

                        <div className="flex flex-col justify-start itemst-start gap-x-6 w-[50%] h-auto gap-y-2 sm:gap-y-1">
                          <label htmlFor="discount" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Descuento en %"}</label>
                          <input name="discount" value={selectedReserve.discount} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Descuento en %"} disabled/>
                        </div>
                      </div>

                      <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">

                        <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                          <label htmlFor="netImport" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Importe Neto"}</label>
                          <input name="netImport" value={selectedReserve.netImport} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Importe Neto"} disabled/>
                        </div>

                        <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                          <label htmlFor="grossImport" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Importe Total"}</label>
                          <input name="grossImport" value={selectedReserve.grossImport} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Importe Total"} disabled/>
                        </div>

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
                <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><Calendar/>Agregar Reserva</h2>

              <form id="form_create_reserve" className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" onSubmit={(e)=>onSubmitCreation(e)}>

                <div className="flex flex-col justify-start items-start w-full lg:w-[50%] h-full">

                      <div className="flex flex-col justify-start items-start w-full h-auto my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="search_user_email" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Buscar Usuario"}</label>
                        <div className="w-full h-auto flex flex-row justify-between gap-x-4 relative">
                          <input name="search_user_email" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Buscar usuario"}/>
                          <AnimatePresence>
                            {users && users.length > 0 && (
                              <motion.div 
                                initial="hidden"
                                animate="show"
                                variants={fadeIn("up","", 0, 0.3)}
                                className="absolute left-0 top-8 sm:top-10 w-full max-h-[100px] min-h-[50px] overflow-y-scroll flex flex-col justify-start items-start bg-white py-2">
                                {users.map((userItem,index)=>{
                                  return(
                                    <span onClick={()=>selectUserId('form_create_reserve', userItem) } className="w-full h-auto text-sm font-primary text-secondary hover:bg-secondary hover:text-white duration-300 hover:cursor-pointer p-2" key={"user"+index}>{`Usuario: ${userItem.firstName},${userItem.lastName} Correo: ${userItem.email}`}</span>
                                  )
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <button type="button" onClick={()=>searchUsersByEmail('form_create_reserve')} className="w-auto h-auto border border-2 border-slate-200 p-2 rounded-xl active:scale-95 duration-300"><Search/></button>
                        </div>
                        <label htmlFor="userId" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6"> Usuario</label>
                        <input name="userId" className="hidden"/>
                        <input name="userId_name" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Usuario seleccionado"}/>

                        <div className="w-full h-6">
                          {errorMessages.userId && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {errorMessages.userId}
                            </motion.p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">

                        <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                          <label htmlFor="qtypeople" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Cantidad de personas"}</label>
                          <input name="qtypeople" type="number" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad de personas"}/>

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
                          <label htmlFor="qtykids"  className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Cantidad  de niños"}</label>
                          <input name="qtykids" type="number" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad de niños"}/>

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

                      <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                        <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                          <label htmlFor="dateFrom" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Desde"}</label>
                          <input name="dateFrom" type="date" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Hasta"}/>

                          <div className="w-full h-6">
                            {errorMessages.dateFrom && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {errorMessages.dateFrom}
                              </motion.p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                          <label htmlFor="dateTo" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Hasta"}</label>
                          <input name="dateTo" type="date" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Hasta"}/>

                          <div className="w-full h-6">
                            {errorMessages.dateTo && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {errorMessages.dateTo}
                              </motion.p>
                            )}
                          </div>
                        </div>

                      </div>

                      <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">

                        <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                          <label htmlFor="payment_status" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Estado de Pago"}</label>
                          <select name="payment_status" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                            <option value="PAID">PAGADO</option>
                            <option value="DEBT">DEBE</option>
                            <option value="PENDING">PENDIENTE</option>
                          </select>

                          <div className="w-full h-6">
                            {errorMessages.paymentStatus && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {errorMessages.paymentStatus}
                              </motion.p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                          <label htmlFor="additional_people" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Cantidad de Personas adicionales"}</label>
                          <input name="additional_people" type="number" step="0.01" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad de Personas adicionales"}/>

                          <div className="w-full h-6">
                            {errorMessages.additionalPeople && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {errorMessages.additionalPeople}
                              </motion.p>
                            )}
                          </div>
                        </div>

                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1  gap-y-2">

                        <label htmlFor="canceled_reason" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6 mb-2">{"Cancelacion"}</label>

                          <div className="checkbox-wrapper-13 px-2">
                            <input name="canceled_status" type="checkbox" aria-hidden="true" />
                            <label htmlFor="canceled_status">Reserva Cancelada?</label>
                          </div>

                          <div className="w-full h-6">
                            {errorMessages.canceled_status && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {errorMessages.canceled_status}
                              </motion.p>
                            )}
                          </div>

                          <textarea name="canceled_reason" className="w-full h-8 sm:h-20 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Razon de cancelacion"}></textarea>

                          <div className="w-full h-6">
                            {errorMessages.canceled_reason && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {errorMessages.canceled_reason}
                              </motion.p>
                            )}
                          </div>
                        </div>
                  </div>

                <div className="flex flex-col justify-start items-start w-full lg:w-[50%]">

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-2  gap-y-2">
                        <label htmlFor="criteria_reserve" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6 mb-2">{"Criterio de Reserva"}</label>
                        <div className="flex flex-row justify-start items-start gap-x-6">
                          <InputRadio name="criteria_reserve" variant="dark" value="NORMAL" placeholder="Normal" checked={criteriaReserve == "NORMAL"} onClick={(e)=>changeReserveType(e)} readOnly/>
                          <InputRadio name="criteria_reserve" variant="dark" value="PROMOTION" placeholder="Promocion" checked={ criteriaReserve == "PROMOTION" } onClick={(e)=>changeReserveType(e)} readOnly/>
                        </div>
                      </div>
                      {criteriaReserve === "NORMAL" ? 
                        <>
                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="price_is_calculated" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Precios Calculados?"}</label>
                            <div className="checkbox-wrapper-13 px-2">
                              <input name="price_is_calculated" type="checkbox" aria-hidden="true" />
                              <label className="text-[12px]" htmlFor="price_is_calculated">Los precios se calcularan en base a los precios de los productos</label>
                            </div>
                            <div className="w-full h-6">
                              {errorMessages.price_is_calculated && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {errorMessages.price_is_calculated}
                                </motion.p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                            <label htmlFor="glampings" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Glampings en la reserva"}</label>
                            <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                                <div className="flex flex-col justify-start items-start gap-x-6 w-[75%] h-auto gap-y-2 sm:gap-y-1">
                                  <label htmlFor="promotion_option_tent_id" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Glamping"}</label>
                                    <select name="promotion_option_tent_id" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                                        { datasetReservesOptions.tents.map((tent,index) => {
                                            return(
                                              <option key={index} value={tent.id}>{`${tent.title} | Precio: $${tent.price} | Precio del dia $${getCurrentCustomPrice(tent.custom_price)}` }</option>
                                            )
                                        })}
                                    </select>
                                </div>

                                <div className="flex flex-col justify-start itemst-start gap-x-6 w-[25%] h-auto gap-y-2 sm:gap-y-1">
                                  <label htmlFor="promotion_option_qty" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Cantidad"}</label>
                                  <input name="promotion_option_tent_qty" type="number" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad"}/>
                                </div>
                                <Button onClick={()=>handleAddReserveOption("form_create_reserve","tent")} size="sm" type="button" variant="dark" effect="default" isRound={true} className="w-[10%] my-auto">+</Button>
                            </div>
                            <div className="checkbox-wrapper-13 px-2">
                              <input name="promotion_option_tent_no_special_price" type="checkbox" aria-hidden="true" />
                              <label className="text-[12px]" htmlFor="canceled_status">No se aplicara el precio el dia si se marca esta opcion</label>
                            </div>
                            <div className="w-full h-auto">
                              <AnimatePresence>
                                {tents.map((item, index) => (
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
                                              onClick={() => handleRemoveReserveOption(index,"tent")}
                                              className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-red-400 hover:text-white rounded-xl duration-300 hover:border-red-400"
                                            >
                                              Borrar
                                            </button>
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>

                            <div className="w-full h-6">
                              {errorMessages.tents && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {errorMessages.tents}
                                </motion.p>
                              )}
                            </div>

                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                            <label htmlFor="products" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Productos en la reserva"}</label>
                            <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                                <div className="flex flex-col justify-start items-start gap-x-6 w-[75%] h-auto gap-y-2 sm:gap-y-1">
                                  <label htmlFor="promotion_option_product_id" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Productos"}</label>
                                    <select name="promotion_option_product_id" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                                        { datasetReservesOptions.products.map((product,index) => {
                                            return(
                                              <option key={index} value={product.id}>{`${product.name} | Precio: $${product.price} | Precio del dia: ${getCurrentCustomPrice(product.custom_price)}`}</option>
                                            )
                                        })}
                                    </select>
                                </div>

                                <div className="flex flex-col justify-start itemst-start gap-x-6 w-[25%] h-auto gap-y-2 sm:gap-y-1">
                                  <label htmlFor="promotion_option_product_qty" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Cantidad"}</label>
                                  <input name="promotion_option_product_qty" type="number" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad"}/>
                                </div>
                                <Button onClick={()=>handleAddReserveOption("form_create_reserve","product")} size="sm" type="button" variant="dark" effect="default" isRound={true} className="w-[10%] my-auto">+</Button>
                            </div>

                            <div className="checkbox-wrapper-13 px-2">
                              <input name="promotion_option_product_no_special_price" type="checkbox" aria-hidden="true" />
                              <label className="text-[12px]" htmlFor="canceled_status">No se aplicara el precio el dia si se marca esta opcion</label>
                            </div>

                            <div className="w-full h-auto">
                              <AnimatePresence>
                                {products.map((item, index) => (
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

                                              onClick={() => handleRemoveReserveOption(index,"product")}
                                              className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-red-400 hover:text-white rounded-xl duration-300 hover:border-red-400"
                                            >
                                              Borrar
                                            </button>
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>

                            <div className="w-full h-6">
                              {errorMessages.products && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {errorMessages.products}
                                </motion.p>
                              )}
                            </div>

                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                            <label htmlFor="experiences" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Experiencias en la reserva"}</label>
                            <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                                <div className="flex flex-col justify-start items-start gap-x-6 w-[75%] h-auto gap-y-2 sm:gap-y-1">
                                  <label htmlFor="promotion_option_experience_id" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Experiencia"}</label>
                                    <select name="promotion_option_experience_id" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                                        { datasetReservesOptions.experiences.map((experience,index) => {
                                            return(
                                              <option key={index} value={experience.id}>{`${experience.name} | Precio: $${experience.price} | Precio del dia:  $${getCurrentCustomPrice(experience.custom_price)}`}</option>
                                            )
                                        })}
                                    </select>
                                </div>

                                <div className="flex flex-col justify-start itemst-start gap-x-6 w-[25%] h-auto gap-y-2 sm:gap-y-1">
                                  <label htmlFor="promotion_option_experience_qty" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Cantidad"}</label>
                                  <input name="promotion_option_experience_qty" type="number" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad"}/>
                                </div>
                                <Button onClick={()=>handleAddReserveOption("form_create_reserve","experience")} size="sm" type="button" variant="dark" effect="default" isRound={true} className="w-[10%] my-auto">+</Button>
                            </div>

                            <div className="checkbox-wrapper-13 px-2">
                              <input name="promotion_option_experience_no_special_price" type="checkbox" aria-hidden="true" />
                              <label className="text-[12px]" htmlFor="canceled_status">No se aplicara el precio el dia si se marca esta opcion</label>
                            </div>

                            <div className="w-full h-auto">
                              <AnimatePresence>
                                {experiences.map((item, index) => (
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

                                              onClick={() => handleRemoveReserveOption(index,"experience")}
                                              className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-red-400 hover:text-white rounded-xl duration-300 hover:border-red-400"
                                            >
                                              Borrar
                                            </button>
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>

                            <div className="w-full h-6">
                              {errorMessages.experiences && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {errorMessages.experiences}
                                </motion.p>
                              )}
                            </div>

                          </div>
                        </>
                      :
                        <>
                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                            <label htmlFor="promotion_id" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Selecciona la promocion a aplicar en la reserva"}</label>
                            <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                                  <select name="promotion_option_id" className="w-[80%] h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                                      { datasetReservesOptions.promotions.map((promotion,index) => {
                                          return(
                                            <option key={index} value={promotion.id}>{`Nombre: ${promotion.title} | Precio: $${promotion.grossImport} | Descuento: ${promotion.discount}%`}</option>
                                          )
                                      })}
                                  </select>
                              <Button size="sm" type="button" variant="dark" effect="default" isRound={true} className="w-[20%] my-auto" onClick={()=>applyPromotionToReserve("form_create_reserve")}>Aplicar</Button>
                            </div>
                            <input name="promotion_id" className="hidden"/>
                            <div className="w-full h-6">
                              {errorMessages.promotionId && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {errorMessages.promotionId}
                                </motion.p>
                              )}
                            </div>

                            <div className="w-full h-auto">
                              <AnimatePresence>
                                {tents.map((item, index) => (
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
                                              onClick={() => handleRemoveReserveOption(index,"tent")}
                                              className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-red-400 hover:text-white rounded-xl duration-300 hover:border-red-400"
                                            >
                                              Borrar
                                            </button>
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>
                            <div className="w-full h-auto">
                              <AnimatePresence>
                                {products.map((item, index) => (
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

                                              onClick={() => handleRemoveReserveOption(index,"product")}
                                              className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-red-400 hover:text-white rounded-xl duration-300 hover:border-red-400"
                                            >
                                              Borrar
                                            </button>
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>
                            <div className="w-full h-auto">
                              <AnimatePresence>
                                {experiences.map((item, index) => (
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

                                              onClick={() => handleRemoveReserveOption(index,"experience")}
                                              className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-red-400 hover:text-white rounded-xl duration-300 hover:border-red-400"
                                            >
                                              Borrar
                                            </button>
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>

                          </div>
                        </>
                      }



                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-2">
                        <label htmlFor="discount_code_id" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Aplicar codigo de descuento"}</label>
                        <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                              <select onChange={()=>handleApplyDiscount("form_create_reserve")} name="discount_code_id" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                                  <option value="0">Sin Descuento</option>
                                  { datasetReservesOptions.discounts.map((discount,index) => {
                                      return(
                                          <option key={index} value={discount.id}>{`${discount.code} | Descuento: ${discount.discount}%`}</option>
                                      )
                                  })}
                              </select>
                        </div>

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

                      <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">

                        <div className="flex flex-col justify-start itemst-start gap-x-6 w-[50%] h-auto gap-y-2 sm:gap-y-1">
                          <label htmlFor="importe_calculado" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Importe Total Calculado"}</label>
                          <input name="importe_calculado" value={ `$ ${getTotalReserveCalculated(tents,products,experiences)}` } className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary"  disabled/>
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

                            onClick={()=>calculateAmountLocally("form_create_reserve")}
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
                          <Button type="submit" size="sm" variant="dark" effect="default" isRound={true} isLoading={loadingForm}> Crear Reserva </Button>
                      </div>

                  </div>
                </form>
            </motion.div>
        )}

        {currentView === "E" && selectedReserve && (
                <motion.div 
                    key={"Edit-View"}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    viewport={{ once: true }}
                    variants={fadeIn("up","",0.5,0.3)}
                    className="w-full h-auto flex flex-col justify-start items-start gap-y-4">
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><Calendar/>Editar Experiencia</h2>

                  <form id="form_update_promotion" className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" onSubmit={(e)=>onSubmitUpdate(e)}>

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%] h-full">

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="title" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Titulo de la promocion"}</label>
                            <input name="title" value={selectedReserve.title}  onChange={(e)=>onChangeSelectedReserve(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Titulo de la promocion"}/>
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
                            <textarea name="description"  onChange={(e)=>onChangeSelectedReserve(e)} className="w-full h-8 sm:h-24 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary mt-2" placeholder={"Descripcion"}>{selectedReserve.description}</textarea>
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
                              <input name="expiredDate" type="date" value={formatToISODate(selectedReserve.expiredDate)}  onChange={(e)=>onChangeSelectedReserve(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Fecha de Expiracion"}/>

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
                              <input name="stock" value={selectedReserve.stock}  onChange={(e)=>onChangeSelectedReserve(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad de promociones"}/>

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
                              <input name="qtypeople" value={selectedReserve.qtypeople}  onChange={(e)=>onChangeSelectedReserve(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad de personas"}/>

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
                              <input name="qtykids" value={selectedReserve.qtykids}  onChange={(e)=>onChangeSelectedReserve(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Cantidad de Niños"}/>

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
                            <select name="status" onChange={(e)=>onChangeSelectedReserve(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                              <option value="ACTIVE" selected={selectedReserve.status == "ACTIVE"}>ACTIVO</option>
                              <option value="INACTIVE" selected={selectedReserve.status == "INACTIVE"}>INACTIVO</option>
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
                                        { datasetReservesOptions.tents.map((tent,index) => {
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
                                <Button onClick={()=>handleAddReserveOption("form_update_promotion","tent")} size="sm" type="button" variant="dark" effect="default" isRound={true} className="w-[10%] my-auto">+</Button>
                            </div>

                            <div className="w-full h-auto">
                              <AnimatePresence>
                                {tents.map((item, index) => (
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
                                              Tienda: <label className="text-tertiary ml-2 text-xs">{item.label}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              Cantidad: <label className="text-tertiary ml-2 text-xs">{item.qty}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              Precio Unt.: <label className="text-tertiary ml-2">S/{item.price.toFixed(2)}</label>
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveReserveOption(index,"tent")}
                                              className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-red-400 hover:text-white rounded-xl duration-300 hover:border-red-400"
                                            >
                                              Borrar
                                            </button>
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>

                            <div className="w-full h-6">
                              {errorMessages.tents && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {errorMessages.tents}
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
                                        { datasetReservesOptions.products.map((product,index) => {
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
                                <Button onClick={()=>handleAddReserveOption("form_update_promotion","product")} size="sm" type="button" variant="dark" effect="default" isRound={true} className="w-[10%] my-auto">+</Button>
                            </div>

                            <div className="w-full h-auto">
                              <AnimatePresence>
                                {products.map((item, index) => (
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
                                              Producto: <label className="text-tertiary ml-2 text-xs">{item.label}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              Cantidad: <label className="text-tertiary ml-2 text-xs">{item.qty}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              Precio Unt.: <label className="text-tertiary ml-2">S/{item.price.toFixed(2)}</label>
                                            </span>
                                            <button
                                              type="button"

                                              onClick={() => handleRemoveReserveOption(index,"product")}
                                              className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-red-400 hover:text-white rounded-xl duration-300 hover:border-red-400"
                                            >
                                              Borrar
                                            </button>
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>

                            <div className="w-full h-6">
                              {errorMessages.products && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {errorMessages.products}
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
                                        { datasetReservesOptions.experiences.map((experience,index) => {
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
                                <Button onClick={()=>handleAddReserveOption("form_update_promotion","experience")} size="sm" type="button" variant="dark" effect="default" isRound={true} className="w-[10%] my-auto">+</Button>
                            </div>

                            <div className="w-full h-auto">
                              <AnimatePresence>
                                {experiences.map((item, index) => (
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
                                              Experiencia: <label className="text-tertiary ml-2 text-xs">{item.label}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              Cantidad: <label className="text-tertiary ml-2 text-xs">{item.qty}</label>
                                            </span>
                                            <span className="w-[30%]">
                                              Precio Unt.: <label className="text-tertiary ml-2">S/{item.price.toFixed(2)}</label>
                                            </span>
                                            <button
                                              type="button"

                                              onClick={() => handleRemoveReserveOption(index,"experience")}
                                              className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-red-400 hover:text-white rounded-xl duration-300 hover:border-red-400"
                                            >
                                              Borrar
                                            </button>
                                          </motion.div>
                                        ))}
                              </AnimatePresence>
                            </div>

                            <div className="w-full h-6">
                              {errorMessages.products && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {errorMessages.products}
                                </motion.p>
                              )}
                            </div>

                          </div>

                          <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-[50%] h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="importe_calculado" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Importe Total Calculado"}</label>
                              <input name="importe_calculado" value={ `$ ${getTotalReserveCalculated(tents,products,experiences)}` } className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary"  disabled/>
                            </div>

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-[40%] h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="discount" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Descuento en %"}</label>
                              <input name="discount" value={selectedReserve.discount} onChange={(e)=>onChangeSelectedReserve(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Descuento en %"}/>

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

                                onClick={()=>calculateAmountLocally("form_update_promotion")}
                                className="border-2 border-slate-200 p-2 active:scale-95 hover:bg-primary hover:text-white rounded-xl duration-300 hover:border-primary"
                              >
                                 %
                              </button>
                            </div>

                          </div>

                          <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="netImport" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Importe Neto"}</label>
                              <input name="netImport" value={selectedReserve.netImport} onChange={(e)=>onChangeSelectedReserve(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Importe Neto"}/>

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
                              <input name="grossImport" value={selectedReserve.grossImport} onChange={(e)=>onChangeSelectedReserve(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Importe Total"}/>

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

export default DashboardAdminReserves;
