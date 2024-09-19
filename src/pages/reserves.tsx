import Dashboard from "../components/ui/Dashboard";
import { useState, useEffect, FormEvent } from "react";
import { Eye, Pen, X, ChevronLeft, ChevronRight, Calendar, CircleX,   FlameKindling, Tent, Pizza, Search, Plus, Disc  } from "lucide-react";
import Button from "../components/ui/Button";
import {  formatDate, getCurrentCustomPrice,  calculatePrice, formatPrice, getReserveDates, formatDateToYYYYMMDD, getNumberOfNights } from "../lib/utils";
import { getAllReserveOptions, getAllReserves, createReserve, updateReserve, deleteReserve } from "../db/actions/reserves";
import { getAllUsers } from "../db/actions/users";
import { useAuth } from "../contexts/AuthContext";
import { UserFilters, Reserve, ReserveFilters, ReserveFormData, optionsReserve, ReserveTentDto, ReserveProductDto, ReserveExperienceDto, User, ReservePromotionDto } from "../lib/interfaces";
import { AnimatePresence, motion } from "framer-motion";
import {fadeIn} from "../lib/motions";
import {  ZodError } from 'zod';
import { ReserveExperienceItemFormDataSchema, ReserveFormDataSchema, ReserveProductItemFormDataSchema, ReservePromotionItemFormDataSchema, ReserveTentItemFormDataSchema } from "../db/schemas";
import Modal from "../components/Modal";
import { toast } from "sonner";
import {InputRadio} from "../components/ui/Input";
import {useTranslation} from "react-i18next";


const DashboardAdminReserves = () => {

    const {t,i18n} = useTranslation();
    const { user } = useAuth();
    const [datasetReserves,setDataSetReserves] = useState<{reserves:Reserve[],totalPages:Number,currentPage:Number}>({reserves:[],totalPages:1,currentPage:1});
    const [datasetReservesOptions, setDatasetReservesOptions] = useState<optionsReserve>({ tents:[], products:[], experiences:[], promotions:[], discounts:[] });
    const [tents,setTents] = useState<ReserveTentDto[]>([]);
    const [products,setProducts] = useState<ReserveProductDto[]>([]);
    const [experiences,setExperiences] = useState<ReserveExperienceDto[]>([]);
    const [promotions,setPromotions] = useState<ReservePromotionDto[]>([]);

    const [openReserveOption,setOpenReserveOption] = useState<"tent"|"product"|"experience"|"promotion"|null>(null);

    const [currentView,setCurrentView] = useState<string>("LOADING");

    useEffect(()=>{
        getReservesHandler(1);
        getReservesOptions();
    },[])

    const getReservesOptions = async() => {
      if(user != null){
          const ReserveOptions  = await getAllReserveOptions(user.token,i18n.language);
          if(ReserveOptions){
              setDatasetReservesOptions(ReserveOptions);
          }
      }
    }

    const getReservesHandler = async (page:Number, filters?:ReserveFilters) => {
        setCurrentView("LOADING");
        if(user != null){
            const reserves  = await getAllReserves(user.token,page,i18n.language,filters);
            if(reserves){
                setDataSetReserves(reserves);
                setCurrentView("L");
            }
        }
    }

    const [loadingForm, setLoadingForm] = useState<boolean>(false);
    const [tentItemTotalPrice, setTentItemTotalPrice] = useState<number>(0);

    const getTentItemFormData = ():{idTent:number, aditionalPeople:number, aditionalPeoplePrice:number, dateFrom:Date, dateTo:Date, no_custom_price:boolean}|null => {
      const container = document.getElementById("modal_reserve_items") as HTMLFormElement;

      const idTentInput  = container.querySelector(`select[name="reserve_tent_option_id"]`) as HTMLSelectElement;
      const aditionalPeopleInput =  container.querySelector(`input[name="reserve_tent_option_aditional_people"]`) as HTMLInputElement;
      const dateFromInput = container.querySelector(`input[name="reserve_tent_option_date_from"]`) as HTMLInputElement;
      const dateToInput = container.querySelector(`input[name="reserve_tent_option_date_to"]`) as HTMLInputElement;
      const noCustomPriceInput = container.querySelector(`input[name="reserve_tent_option_no_special_price"]`) as HTMLInputElement;

      if(idTentInput == undefined || aditionalPeopleInput == undefined || dateFromInput == undefined || dateToInput == undefined || noCustomPriceInput == undefined ){
        return null;
      }

      const idTent = Number(idTentInput.value);
      const aditionalPeople = Number(aditionalPeopleInput.value);
      const dateFrom = new Date(dateFromInput.value)
      const dateTo = new Date(dateToInput.value)
      const no_custom_price = noCustomPriceInput.checked;

      const tent_db  = datasetReservesOptions.tents.find((i)=> i.id == idTent);
      if(!tent_db){
        return null;
      }

      setErrorMessages({});

      try {

        ReserveTentItemFormDataSchema.parse({ 
          reserve_tent_option_id:idTent,
          reserve_tent_option_date_from:dateFrom,
          reserve_tent_option_date_to:dateTo,
          reserve_tent_option_aditional_people:aditionalPeople,
          reserve_tent_option_aditional_people_max:tent_db.max_aditional_people,
        });

        return {
          idTent,
          aditionalPeople,
          dateFrom,
          dateTo,
          no_custom_price,
          aditionalPeoplePrice:tent_db.aditional_people_price
        }

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

    }

    const calculateTentItemPrice = () => {

      const currentItem = getTentItemFormData();

      if (currentItem == null) {
        setTentItemTotalPrice(0);
        return;
      }

      const data = datasetReservesOptions.tents.find((i)=> i.id == currentItem.idTent);

      if(data){
        const base_price = calculatePrice(data.price,data.custom_price, currentItem.no_custom_price)
        const ad_people_price = currentItem.aditionalPeople * currentItem.aditionalPeoplePrice;
        setTentItemTotalPrice((ad_people_price + base_price) * getNumberOfNights(currentItem.dateFrom,currentItem.dateTo));
      }
    } 

    const [productItemTotalPrice, setProductItemTotalPrice] = useState<number>(0);

    const getProductItemFormData = ():{idProduct:number, quantity:number, no_custom_price:boolean}|null => {
      const container = document.getElementById("modal_reserve_items") as HTMLFormElement;

      const idProductInput  = container.querySelector(`select[name="reserve_product_option_id"]`) as HTMLSelectElement;
      const quantityInput =  container.querySelector(`input[name="reserve_product_option_quantity"]`) as HTMLInputElement;
      const noCustomPriceInput = container.querySelector(`input[name="reserve_product_option_no_special_price"]`) as HTMLInputElement;

      if(idProductInput == undefined || quantityInput == undefined || noCustomPriceInput == undefined ){
        return null;
      }

      const idProduct = Number(idProductInput.value);
      const quantity = Number(quantityInput.value);
      const no_custom_price = noCustomPriceInput.checked;

      setErrorMessages({});

      try {

        ReserveProductItemFormDataSchema.parse({ 
          reserve_product_option_id:idProduct,
          reserve_product_option_quantity:quantity,
        });

        return {
          idProduct,
          quantity,
          no_custom_price:no_custom_price
        }

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

    }

    const [experienceItemTotalPrice, setExperienceItemTotalPrice] = useState<number>(0);

    const getExperienceItemFormData = ():{idExperience:number, quantity:number, day:Date, no_custom_price:boolean}|null => {
      const container = document.getElementById("modal_reserve_items") as HTMLFormElement;

      const idExperienceInput  = container.querySelector(`select[name="reserve_experience_option_id"]`) as HTMLSelectElement;
      const quantityInput =  container.querySelector(`input[name="reserve_experience_option_quantity"]`) as HTMLInputElement;
      const dateInput =  container.querySelector(`input[name="reserve_experience_option_date"]`) as HTMLInputElement;
      const noCustomPriceInput = container.querySelector(`input[name="reserve_experience_option_no_special_price"]`) as HTMLInputElement;

      if(idExperienceInput == undefined || quantityInput == undefined || dateInput == undefined || noCustomPriceInput == undefined ){
        return null;
      }

      const idExperience = Number(idExperienceInput.value);
      const day = new Date(dateInput.value);
      const quantity = Number(quantityInput.value);
      const no_custom_price = noCustomPriceInput.checked;

      setErrorMessages({});

      try {

        ReserveExperienceItemFormDataSchema.parse({ 
          reserve_experience_option_id:idExperience,
          reserve_experience_option_day:day,
          reserve_experience_option_quantity:quantity,
        });

        return {
          idExperience,
          day,
          quantity,
          no_custom_price:no_custom_price
        }

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

    }

    const [promotionItemTotalPrice, setPromotionItemTotalPrice] = useState<number>(0);

    const getPromotionItemFormData = ():{idPromotion:number, dateFrom:Date, dateTo:Date}|null => {
      const container = document.getElementById("modal_reserve_items") as HTMLFormElement;

      const idPromotionInput  = container.querySelector(`select[name="reserve_promotion_option_id"]`) as HTMLSelectElement;
      const dateFromInput = container.querySelector(`input[name="reserve_promotion_option_date_from"]`) as HTMLInputElement;
      const dateToInput = container.querySelector(`input[name="reserve_promotion_option_date_to"]`) as HTMLInputElement;

      if(idPromotionInput == undefined || dateFromInput == undefined || dateToInput == undefined ){
        return null;
      }

      const idPromotion = Number(idPromotionInput.value);
      const dateFrom = new Date(dateFromInput.value);
      const dateTo = new Date(dateToInput.value);

      setErrorMessages({});

      try {

        ReservePromotionItemFormDataSchema.parse({ 
          reserve_promotion_option_id:idPromotion,
          reserve_promotion_option_date_from:dateFrom,
          reserve_promotion_option_date_to:dateTo,
        });

        return {
          idPromotion,
          dateFrom,
          dateTo
        }

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

    }

    const calculateProductItemPrice = () => {

      const currentItem = getProductItemFormData();

      if (currentItem == null) {
        setProductItemTotalPrice(0);
        return;
      }

      const data = datasetReservesOptions.products.find((i)=> i.id == currentItem.idProduct);

      if(data){
        const base_price = calculatePrice(data.price,data.custom_price, currentItem.no_custom_price)
        setProductItemTotalPrice( base_price * currentItem.quantity);
      }
    } 

    const calculateExperienceItemPrice = () => {

      const currentItem = getExperienceItemFormData();

      if (currentItem == null) {
        setExperienceItemTotalPrice(0);
        return;
      }

      const data = datasetReservesOptions.experiences.find((i)=> i.id == currentItem.idExperience);

      if(data){
        const base_price = calculatePrice(data.price,data.custom_price, currentItem.no_custom_price)
        setExperienceItemTotalPrice( base_price * currentItem.quantity);
      }
    } 

    const calculatePromotionItemPrice = () => {

      const currentItem = getPromotionItemFormData();

      if (currentItem == null) {
        setExperienceItemTotalPrice(0);
        return;
      }

      const data = datasetReservesOptions.promotions.find((i)=> i.id == currentItem.idPromotion);

      if(data){
        setPromotionItemTotalPrice(data.grossImport);
      }
    } 


    const handleAddReserveOption = (type:string) => {
      let data:any = null;

      if(type == "tent"){

        const currentItem = getTentItemFormData();

        if (currentItem == null) {
          return;
        }

        data = datasetReservesOptions.tents.find((i)=> i.id == currentItem.idTent);

        if(data){
          const newTentOption: ReserveTentDto = { 
            idTent:currentItem.idTent , 
            name: data.title , 
            nights: getNumberOfNights(currentItem.dateFrom, currentItem.dateTo) , 
            price: calculatePrice (data.price,data.custom_price, currentItem.no_custom_price), 
            confirmed:true, 
            dateFrom:currentItem.dateFrom, 
            dateTo:currentItem.dateTo, 
            aditionalPeople: currentItem.aditionalPeople,
            aditionalPeoplePrice:currentItem.aditionalPeoplePrice
          };
          setTents([...tents, newTentOption]);
        }

      }else if(type == "product"){

        const currentItem = getProductItemFormData();

        if (currentItem == null) {
          return;
        }

        data = datasetReservesOptions.products.find((i)=> i.id == currentItem.idProduct);

        if(data){
          const newProductOption: ReserveProductDto = { 
            idProduct:currentItem.idProduct , 
            name: data.name , 
            quantity: currentItem.quantity,
            price: calculatePrice (data.price,data.custom_price, currentItem.no_custom_price), 
            confirmed:true, 
          };
          setProducts([...products, newProductOption]);
        }
      }else if(type == "experience"){

        const currentItem = getExperienceItemFormData();

        if (currentItem == null) {
          return;
        }

        data = datasetReservesOptions.experiences.find((i)=> i.id == currentItem.idExperience);

        if(data){
          const newExperienceOption: ReserveExperienceDto = { 
            idExperience:currentItem.idExperience , 
            name: data.name , 
            day:currentItem.day,
            quantity: currentItem.quantity,
            price: calculatePrice (data.price,data.custom_price, currentItem.no_custom_price), 
            confirmed:true, 
          };
          setExperiences([...experiences, newExperienceOption]);
        }

      }else if (type == "promotion"){

        const currentItem = getPromotionItemFormData();

        if (currentItem == null) {
          return;
        }

        data = datasetReservesOptions.promotions.find((i)=> i.id == currentItem.idPromotion);

        if(data){
          const newPromotionOption: ReservePromotionDto = { 
            idPromotion:currentItem.idPromotion , 
            name: data.title , 
            price:data.grossImport,
            nights: getNumberOfNights(currentItem.dateFrom, currentItem.dateTo) , 
            dateFrom:currentItem.dateFrom,
            dateTo:currentItem.dateTo,
            confirmed:true
          };
          setPromotions([...promotions, newPromotionOption]);
        }

      } 
      setOpenReserveOption(null);

    };


    const handleRemoveReserveOption = (index: number, type: string) => {
      if (type === "tent") {
        setTents(tents.filter((_, i) => i !== index));
      } else if (type === "product") {
        setProducts(products.filter((_, i) => i !== index));
      } else if (type === "experience") {
        setExperiences(experiences.filter((_, i) => i !== index));
      } else if (type === "promotion") {
        setPromotions(promotions.filter((_, i) => i !== index));
      }
    };


    const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

    const [totals,setTotals] = useState<{
      discount_code_id:number,
      discount_code_name:string,
      gross_import:number,
      discount:number,
      net_import:number
    }>({discount_code_id:0, discount_code_name:"", gross_import:0, discount:0, net_import:0});

    const [discountCode,setDiscountCode] = useState<{ discount_code_id:number, discount_code_name:string, discount:number }>({discount_code_id:0,discount_code_name:"", discount:0})

    const onChangeDiscountCode = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { value } = e.target;
        const list_values = value.split("_");
        if(list_values.length > 2){
          setDiscountCode({discount_code_id:Number(list_values[0]), discount_code_name: list_values[1], discount:Number(list_values[2]) })
        }
    }

    useEffect(()=>{

        let gross_import = 0;
        let net_import = 0;

        // Sum prices for tents
        if (promotions && promotions.length > 0) {
          gross_import += promotions.reduce((sum, item) => sum + (1 * item.price), 0);
        }

        // Sum prices for tents
        if (tents && tents.length > 0) {
          gross_import += tents.reduce((sum, item) => sum + (item.nights * item.price + (item.nights * (item.aditionalPeoplePrice ?? 0) * item.aditionalPeople)), 0);
        }

        // Sum prices for products
        if (products && products.length > 0) {
          gross_import += products.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        }

        // Sum prices for experiences
        if (experiences && experiences.length > 0) {
          gross_import += experiences.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        }

        setTotals((prevTotals)=> ({ ...prevTotals, gross_import }))


        if(discountCode.discount_code_id > 0 &&  discountCode.discount > 0 && discountCode.discount <= 100 ){
          net_import = gross_import - ((discountCode.discount/100) * gross_import);
          setTotals((prevTotals)=> ({ ...prevTotals, net_import:net_import, discount:discountCode.discount, discount_code_id:discountCode.discount_code_id, discount_code_name:discountCode.discount_code_name  }))
        }else{

          net_import = gross_import;
          setTotals((prevTotals)=> ({ ...prevTotals, net_import:net_import, discount:0, discount_code_id:0, discount_code_name:""  }))
        }


    },[promotions,tents,experiences,products,discountCode])


    const validateFields = (formname:string): ReserveFormData |null => {
        const form = document.getElementById(formname) as HTMLFormElement;
        const userId = Number((form.querySelector('input[name="userId"]') as HTMLInputElement).value);
        const payment_status = (form.querySelector('select[name="payment_status"]') as HTMLInputElement).value;
        const reserve_status = (form.querySelector('select[name="reserve_status"]') as HTMLInputElement).value;
        const canceled_status = (form.querySelector('input[name="canceled_status"]') as HTMLInputElement).checked;
        const canceled_reason = (form.querySelector('textarea[name="canceled_reason"]') as HTMLInputElement).value;

        setErrorMessages({});

        try {

          ReserveFormDataSchema.parse({
            userId, 
            tents, 
            products,
            experiences ,
            promotions , 
            discount_code_id:totals.discount_code_id,
            discount_code_name:totals.discount_code_name,
            gross_import:totals.gross_import,
            discount:totals.discount,
            net_import:totals.net_import,
            canceled_reason, 
            canceled_status, 
            payment_status, 
            reserve_status });

          return {
            userId,
            tents,
            products,
            experiences,
            promotions,
            price_is_calculated:true,
            discount_code_id:totals.discount_code_id,
            discount_code_name:totals.discount_code_name,
            gross_import:totals.gross_import,
            discount:totals.discount,
            net_import:totals.net_import,
            canceled_reason,
            canceled_status,
            payment_status,
            reserve_status
            
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
            const isSuccess = await createReserve(fieldsValidated, user.token, i18n.language);
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
        const searchValueTo = (document.querySelector('input[name="criteria_search_value_date_to"]') as HTMLInputElement).value ;

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
          filters.payment_status =  selectedPaymentStatus;
        }

        getReservesHandler(1,filters);
    }

    const deleteReserveHandler = async() => {
        if(user != null && selectedReserve != null){
            const isSuccess = await deleteReserve(selectedReserve.id,user.token,i18n.language)
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
            const isSuccess =  await updateReserve(selectedReserve.id,fieldsValidated, user.token, i18n.language);
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
          const usersDB  = await getAllUsers(user.token, 1,i18n.language, filters );
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


    const [experiencesDayOptions,setDataExperienceDayOptions] = useState<{date:Date, label:string}[]>([])

    const getDateRangeFromForm = (formname:string) => {
        // Get the form element by ID
        const form = document.getElementById(formname) as HTMLInputElement;
        
        if (!form) {
            throw new Error('Form not found');
        }
        
        // Select the dateFrom and dateTo inputs from the form
        const dateFromInput = form.querySelector('input[name="dateFrom"]') as HTMLInputElement;
        const dateToInput = form.querySelector('input[name="dateTo"]') as HTMLInputElement;
        
        if (!dateFromInput || !dateToInput) {
            throw new Error('dateFrom or dateTo input not found');
        }
        
        // Get the values of the dateFrom and dateTo inputs
        const dateFrom = new Date(dateFromInput.value);
        const dateTo = new Date(dateToInput.value);
        
        if (isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime())) {
            throw new Error('Invalid dates');
        }

        if (dateTo <= dateFrom) {
            toast.error("La fecha Inicio tiene que ser previa a la fecha de Fin");
        }
        
        // Initialize an array to store the date range
        const dateRange = [];

        // Loop through the dates from dateFrom to dateTo
        let currentDate = new Date(dateFrom);
        while (currentDate <= dateTo) {
            const formattedDate = currentDate.toISOString().split('T')[0]; // Format date as YYYY-MM-DD
            dateRange.push({
                date: new Date(currentDate),
                label: formattedDate
            });
            
            // Move to the next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        setDataExperienceDayOptions(dateRange);
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
                  <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><Calendar/>{t("reserve.reserves")}</h2>
                  <div className="w-full h-auto flex flex-col xl:flex-row justify-start xl:justify-between items-center gap-x-4">
                    <div className="w-full xl:w-auto h-auto flex flex-col lg:flex-row  justify-start lg:justify-between xl:justify-start items-start gap-y-4 gap-x-4">
                          <div className="w-full lg:w-[50%] xl:w-auto flex flex-col md:flex-row items-start md:items-center gap-x-2">
                            <input 
                              type="date" 
                              name="criteria_search_value_date_from"
                              placeholder={t("reserve.from")}
                              className="w-[50%] xl:w-48 h-8 text-xs font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-primary"
                            />
                            <input 
                              type="date" 
                              name="criteria_search_value_date_to"
                              placeholder={t("reserve.to")}
                              className="w-[50%] xl:w-48 h-8 text-xs font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-primary"
                            />
                          </div>
                          <div className="w-full lg:w-[50%] xl:w-auto flex flex-col md:flex-row items-start md:items-center gap-x-2">
                              <label className="max-xl:w-full md:ml-4 flex items-center text-xs">
                                {t("reserve.payment_status")}
                                <select name="criteria_search_status" className="max-xl:w-full ml-2 h-8 text-xs font-tertiary border-b-2 border-secondary focus:outline-none focus:border-b-primary">
                                  <option value="">{t("reserve.select_payment_status")}</option>
                                  <option value="PAID">{t("reserve.PAID")}</option>
                                  <option value="UNPAID">{t("reserve.UNPAID")}</option>
                                </select>
                              </label>
                              <Button variant="ghostLight" isRound={true} effect="default" className="md:ml-4 mt-4 md:mt-0" onClick={()=>searchReserveHandler()}>
                                {t("common.search")}
                            </Button>
                          </div>
                        </div>
                    <div className="w-full xl:w-auto h-auto flex flex-row justify-end items-start gap-y-4 gap-x-4 max-xl:mt-4">
                          <Button onClick={()=>{setCurrentView("A"); setTents([]); setProducts([]); setExperiences([]);}} size="sm" variant="dark" effect="default" className="min-w-[300px]" isRound={true}>Agregar Reserva <Calendar/></Button>
                        </div>
                    </div>
                    <table className="h-full w-full shadow-xl rounded-xl text-center p-4">
                      <thead className="font-primary text-sm xl:text-md bg-primary text-white">
                            <tr className="">
                                <th className="rounded-tl-xl p-2">#</th>
                                <th className="p-2">{t("reserve.external_id")}</th>
                                <th className="p-2">{t("reserve.from")}</th>
                                <th className="p-2">{t("reserve.to")}</th>
                                <th className="p-2 max-xl:hidden">{t("reserve.services_and_products")}</th>
                                <th className="p-2">{t("reserve.total_amount")}</th>
                                <th className="p-2">{t("reserve.cancel")}</th>
                                <th className="p-2">{t("reserve.reserve_status")}</th>
                                <th className="p-2">{t("reserve.payment_status")}</th>
                                <th className="p-2 max-xl:hidden">{t("reserve.created")}</th>
                                <th className="p-2 max-xl:hidden">{t("reserve.updated")}</th>
                                <th className="rounded-tr-xl p-2">{t("reserve.actions")}</th>
                            </tr>
                        </thead>
                        <tbody className="font-secondary text-xs xl:text-sm">
                                {datasetReserves.reserves.map((reserveItem,index)=>{
                                    return(
                                    <tr key={"user_key"+index} className="text-slate-400 hover:bg-secondary hover:text-white duration-300 cursor-pointer"> 
                                        <td className="">{reserveItem.id}</td>
                                        <td className="">{reserveItem.external_id}</td>

                                        <td className="">{formatDateToYYYYMMDD(getReserveDates(reserveItem.tents).dateFrom)}</td>
                                        <td className="">{formatDateToYYYYMMDD(getReserveDates(reserveItem.tents).dateTo)}</td>

                                        <td className="max-xl:hidden flex flex-row gap-x-4 justify-around">
                                          <div className="flex flex-row gap-x-2"><Tent/>{reserveItem.tents.length}</div>
                                          <div className="flex flex-row gap-x-2"><FlameKindling/>{reserveItem.experiences.length}</div>
                                          <div className="flex flex-row gap-x-2"><Pizza/>{reserveItem.products.length}</div>
                                        </td>
                                        <td className="">{`${formatPrice(reserveItem.gross_import)}`}</td>
                                        <td className="h-full">{reserveItem.canceled_status ? "Si": "No" }</td>
                                        <td className="h-full">{reserveItem.reserve_status != "CONFIRMED" ?  ( reserveItem.reserve_status != "NOT_CONFIRMED" ? t("reserve.COMPLETE") : t("reserve.NOT_CONFIRMED") ) : t("reserve.CONFIRMED") }</td>
                                        <td className="h-full">{reserveItem.payment_status != "PAID" ? t("reserve.UNPAID") : t("reserve.PAID") }</td>
                                        <td className="h-full max-xl:hidden">{reserveItem.updatedAt != undefined && reserveItem.updatedAt != null ? formatDate(reserveItem.updatedAt) : t("reserve.none")}</td>
                                        <td className="h-full max-xl:hidden">{reserveItem.createdAt != undefined && reserveItem.createdAt != null ? formatDate(reserveItem.createdAt) : t("reserve.none")}</td>
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
                        <p className="text-primary">{t("reserve.secure_delete_reserve_header")}</p>
                        <div className="flex flex-row justify-around w-full mt-6">
                            <Button size="sm" variant="dark" effect="default" isRound={true} onClick={()=>setOpenDeleteModal(false)}>{t("common.cancel")} </Button>
                            <Button size="sm" variant="danger" effect="default" isRound={true} onClick={()=>{deleteReserveHandler()}}>{t("common.accept")} </Button>
                        </div>
                    </div>
                </Modal>
            </>

        )}

        {currentView === "E" || currentView === "A" &&  (

          <AnimatePresence>
            {openReserveOption != null && (
              <Modal isOpen={openReserveOption != null} onClose={()=>setOpenReserveOption(null)}>
                <div id="modal_reserve_items" className="w-[100%] xl:w-[800px] max-xl:min-h-[600px] xl:h-[600px] flex flex-col items-start justify-start text-secondary py-16 px-4 sm:p-6 overflow-hidden">
                  <div className="w-[100%] h-auto flex overflow-x-croll">
                    <div className="w-full h-auto flex flex-row gap-x-4 sm:gap-x-6 pb-4 border-b-2 border-secondary">
                        <InputRadio  
                          className="w-auto"  
                          onClick={()=>{setOpenReserveOption("tent")}} 
                          name="category" 
                          placeholder={t("reserve.glampings")} 
                          rightIcon={<Tent/>} 
                          checked={openReserveOption === "tent"}
                        />
                        <InputRadio  
                          className="w-auto" 
                          onClick={()=>{setOpenReserveOption("product")}} 
                          name="category" 
                          placeholder={t("reserve.products")} 
                          rightIcon={<Pizza/>}
                          checked={openReserveOption === "product"}
                        />
                        <InputRadio  
                          className="w-auto" 
                          onClick={()=>{setOpenReserveOption("experience")}} 
                          name="category" 
                          placeholder={t("reserve.experiences")} 
                          rightIcon={<FlameKindling/>}
                          checked={openReserveOption === "experience"}
                        />
                        <InputRadio  
                          className="w-auto" 
                          onClick={()=>{setOpenReserveOption("promotion")}} 
                          name="category" 
                          placeholder={t("reserve.promotions")} 
                          rightIcon={<Disc/>}
                          checked={openReserveOption === "promotion"}
                        />
                      </div>
                  </div>
                  {openReserveOption == "tent" && (
                    
                    <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden mt-6 gap-y-2 sm:gap-y-2">
                        <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="reserve_tent_option_date_from" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("reserve.from")}</label>
                              <input onChange={()=>calculateTentItemPrice()} name="reserve_tent_option_date_from" type="date" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("reserve.from")}/>

                              <div className="w-full h-6">
                                {errorMessages.reserve_tent_option_date_from && (
                                  <motion.p 
                                    initial="hidden"
                                    animate="show"
                                    exit="hidden"
                                    variants={fadeIn("up","", 0, 1)}
                                    className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                    {t(errorMessages.reserve_tent_option_date_from)}
                                  </motion.p>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                              <label htmlFor="reserve_tent_option_date_to" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("reserve.to")}</label>
                              <input onChange={()=>calculateTentItemPrice()} name="reserve_tent_option_date_to" type="date" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("reserve.to")}/>
                              <div className="w-full h-6">
                                {errorMessages.reserve_tent_option_date_to && (
                                  <motion.p 
                                    initial="hidden"
                                    animate="show"
                                    exit="hidden"
                                    variants={fadeIn("up","", 0, 1)}
                                    className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                    {t(errorMessages.reserve_tent_option_date_to)}
                                  </motion.p>
                                )}
                              </div>
                            </div>
                        </div>
                      <div className="flex flex-col justify-start items-start gap-x-6 w-[100%] h-auto gap-y-2 sm:gap-y-1">
                        <label htmlFor="reserve_tent_option_id" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Glamping"}</label>
                          <select onChange={()=>calculateTentItemPrice()} name="reserve_tent_option_id" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                              { datasetReservesOptions.tents.map((tent,index) => {
                                return(
                                  <option key={index} value={tent.id}>{`${tent.title} | ${t("reserve.price")}: ${formatPrice(tent.price)} ${getCurrentCustomPrice(tent.custom_price) >0 ? `| ${t("reserve.price_of_day")} ${formatPrice(getCurrentCustomPrice(tent.custom_price))}`: " "} | ${t("reserve.price_aditional_people")} ${formatPrice(tent.aditional_people_price)} ` }</option>
                                  )
                              })}
                          </select>
                          <div className="w-full h-6">
                            {errorMessages.reserve_tent_option_id && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {t(errorMessages.reserve_tent_option_id)}
                              </motion.p>
                            )}
                          </div>
                      </div>

                      <div className="flex flex-col justify-start itemst-start gap-x-6 w-[100%] h-auto gap-y-2 sm:gap-y-1">
                        <label htmlFor="reserve_tent_option_aditional_people" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("reserve.aditional_people")}</label>
                        <input onChange={()=>calculateTentItemPrice()} name="reserve_tent_option_aditional_people" type="number" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("reserve.aditional_people")}/>
                          <div className="w-full h-6">
                            {errorMessages.reserve_tent_option_aditional_people && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {t(errorMessages.reserve_tent_option_aditional_people)}
                              </motion.p>
                            )}
                          </div>
                      </div>
                      <div className="checkbox-wrapper-13 px-2 w-full">
                        <input onChange={()=>calculateTentItemPrice()} name="reserve_tent_option_no_special_price" type="checkbox" aria-hidden="true" />
                        <label className="text-[12px]" htmlFor="canceled_status">{t("reserve.custom_price_not_apply")}</label>
                      </div>
                      <div className="w-full h-auto flex flex-row justify-end">
                        <span className="text-2xl">{formatPrice(tentItemTotalPrice)}</span>
                      </div>


                      <Button onClick={()=>handleAddReserveOption("tent")} size="sm" type="button" variant="dark" effect="default" isRound={true} className="w-auto ml-auto mt-auto">{t("reserve.add_glamping_reserve")}</Button>
                    </div>

                  )}

                  {openReserveOption == "product" && (
                    
                    <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden mt-6 gap-y-2 sm:gap-y-2">
                      <div className="flex flex-col justify-start items-start gap-x-6 w-[100%] h-auto gap-y-2 sm:gap-y-1">
                        <label htmlFor="reserve_product_option_id" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("reserve.product")}</label>
                          <select onChange={()=>calculateProductItemPrice()} name="reserve_product_option_id" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                              { datasetReservesOptions.products.map((product,index) => {
                                return(
                                  <option key={index} value={product.id}>{`${product.name} | ${t("reserve.price")}: ${formatPrice(product.price)} ${getCurrentCustomPrice(product.custom_price) >0 ? `| ${t("reserve.price_of_day")} ${formatPrice(getCurrentCustomPrice(product.custom_price))}`: " "}` }</option>
                                  )
                              })}
                          </select>
                          <div className="w-full h-6">
                            {errorMessages.reserve_product_option_id && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {t(errorMessages.reserve_product_option_id)}
                              </motion.p>
                            )}
                          </div>
                      </div>

                      <div className="flex flex-col justify-start itemst-start gap-x-6 w-[100%] h-auto gap-y-2 sm:gap-y-1">
                        <label htmlFor="reserve_product_option_quantity" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("reserve.quantity")}</label>
                        <input onChange={()=>calculateProductItemPrice()} name="reserve_product_option_quantity" type="number" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("reserve.quantity")}/>
                          <div className="w-full h-6">
                            {errorMessages.reserve_product_option_quantity && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {t(errorMessages.reserve_product_option_quantity)}
                              </motion.p>
                            )}
                          </div>
                      </div>
                      <div className="checkbox-wrapper-13 px-2 w-full">
                        <input onChange={()=>calculateProductItemPrice()} name="reserve_product_option_no_special_price" type="checkbox" aria-hidden="true" />
                        <label className="text-[12px]" htmlFor="reserve_product_option_no_special_price">{t("reserve.custom_price_not_apply")}</label>
                      </div>
                      <div className="w-full h-auto flex flex-row justify-end">
                        <span className="text-2xl">{formatPrice(productItemTotalPrice)}</span>
                      </div>


                      <Button onClick={()=>handleAddReserveOption("product")} size="sm" type="button" variant="dark" effect="default" isRound={true} className="w-auto ml-auto mt-auto">{t("reserve.add_product_reserve")}</Button>
                    </div>

                  )}

                  {openReserveOption == "experience" && (
                    
                    <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden mt-6 gap-y-2 sm:gap-y-2">

                      <div className="flex flex-col justify-start items-start gap-x-6 w-[100%] h-auto gap-y-2 sm:gap-y-1">
                        <label htmlFor="reserve_experience_option_id" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("reserve.experience")}</label>
                          <select onChange={()=>calculateExperienceItemPrice()} name="reserve_experience_option_id" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                              { datasetReservesOptions.experiences.map((experience,index) => {
                                return(
                                  <option key={index} value={experience.id}>{`${experience.name} | ${t("reserve.price")}: ${formatPrice(experience.price)} ${getCurrentCustomPrice(experience.custom_price) >0 ? `| ${t("reserve.price_of_day")} ${formatPrice(getCurrentCustomPrice(experience.custom_price))}`: " "} ` }</option>
                                  )
                              })}
                          </select>
                          <div className="w-full h-6">
                            {errorMessages.reserve_experience_option_id && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {t(errorMessages.reserve_experience_option_id)}
                              </motion.p>
                            )}
                          </div>
                      </div>
                      <div className="flex flex-col justify-start itemst-start gap-x-6 w-[100%] h-auto gap-y-2 sm:gap-y-1">
                        <label htmlFor="reserve_experience_option_quantity" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("reserve.quantity")}</label>
                        <input onChange={()=>calculateExperienceItemPrice()} name="reserve_experience_option_quantity" type="number" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("reserve.quantity")}/>
                          <div className="w-full h-6">
                            {errorMessages.reserve_experience_option_quantity && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {t(errorMessages.reserve_experience_option_quantity)}
                              </motion.p>
                            )}
                          </div>
                      </div>

                      <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                        <label htmlFor="reserve_experience_option_date" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("reserve.day_of_experience")}</label>
                        <input onChange={()=>calculateExperienceItemPrice()} name="reserve_experience_option_date" type="date" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("reserve.day_of_experience")}/>

                        <div className="w-full h-6">
                          {errorMessages.reserve_experience_option_date && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {t(errorMessages.reserve_experience_option_date)}
                            </motion.p>
                          )}
                        </div>
                      </div>
                      <div className="checkbox-wrapper-13 px-2 w-full">
                        <input onChange={()=>calculateExperienceItemPrice()} name="reserve_experience_option_no_special_price" type="checkbox" aria-hidden="true" />
                        <label className="text-[12px]" htmlFor="canceled_status">{t("reserve.custom_price_not_apply")}</label>
                      </div>
                      <div className="w-full h-auto flex flex-row justify-end">
                        <span className="text-2xl">{formatPrice(experienceItemTotalPrice)}</span>
                      </div>


                      <Button onClick={()=>handleAddReserveOption("experience")} size="sm" type="button" variant="dark" effect="default" isRound={true} className="w-auto ml-auto mt-auto">{t("reserve.add_experience_reserve")}</Button>
                    </div>

                  )}

                  {openReserveOption == "promotion" && (
                    
                    <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden mt-6 gap-y-2 sm:gap-y-2">

                      <div className="flex flex-col justify-start items-start gap-x-6 w-[100%] h-auto gap-y-2 sm:gap-y-1">
                        <label htmlFor="reserve_promotion_option_id" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("reserve.promotion")}</label>
                          <select onChange={()=>calculatePromotionItemPrice()} name="reserve_promotion_option_id" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                              { datasetReservesOptions.promotions.map((promotion,index) => {
                                return(
                                  <option key={index} value={promotion.id}>{`${t("reserve.promotion_name")}: ${promotion.title} | ${t("reserve.price")}: ${formatPrice(promotion.grossImport)} | ${t("reserve.price_of_day")}: ${promotion.discount}%`}</option>
                                  )
                              })}
                          </select>
                          <div className="w-full h-6">
                            {errorMessages.reserve_promotion_option_id && (
                              <motion.p 
                                initial="hidden"
                                animate="show"
                                exit="hidden"
                                variants={fadeIn("up","", 0, 1)}
                                className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                {t(errorMessages.reserve_promotion_option_id)}
                              </motion.p>
                            )}
                          </div>
                      </div>
                      <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6">
                          <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                            <label htmlFor="reserve_promotion_option_date_from" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("reserve.from")}</label>
                            <input onChange={()=>calculatePromotionItemPrice()} name="reserve_promotion_option_date_from" type="date" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("reserve.from")}/>

                            <div className="w-full h-6">
                              {errorMessages.reserve_promotion_option_date_from && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {t(errorMessages.reserve_promotion_option_date_from)}
                                </motion.p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                            <label htmlFor="reserve_promotion_option_date_to" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("reserve.from")}</label>
                            <input onChange={()=>calculatePromotionItemPrice()} name="reserve_promotion_option_date_to" type="date" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("reserve.to")}/>
                            <div className="w-full h-6">
                              {errorMessages.reserve_promotion_option_date_to && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {t(errorMessages.reserve_promotion_option_date_to)}
                                </motion.p>
                              )}
                            </div>
                          </div>
                      </div>
                      <div className="w-full h-auto flex flex-row justify-end">
                        <span className="text-2xl">{formatPrice(promotionItemTotalPrice)}</span>
                      </div>
                      <Button onClick={()=>handleAddReserveOption("promotion")} size="sm" type="button" variant="dark" effect="default" isRound={true} className="w-auto ml-auto mt-auto">{t("reserve.add_promotion_reserve")}</Button>
                    </div>

                  )}
                </div>
              </Modal>
            )}
          </AnimatePresence>
        )}

        {currentView == "V" && selectedReserve && (
            <motion.div 
                key={"View"}
                initial="hidden"
                animate="show"
                exit="hidden"
                viewport={{ once: true }}
                variants={fadeIn("up","",0.5,0.3)}
                className="w-full h-auto flex flex-col justify-start items-start gap-y-4">
                <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><Calendar/>{t("reserve.reserve")}</h2>

              <div className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6">

                <div className="flex flex-col justify-start items-start w-full">

                      <div className="flex flex-col justify-start items-start w-full h-auto my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="userId" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("reserve.user")}</label>
                        <input name="userId" className="hidden"/>
                        <input name="userId_name" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("reserve.user_selected")} value={`${selectedReserve.user_name ?? selectedReserve.userId} | ${selectedReserve.user_email ?? selectedReserve.userId}` } readOnly/>

                      </div>
                      <div className="w-full h-auto flex flex-row justify-between my-4">
                        <div className="w-[60%] xl:w-[40%] h-auto flex flex-row">
                          <select name="discount_code_selector" className="w-full xl:w-[50%] h-auto text-xs">
                            {selectedReserve.discount_code_id == 0 ?
                                <option key={"no_discount_applied"} value={`${0}_${0}_${0}`}>{t("reserve.no_discount")}</option>
                                :
                                <option key={"selected_discount"} value={`${selectedReserve.discount_code_id}_${selectedReserve.discount_code_name}_${selectedReserve.discount}`}>{`${t("reserve.discount_code")}: ${selectedReserve.discount_code_name} | ${t("reserve.discount")}: ${formatPrice(selectedReserve.discount)}%`} </option>
                            }
                          </select>
                        </div>
                      </div>
                      <table className="h-auto w-full shadow-xl rounded-xl text-center border-collapse table-fixed">
                        <thead className="font-primary text-xs xl:text-sm bg-secondary text-white rounded-t-xl">
                              <tr className="">
                                  <th className="w-[5%] rounded-tl-xl py-2">#</th>
                                  <th className="w-[50%] py-2">{t("reserve.item")}</th>
                                  <th className="w-[10%] py-2">{t("reserve.unit")}</th>
                                  <th className="w-[10%] py-2">{t("reserve.unit_price")}</th>
                                  <th className="w-[10%] py-2">{t("reserve.qty")}</th>
                                  <th className="w-[10%]   py-2">{t("reserve.price")}</th>
                              </tr>
                          </thead>
                          <tbody className="font-secondary text-xs xl:text-sm">

                              {selectedReserve.promotions.map((item, index) => (
                                <tr key={"reserve_key_promotion_"+index} className="text-slate-400 "> 
                                    <td className="border border-slate-300 text-center">{index + 1}</td>
                                    <td className="border border-slate-300 text-left">{`${item.name} | ${t("reserve.from")}: ${formatDateToYYYYMMDD(item.dateFrom)} ${t("reserve.to")}: ${formatDateToYYYYMMDD(item.dateTo)}`}</td>
                                    <td className="border border-slate-300 text-center">{t("reserve.unit")}</td>
                                    <td className="border border-slate-300 text-center">{formatPrice(item.price)}</td>
                                    <td className="border border-slate-300 text-center">{"1"}</td>
                                    <td className="border border-slate-300 text-center">{formatPrice(item.price)}</td>
                                </tr>
                              ))}

                              {selectedReserve.tents.map((item, index) => (
                                <tr key={"reserve_key_tent_"+index} className="text-slate-400 "> 
                                    <td className="border border-slate-300 text-center">{promotions.length + index + 1}</td> 
                                  <td className="border border-slate-300 text-left">{`${item.name} | ${t("reserve.from")}: ${formatDateToYYYYMMDD(item.dateFrom)} ${t("reserve.to")}: ${formatDateToYYYYMMDD(item.dateTo)} ${item.aditionalPeople > 0 ? `| ADP:${item.aditionalPeople} ADPP: ${formatPrice(item.aditionalPeoplePrice ?? 0)}` : "" }`}</td>
                                    <td className="border border-slate-300 text-center">{t("reserve.nights")}</td>
                                    <td className="border border-slate-300 text-center">{formatPrice(item.price + (item.aditionalPeople * (item.aditionalPeoplePrice ?? 0)))}</td>
                                    <td className="border border-slate-300 text-center">{item.nights}</td>
                                    <td className="border border-slate-300 text-center">{formatPrice(item.price * item.nights + ((item.aditionalPeoplePrice ?? 0) * item.aditionalPeople * item.nights))}</td>
                                </tr>
                              ))}

                              {selectedReserve.experiences.map((item, index) => (
                                <tr key={"reserve_key_experience_"+index} className="text-slate-400 "> 
                                    <td className="border border-slate-300 text-center">{promotions.length + tents.length + index + 1}</td>
                                    <td className="border border-slate-300 text-left">{`${item.name} | ${t("reserve.day_of_experience")} ${formatDateToYYYYMMDD(item.day)}`}</td>
                                    <td className="border border-slate-300 text-center">{t("reserve.unit")}</td>
                                    <td className="border border-slate-300 text-center">{formatPrice(item.price)}</td>
                                    <td className="border border-slate-300 text-center">{item.quantity}</td>
                                    <td className="border border-slate-300 text-center">{formatPrice(item.price * item.quantity)}</td>
                                </tr>
                              ))}

                              {selectedReserve.products.map((item, index) => (
                                <tr key={"reserve_key_product_"+index} className="text-slate-400 "> 
                                    <td className="border border-slate-300 text-center">{promotions.length + tents.length + experiences.length + index + 1}</td>
                                  <td className="border border-slate-300 text-left">{`${item.name}`}</td>
                                    <td className="border border-slate-300 text-center">{t("reserve.unit")}</td>
                                    <td className="border border-slate-300 text-center">{formatPrice(item.price)}</td>
                                    <td className="border border-slate-300 text-center">{item.quantity}</td>
                                    <td className="border border-slate-300 text-center">{formatPrice(item.price * item.quantity)}</td>
                                </tr>
                              ))}
                              <tr key={"reserve_key_net_import"} className="text-slate-400"> 
                                  <td className="border-[1px] border-t-secondary border-b-secondary" colSpan={5}>{t("reserve.gross_import")}</td>
                                  <td className="border-[1px] border-t-secondary border-b-secondary" colSpan={1}>{formatPrice(totals.gross_import)}</td>
                              </tr>
                              <tr key={"reserve_key_total"} className="text-slate-400"> 
                                  <td className="border-[1px] border-t-secondary border-b-secondary" colSpan={5}>{t("reserve.discount")}</td>
                                  <td className="border-[1px] border-t-secondary border-b-secondary" colSpan={1}>{formatPrice(((totals.discount/100) * totals.gross_import))}</td>
                              </tr>
                              <tr key={"reserve_key_gross_import"} className="text-slate-400"> 
                                  <td className="" colSpan={5}>{t("reserve.net_import")}</td>
                                  <td className="" colSpan={1}>{formatPrice(totals.net_import)}</td>
                              </tr>
                          </tbody>
                      </table>
                      <label className="text-secondary text-xs mt-2">{t("reserve.table_glosary")}</label>
                    <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6 mt-12">
                      <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                        <label htmlFor="payment_status" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("reserve.payment_status")}</label>
                        <select name="payment_status" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">

                          <option value={selectedReserve.payment_status}>{selectedReserve.payment_status == "PAID" ? t("reserve.PAID")  : t("reserve.UNPAID")}</option>
                        </select>
                      </div>

                      <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                        <label htmlFor="reserve_status" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("reserve.reserve_status")}</label>
                        <select name="reserve_status" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" >

                          <option value={selectedReserve.reserve_status}>{selectedReserve.reserve_status != "CONFIRMED" ? ( selectedReserve.reserve_status != "NOT_CONFIRMED" ? t("reserve.COMPLETE"): t("reserve.NOT_CONFIRMED") )  : t("reserve.CONFIRMED")}</option>
                        </select>
                      </div>

                    </div>

                    <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1  gap-y-2">

                      <label htmlFor="canceled_reason" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6 mb-2">{t("reserve.canceled")}</label>

                        <div className="checkbox-wrapper-13 px-2">
                          <input name="canceled_status" type="checkbox" aria-hidden="true" checked={selectedReserve.canceled_status} readOnly/>
                          <label htmlFor="canceled_status">{t("reserve.canceled_reserve")}</label>
                        </div>
                        <textarea name="canceled_reason" className="w-full h-8 sm:h-20 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("reserve.canceled_reason")} value={selectedReserve.canceled_reason} readOnly/>
                      </div>

                      <div className="flex flex-row justify-end gap-x-6 w-full mt-4">
                          <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>{t("reserve.go_back_reserves_list")}</Button>
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
                <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><Calendar/>{t("reserve.add_reserve")}</h2>

              <form id="form_create_reserve" className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" onSubmit={(e)=>onSubmitCreation(e)}>

                <div className="flex flex-col justify-start items-start w-full">

                      <div className="flex flex-col justify-start items-start w-full h-auto my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="search_user_email" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("reserve.search_user")}</label>
                        <div className="w-full h-auto flex flex-row justify-between gap-x-4 relative">
                          <input name="search_user_email" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("reserve.search_user")}/>
                          <AnimatePresence>
                            {users && users.length > 0 && (
                              <motion.div 
                                initial="hidden"
                                animate="show"
                                variants={fadeIn("up","", 0, 0.3)}
                                className="absolute left-0 top-8 sm:top-10 w-full max-h-[100px] min-h-[50px] overflow-y-scroll flex flex-col justify-start items-start bg-white py-2">
                                {users.map((userItem,index)=>{
                                  return(
                                    <span onClick={()=>selectUserId('form_create_reserve', userItem) } className="w-full h-auto text-sm font-primary text-secondary hover:bg-secondary hover:text-white duration-300 hover:cursor-pointer p-2" key={"user"+index}>{`${t("reserve.user")}: ${userItem.firstName},${userItem.lastName} ${t("reserve.email")}: ${userItem.email}`}</span>
                                  )
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <button type="button" onClick={()=>searchUsersByEmail('form_create_reserve')} className="w-auto h-auto border border-2 border-slate-200 p-2 rounded-xl active:scale-95 duration-300"><Search/></button>
                        </div>
                        <label htmlFor="userId" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("reserve.user")}</label>
                        <input name="userId" className="hidden"/>
                        <input name="userId_name" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("reserve.user_selected")}/>

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
                      <div className="w-full h-auto flex flex-row justify-between mb-4">
                        <div className="w-[60%] xl:w-[40%] h-auto flex flex-row">
                          <select name="discount_code_selector" onChange={(e)=>onChangeDiscountCode(e)} className="w-full xl:w-[50%] h-auto text-xs">
                                <option key={"no_discount_applied"} value={`${0}_${0}_${0}`}>{t("reserve.no_discount")}</option>
                              { datasetReservesOptions.discounts.map((discount,index) => {
                                return(
                                  <option className="text-xs" key={index} value={`${discount.id}_${discount.code}_${discount.discount}`}>{`${t("reserve.discount_code")}: ${discount.code} | ${t("reserve.discount")}: ${formatPrice(discount.discount)}%`}</option>
                                  )
                              })}
                          </select>
                        </div>
                        <Button type="button" onClick={()=>setOpenReserveOption("tent")} variant="ghostLight" rightIcon={<Plus/>} isRound={true} effect="default">{t("reserve.add_item")}</Button>
                      </div>
                      <table className="h-auto w-full shadow-xl rounded-xl text-center border-collapse table-fixed">
                        <thead className="font-primary text-xs xl:text-sm bg-secondary text-white rounded-t-xl">
                              <tr className="">
                                  <th className="w-[5%] rounded-tl-xl py-2">#</th>
                                  <th className="w-[40%] py-2">{t("reserve.item")}</th>
                                  <th className="w-[10%] py-2">{t("reserve.unit")}</th>
                                  <th className="w-[10%] py-2">{t("reserve.unit_price")}</th>
                                  <th className="w-[10%] py-2">{t("reserve.qty")}</th>
                                  <th className="w-[10%]   py-2">{t("reserve.price")}</th>
                                  <th className="w-[10%] py-2 rounded-tr-xl">{t("reserve.actions")}</th>
                              </tr>
                          </thead>
                          <tbody className="font-secondary text-xs xl:text-sm">

                              {promotions.map((item, index) => (
                                <tr key={"reserve_key_promotion_"+index} className="text-slate-400 "> 
                                    <td className="border border-slate-300 text-center">{index + 1}</td>
                                    <td className="border border-slate-300 text-left">{`${item.name} | ${t("reserve.from")}: ${formatDateToYYYYMMDD(item.dateFrom)} ${t("reserve.to")}: ${formatDateToYYYYMMDD(item.dateTo)}`}</td>
                                    <td className="border border-slate-300 text-center">{t("reserve.unit")}</td>
                                    <td className="border border-slate-300 text-center">{formatPrice(item.price)}</td>
                                    <td className="border border-slate-300 text-center">{"1"}</td>
                                    <td className="border border-slate-300 text-center">{formatPrice(item.price)}</td>
                                    <td className="border border-slate-300 text-center">{<button onClick={()=>handleRemoveReserveOption(index,"promotion")} className="h-auto w-auto hover:text-tertiary"><CircleX/></button>}</td>
                                </tr>
                              ))}

                              {tents.map((item, index) => (
                                <tr key={"reserve_key_tent_"+index} className="text-slate-400 "> 
                                    <td className="border border-slate-300 text-center">{promotions.length + index + 1}</td> 
                                  <td className="border border-slate-300 text-left">{`${item.name} | ${t("reserve.from")}: ${formatDateToYYYYMMDD(item.dateFrom)} ${t("reserve.to")}: ${formatDateToYYYYMMDD(item.dateTo)} ${item.aditionalPeople > 0 ? `| ADP:${item.aditionalPeople} ADPP: ${formatPrice(item.aditionalPeoplePrice ?? 0)}` : "" }`}</td>
                                    <td className="border border-slate-300 text-center">{t("reserve.nights")}</td>
                                    <td className="border border-slate-300 text-center">{formatPrice(item.price + (item.aditionalPeople * (item.aditionalPeoplePrice ?? 0)))}</td>
                                    <td className="border border-slate-300 text-center">{item.nights}</td>
                                    <td className="border border-slate-300 text-center">{formatPrice(item.price * item.nights + ((item.aditionalPeoplePrice ?? 0) * item.aditionalPeople * item.nights))}</td>
                                    <td className="border border-slate-300 text-center">{<button onClick={()=>handleRemoveReserveOption(index,"tent")} className="h-auto w-auto hover:text-tertiary"><CircleX/></button>}</td>
                                </tr>
                              ))}

                              {experiences.map((item, index) => (
                                <tr key={"reserve_key_experience_"+index} className="text-slate-400 "> 
                                    <td className="border border-slate-300 text-center">{promotions.length + tents.length + index + 1}</td>
                                    <td className="border border-slate-300 text-left">{`${item.name} | ${t("reserve.day_of_experience")} ${formatDateToYYYYMMDD(item.day)}`}</td>
                                    <td className="border border-slate-300 text-center">{t("reserve.unit")}</td>
                                    <td className="border border-slate-300 text-center">{formatPrice(item.price)}</td>
                                    <td className="border border-slate-300 text-center">{item.quantity}</td>
                                    <td className="border border-slate-300 text-center">{formatPrice(item.price * item.quantity)}</td>
                                    <td className="border border-slate-300 text-center">{<button onClick={()=>handleRemoveReserveOption(index,"experience")} className="h-auto w-auto hover:text-tertiary"><CircleX/></button>}</td>
                                </tr>
                              ))}

                              {products.map((item, index) => (
                                <tr key={"reserve_key_product_"+index} className="text-slate-400 "> 
                                    <td className="border border-slate-300 text-center">{promotions.length + tents.length + experiences.length + index + 1}</td>
                                  <td className="border border-slate-300 text-left">{`${item.name}`}</td>
                                    <td className="border border-slate-300 text-center">{t("reserve.unit")}</td>
                                    <td className="border border-slate-300 text-center">{formatPrice(item.price)}</td>
                                    <td className="border border-slate-300 text-center">{item.quantity}</td>
                                    <td className="border border-slate-300 text-center">{formatPrice(item.price * item.quantity)}</td>
                                    <td className="border border-slate-300 text-center">{<button onClick={()=>handleRemoveReserveOption(index,"product")} className="h-auto w-auto hover:text-tertiary"><CircleX/></button>}</td>
                                </tr>
                              ))}
                              <tr key={"reserve_key_net_import"} className="text-slate-400"> 
                                  <td className="border-[1px] border-t-secondary border-b-secondary" colSpan={5}>{t("reserve.gross_import")}</td>
                                  <td className="border-[1px] border-t-secondary border-b-secondary" colSpan={2}>{formatPrice(totals.gross_import)}</td>
                              </tr>
                              <tr key={"reserve_key_total"} className="text-slate-400"> 
                                  <td className="border-[1px] border-t-secondary border-b-secondary" colSpan={5}>{t("reserve.discount")}</td>
                                  <td className="border-[1px] border-t-secondary border-b-secondary" colSpan={2}>{formatPrice(((totals.discount/100) * totals.gross_import))}</td>
                              </tr>
                              <tr key={"reserve_key_gross_import"} className="text-slate-400"> 
                                  <td className="" colSpan={5}>{t("reserve.net_import")}</td>
                                  <td className="" colSpan={2}>{formatPrice(totals.net_import)}</td>
                              </tr>
                          </tbody>
                      </table>
                      <label className="text-secondary text-xs mt-2">{t("reserve.table_glosary")}</label>
                    <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1  gap-x-6 mt-12">
                      <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                        <label htmlFor="payment_status" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("reserve.payment_status")}</label>
                        <select name="payment_status" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                          <option value="UNPAID">{t("reserve.UNPAID")}</option>
                          <option value="PAID">{t("reserve.PAID")}</option>
                        </select>

                        <div className="w-full h-6">
                          {errorMessages.payment_status && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {errorMessages.payment_status}
                            </motion.p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col justify-start itemst-start gap-x-6 w-full h-auto gap-y-2 sm:gap-y-1">
                        <label htmlFor="reserve_status" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("reserve.reserve_status")}</label>
                        <select name="reserve_status" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                          <option value="CONFIRMED">{t("reserve.CONFIRMED")}</option>
                          <option value="NOT_CONFIRMED">{t("reserve.NOT_CONFIRMED")}</option>
                          <option value="COMPLETE">{t("reserve.COMPLETE")}</option>
                        </select>

                        <div className="w-full h-6">
                          {errorMessages.reserve_status && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {errorMessages.reserve_status}
                            </motion.p>
                          )}
                        </div>
                      </div>

                    </div>

                    <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1  gap-y-2">

                      <label htmlFor="canceled_reason" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6 mb-2">{t("reserve.canceled")}</label>

                        <div className="checkbox-wrapper-13 px-2">
                          <input name="canceled_status" type="checkbox" aria-hidden="true" />
                          <label htmlFor="canceled_status">{t("reserve.canceled_reserve")}</label>
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

                        <textarea name="canceled_reason" className="w-full h-8 sm:h-20 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("reserve.canceled_reason")}/>

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

                      <div className="flex flex-row justify-end gap-x-6 w-full">
                          <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>{t("common.cancel")}</Button>
                          <Button type="submit" size="sm" variant="dark" effect="default" isRound={true} isLoading={loadingForm}>{t("reserve.create_reserve")}</Button>
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
