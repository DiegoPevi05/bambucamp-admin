import Dashboard from "../components/ui/Dashboard";
import { useState, useEffect, FormEvent } from "react";
import { Eye, Pen, X, ChevronLeft, ChevronRight, CircleX, Percent } from "lucide-react";
import Button from "../components/ui/Button";
import { InputRadio } from "../components/ui/Input";
import {  formatDate, formatToISODate } from "../lib/utils";
import { getAllDiscountCodes, createDiscountCode, updateDiscountCode, deleteDiscountCode } from "../db/actions/discounts";
import { useAuth } from "../contexts/AuthContext";
import { DiscountCode, DiscountCodeFilters, DiscountCodeFormData } from "../lib/interfaces";
import { AnimatePresence, motion } from "framer-motion";
import {fadeIn} from "../lib/motions";
import {  ZodError } from 'zod';
import { DiscountCodeSchema } from "../db/schemas";
import Modal from "../components/Modal";
import {useTranslation} from "react-i18next";


const DashboardAdminDiscounts = () => {

    const {t,i18n} = useTranslation();
    const { user } = useAuth();
    const [datasetDiscountCodes,setDataSetDiscountCodes] = useState<{discountCodes:DiscountCode[],totalPages:Number,currentPage:Number}>({discountCodes:[],totalPages:1,currentPage:1});
    const [currentView,setCurrentView] = useState<string>("LOADING");

    useEffect(()=>{
        getDiscountCodesHandler(1);
    },[])

    const getDiscountCodesHandler = async (page:Number, filters?:DiscountCodeFilters) => {
        setCurrentView("LOADING");
        if(user != null){
            const experiences  = await getAllDiscountCodes(user.token,page,i18n.language,filters);
            if(experiences){
                setDataSetDiscountCodes(experiences);
                setCurrentView("L");
            }
        }
    }

    const [loadingForm, setLoadingForm] = useState<boolean>(false);

    const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

    const validateFields = (formname:string): DiscountCodeFormData |null => {
        const form = document.getElementById(formname) as HTMLFormElement;
        const code = (form.querySelector('input[name="code"]') as HTMLInputElement).value;
        const stock = Number((form.querySelector('input[name="stock"]') as HTMLInputElement).value);
        const discount = Number((form.querySelector('input[name="discount"]') as HTMLInputElement).value);
        const expiredDate = new Date ((form.querySelector('input[name="expiredDate"]') as HTMLInputElement).value); 
        const status = (form.querySelector('select[name="status"]') as HTMLInputElement).value;

        setErrorMessages({});

        try {
          DiscountCodeSchema.parse({code,stock,discount,expiredDate,status });

          return {
            code,
            stock,
            discount,
            expiredDate,
            status
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
        const fieldsValidated = validateFields('form_create_discount');
        if(fieldsValidated != null){
          if(user !== null){
            const isSuccess = await createDiscountCode(fieldsValidated, user.token, i18n.language);
            if(!isSuccess){
                setLoadingForm(false);
                return;
            }
          }
          getDiscountCodesHandler(1);
          setCurrentView("L")
        }
        setLoadingForm(false);
    };


    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);

    const [selectedDiscountCode, setSelectedDiscountCode] = useState<DiscountCode|null>(null);

    const searchDiscountCodeHandler = async() => {
        // Get the input value
        const searchValue = (document.querySelector('input[name="criteria_search_value"]') as HTMLInputElement).value.trim();

        // Get the selected criteria from radio buttons
        const selectedCriteria = (
        document.querySelector('input[name="criteria_search"]:checked') as HTMLInputElement
        )?.value;

        // Get the selected role from the select dropdown
        const selectedStatus = (document.querySelector('select[name="criteria_search_status"]') as HTMLSelectElement).value;


        // Construct filters based on input values and selected criteria
        const filters: DiscountCodeFilters = {};
        if (selectedCriteria && searchValue) {
            filters[selectedCriteria as keyof DiscountCodeFilters] = searchValue;
        }

        if (selectedStatus) {
            filters.status = selectedStatus;
        }

        getDiscountCodesHandler(1,filters);
    }

    const deleteDiscountCodeHandler = async() => {
        if(user != null && selectedDiscountCode != null){
            const isSuccess = await deleteDiscountCode(selectedDiscountCode.id,user.token, i18n.language)
            if(!isSuccess){
                return;
            }
        }
        getDiscountCodesHandler(1);
        setOpenDeleteModal(false);
    }

    const onChangeSelectedDiscountCode = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, type, value } = e.target;
        
        // Convert the value to a Date object if the input type is 'date'
        let fieldValue: any = value;

        if (type === 'date') {
          const date = new Date(value);
          const localOffset = date.getTimezoneOffset();
          const localDate = new Date( date.getTime() + localOffset );
          fieldValue = localDate;
        }

        setSelectedDiscountCode(prevSelectedDiscountCode => {
            if(!prevSelectedDiscountCode) return null
            return {
                ...prevSelectedDiscountCode,
                [name]: fieldValue,
            };
        });
    };

    const onSubmitUpdate = async (e: FormEvent) => {
        e.preventDefault();
        setLoadingForm(true);
        const fieldsValidated = validateFields('form_update_discount');
        if(fieldsValidated != null){
          if(user !== null && selectedDiscountCode != null){
              const isSuccess = await updateDiscountCode(selectedDiscountCode.id,fieldsValidated, user.token, i18n.language);
              if(!isSuccess){
                  setLoadingForm(false);
                  return;
              }
          }
          getDiscountCodesHandler(1);
          setCurrentView("L")
        }
        setLoadingForm(false);
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
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><Percent/>{t("discount.plural")}</h2>
                  <div className="w-full h-auto flex flex-col xl:flex-row  justify-start xl:justify-between items-center xl:gap-x-4">
                    <div className="w-full xl:w-auto h-auto flex flex-row  justify-between xl:justify-start items-start gap-y-4 gap-x-4">
                          <div className="max-xl:w-[50%] flex flex-col md:flex-row items-start md:items-center gap-x-2">
                            <input 
                              type="text" 
                              name="criteria_search_value"
                              placeholder={t("discount.search_discount")} 
                              className="w-full xl:w-96 h-8 text-xs font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-primary"
                            />
                            <InputRadio name="criteria_search" isRound={true} variant="light" value="title" placeholder="Nombre"/>
                          </div>
                          <div className="max-xl:w-[50%] flex flex-col md:flex-row items-start md:items-center gap-x-2">
                              <label className="max-xl:w-full md:ml-4 flex items-center">
                                {t("discount.status")}
                                <select name="criteria_search_status" className="max-xl:w-full ml-2 h-8 text-xs font-tertiary border-b-2 border-secondary focus:outline-none focus:border-b-primary">
                                  <option value="">{t("discount.select_status")}</option>
                                  <option value="ACTIVE">{t("discount.ACTIVE")}</option>
                                  <option value="INACTIVE">{t("discount.INACTIVE")}</option>
                                </select>
                              </label>
                              <Button variant="ghostLight" isRound={true} effect="default" className="md:ml-4 mt-4 md:mt-0" onClick={()=>searchDiscountCodeHandler()}>
                                {t("common.search")}
                            </Button>
                          </div>
                        </div>
                    <div className="w-full xl:w-auto h-auto flex flex-row justify-end items-start gap-y-4 gap-x-4 max-xl:mt-4">
                          <Button onClick={()=>{setCurrentView("A")}} size="sm" variant="dark" effect="default" className="min-w-[300px]" isRound={true}>{t("discount.add_discount")}<Percent/></Button>
                        </div>
                    </div>
                  <table className="h-full w-full shadow-xl rounded-xl text-center p-4">
                    <thead className="font-primary text-sm xl:text-md bg-primary text-white">
                            <tr className="">
                                <th className="rounded-tl-xl p-2">#</th>
                                <th className="p-2">{t("discount.discount_code")}</th>
                                <th className="p-2">{t("discount.discount_discount")}</th>
                                <th className="p-2">{t("discount.discount_expired_date")}</th>
                                <th className="p-2">{t("discount.discount_stock")}</th>
                                <th className="p-2">{t("discount.discount_status")}</th>
                              <th className="p-2 max-xl:hidden">{t("discount.created")}</th>
                              <th className="p-2 max-xl:hidden">{t("discount.updated")}</th>
                                <th className="rounded-tr-xl p-2">{t("discount.actions")}</th>
                            </tr>
                        </thead>
                    <tbody className="font-secondary text-xs xl:text-sm">
                                {datasetDiscountCodes.discountCodes.map((discountCodeItem,index)=>{
                                    return(
                                    <tr key={"user_key"+index} className="text-slate-400 hover:bg-secondary hover:text-white duration-300 cursor-pointer"> 
                                        <td className="">{discountCodeItem.id}</td>
                                        <td className="">{discountCodeItem.code}</td>
                                        <td className="">{discountCodeItem.discount}</td>
                                        <td className="">{discountCodeItem.expiredDate !== undefined && discountCodeItem.expiredDate != null ? formatToISODate(discountCodeItem.expiredDate) : "None"}</td>
                                        <td className="">{discountCodeItem.stock}</td>
                                        <td className="h-full">{discountCodeItem.status != "ACTIVE" ? "INACTIVO" : "ACTIVO" }</td>
                                      <td className="h-full max-xl:hidden">{discountCodeItem.updatedAt != undefined && discountCodeItem.updatedAt != null ? formatDate(discountCodeItem.updatedAt) : t("discount.none")}</td>
                                      <td className="h-full max-xl:hidden">{discountCodeItem.createdAt != undefined && discountCodeItem.createdAt != null ? formatDate(discountCodeItem.createdAt) : t("discount.none")}</td>
                                        <td className="h-full flex flex-col items-center justify-center">
                                          <div className="w-full h-auto flex flex-row flex-wrap gap-x-2">
                                            <button onClick={()=>{setSelectedDiscountCode(discountCodeItem); setCurrentView("V")}} className="border rounded-md hover:bg-primary hover:text-white duration-300 active:scale-75 p-1"><Eye className="h-5 w-5"/></button>
                                            <button  onClick={()=>{setSelectedDiscountCode(discountCodeItem); setCurrentView("E")}} className="border rounded-md hover:bg-primary hover:text-white duration-300 active:scale-75 p-1"><Pen className="h-5 w-5"/></button>
                                            <button onClick={()=>{setOpenDeleteModal(true),setSelectedDiscountCode(discountCodeItem)}} className="border rounded-md hover:bg-red-400 hover:text-white duration-300 active:scale-75 p-1"><X className="h-5 w-5"/></button>
                                          </div>
                                        </td>
                                    </tr>
                                    )
                                })}
                        </tbody>
                    </table>
                    <div className="flex flex-row justify-between w-full">
                        <Button onClick={ () => getDiscountCodesHandler( Number(datasetDiscountCodes.currentPage) - 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={datasetDiscountCodes.currentPage == 1}> <ChevronLeft/>  </Button>
                        <Button onClick={ () => getDiscountCodesHandler( Number(datasetDiscountCodes.currentPage) + 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={datasetDiscountCodes.currentPage >= datasetDiscountCodes.totalPages}> <ChevronRight/> </Button>
                    </div>
                </motion.div>

                <Modal isOpen={openDeleteModal} onClose={()=>setOpenDeleteModal(false)}>
                    <div className="w-[400px] h-auto flex flex-col items-center justify-center text-secondary pb-6 px-6 pt-12 text-center">
                        <CircleX className="h-[60px] w-[60px] text-red-400 "/>
                        <p className="text-primary">{t("discount.secure_delete_discount_header")}</p>
                        <p className="text-sm mt-6 text-secondary">{t("discount.secure_delete_discount_description")}</p>
                        <div className="flex flex-row justify-around w-full mt-6">
                            <Button size="sm" variant="dark" effect="default" isRound={true} onClick={()=>setOpenDeleteModal(false)}>{t("common.cancel")}</Button>
                            <Button size="sm" variant="danger" effect="default" isRound={true} onClick={()=>{deleteDiscountCodeHandler()}}>{t("common.accept")}</Button>
                        </div>
                    </div>
                </Modal>
            </>

        )}

        {currentView == "V" && selectedDiscountCode && (
                <motion.div 
                    key={"View"}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    viewport={{ once: true }}
                    variants={fadeIn("up","",0.5,0.3)}
                    className="w-full h-auto flex flex-col justify-start items-start gap-y-4">
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><Percent/>{t("discount.see_discount")}</h2>

                  <div className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" >

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%] h-full">

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="code" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("discount.discount_code_name")}</label>
                            <input name="code" value={selectedDiscountCode.code} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("discount.discount_code_name")} readOnly/>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="stock" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("discount.discount_code_quantity")}</label>
                            <input name="stock" value={selectedDiscountCode.stock} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("discount.discount_code_quantity")} readOnly/>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="discount" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("discount.discount_code_discount")}</label>
                            <input name="code" value={selectedDiscountCode.discount} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("discount.discount_code_discount")} readOnly/>
                          </div>

                      </div>

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%]">

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="expiredDate" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("discount.discount_code_expired_date")}</label>
                            <input name="expiredDate" type="date" value={selectedDiscountCode.expiredDate.toISOString().split('T')[0]} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("discount.discount_code_expired_date")} readOnly/>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="status" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("discount.discount_code_status")}</label>
                            <select name="status" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                              <option value={selectedDiscountCode.status}>{selectedDiscountCode.status == "ACTIVE" ? t("discount.ACTIVE") : t("discount.INACTIVE")}</option>
                            </select>
                          </div>

                          <div className="flex flex-row justify-end gap-x-6 w-full mt-12">
                              <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>{t("discount.go_back_discount_list")}</Button>
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
                <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><Percent/>{t("discount.add_discount")}</h2>

              <form id="form_create_discount" className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" onSubmit={(e)=>onSubmitCreation(e)}>

                <div className="flex flex-col justify-start items-start w-full lg:w-[50%] h-full">

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="code" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("discount.discount_code_name")}</label>
                        <input name="code" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("discount.discount_code_name")}/>
                        <div className="w-full h-6">
                          {errorMessages.code && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {t(errorMessages.code)}
                            </motion.p>
                          )}
                        </div>
                      </div>


                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="stock" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("discount.discount_code_quantity")}</label>
                        <input name="stock" type="number" step="1" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("discount.discount_code_quantity")}/>
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

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="discount" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("discount.discount_code_discount")}</label>
                        <input name="discount" type="number" step="1" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("discount.discount_code_discount")}/>
                        <div className="w-full h-6">
                          {errorMessages.discount && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {t(errorMessages.discount)}
                            </motion.p>
                          )}
                        </div>
                      </div>

                </div>

                <div className="flex flex-col justify-start items-start w-full lg:w-[50%]">

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="expiredDate" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("discount.discount_code_expired_date")}</label>
                        <input name="expiredDate" type="date" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("discount.discount_code_expired_date")}/>
                        <div className="w-full h-6">
                          {errorMessages.expiredDate && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {t(errorMessages.expiredDate)}
                            </motion.p>
                          )}
                        </div>
                      </div>


                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="status" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("discount.discount_code_status")}</label>
                        <select name="status" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                          <option value="ACTIVE">{t("discount.ACTIVE")}</option>
                          <option value="INACTIVE">{t("discount.INACTIVE")}</option>
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

                      <div className="flex flex-row justify-end gap-x-6 w-full">
                          <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>{t("common.cancel")}</Button>
                          <Button type="submit" size="sm" variant="dark" effect="default" isRound={true} isLoading={loadingForm}>{t("discount.create_discount")}</Button>
                      </div>

                  </div>
                </form>
            </motion.div>
        )}

        {currentView === "E" && selectedDiscountCode && (
                <motion.div 
                    key={"Edit-View"}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    viewport={{ once: true }}
                    variants={fadeIn("up","",0.5,0.3)}
                    className="w-full h-auto flex flex-col justify-start items-start gap-y-4">
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><Percent/>{t("discount.edit_discount")}</h2>

                  <form id="form_update_discount" className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" onSubmit={(e)=>onSubmitUpdate(e)}>

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%] h-full">

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="code" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("discount.discount_code_name")}</label>
                            <input name="code" value={selectedDiscountCode.code}  onChange={(e)=>onChangeSelectedDiscountCode(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("discount.discount_code_name")}/>
                            <div className="w-full h-6">
                              {errorMessages.code && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {t(errorMessages.code)}
                                </motion.p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="stock" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("discount.discount_code_quantity")}</label>
                            <input name="stock" type="number" step="1" value={selectedDiscountCode.stock}  onChange={(e)=>onChangeSelectedDiscountCode(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("discount.discount_code_quantity")}/>
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

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="discount" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("discount.discount_code_discount")}</label>
                            <input name="discount" type="number" step="1" value={selectedDiscountCode.discount}  onChange={(e)=>onChangeSelectedDiscountCode(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("discount.discount_code_discount")}/>
                            <div className="w-full h-6">
                              {errorMessages.discount && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {t(errorMessages.discount)}
                                </motion.p>
                              )}
                            </div>
                          </div>
                      </div>

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%]">

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="expiredDate" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("discount.discount_code_expired_date")}</label>
                            <input name="expiredDate" type="date" value={selectedDiscountCode.expiredDate.toISOString().split('T')[0]}  onChange={(e)=>onChangeSelectedDiscountCode(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("discount.discount_code_expired_date")}/>
                            <div className="w-full h-6">
                              {errorMessages.expiredDate && (
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                  {t(errorMessages.expiredDate)}
                                </motion.p>
                              )}
                            </div>
                          </div>


                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="status" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("discount.discount_code_status")}</label>
                            <select name="status" onChange={(e)=>onChangeSelectedDiscountCode(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" value={selectedDiscountCode.status}>
                              <option value="ACTIVE">{t("discount.ACTIVE")}</option>
                              <option value="INACTIVE">{t("discount.INACTIVE")}</option>
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

                          <div className="flex flex-row justify-end gap-x-6 w-full">
                              <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>{t("common.cancel")}</Button>
                              <Button type="submit" size="sm" variant="dark" effect="default" isRound={true} isLoading={loadingForm}>{t("discount.save_changes")}</Button>
                          </div>

                      </div>
                    </form>
                </motion.div>
                )}

        </AnimatePresence>
    </Dashboard>
    )
}

export default DashboardAdminDiscounts;
