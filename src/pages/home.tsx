import { useState,useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn, fadeOnly } from "../lib/motions";
import { useTranslation } from "react-i18next";
import  Button from "../components/ui/Button";
import { CalendarCheck, DoorClosed, Tent as TentIcon, Pizza,  DoorOpen,Coins,CircleSlash, CreditCard, FlameKindling, Plus, Info, CircleX, CircleCheck, User, ChevronLeft, ChevronRight, ShoppingBasket, X, FileDown, ReceiptText, CheckIcon  } from "lucide-react"
import {   NotificationDto, PublicExperience, PublicProduct, Reserve, ReserveExperienceDto, ReserveTentDto, createReserveExperienceDto, createReserveProductDto } from "../lib/interfaces";
import Modal from "../components/Modal";
import Dashboard from "../components/ui/Dashboard";
import { InputRadio } from "../components/ui/Input";
import { getTentsNames, getProductsNames, getExperiencesNames, formatPrice, formatDate, getReserveDates, formatDateToYYYYMMDD, getRangeDatesForReserve, countUnconfirmedItems } from "../lib/utils";
import ServiceItem from "../components/ServiceItem";
import Calendar from "../components/Calendar";
import {useAuth} from "../contexts/AuthContext";
import { confirmEntity, downloadBillForReserve, getAllMyReserves, getAllMyReservesCalendar } from "../db/actions/reserves";
import { getAllNotifications } from "../db/actions/notifications";
import {addExperienceToReserve, addProductToReserve, getPublicExperiences, getPublicProducts} from "../db/actions/reserves";
import ExperienceCard from "../components/ExperienceCard";
import { toast } from "sonner";
import ProductCard from "../components/ProductCard";
import {useNavigate} from "react-router-dom";
import {NO_NOTIFICATIONS, NO_RESERVATIONS} from "../assets/images";


interface NotificationCardProps {
  notification: NotificationDto;
}

const NotificationCard = (props:NotificationCardProps) => {

  const { notification } = props;
  const [openModal,setOpenModal] = useState<boolean>(false); 

  return (
    <>
      <motion.div 
        initial="hidden"
        whileInView="show"
        viewport={{once: true}}
        variants={fadeOnly("",0.5,0.5)}
        onClick={()=>setOpenModal(true)}
        className="bg-white p-2 rounded-xl shadow-lg border-2 border-gray-200 w-full h-auto relative flex flex-col hover:bg-secondary duration-300 cursor-pointer group active:scale-95">
        <div className="w-full h-auto flex flex-row gap-x-2">
          { notification.type === "ERROR" && <CircleX className="h-5 w-5 text-tertiary"/>}
          { notification.type === "SUCCESS" && <CircleCheck className="h-5 w-5 text-tertiary"/>}
          { notification.type === "INFORMATION" && <Info className="h-5 w-5 text-tertiary"/>}
          <h2 className="group-hover:text-tertiary text-sm sm:text-md">{notification.title}</h2>
          <h3 className="ml-auto text-xs text-secondary">{formatDate(notification.date)}</h3>
        </div>
        <p className="text-xs sm:text-sm text-secondary group-hover:text-white font-secondary">{notification.preview}</p>
      </motion.div>
      <Modal isOpen={openModal} onClose={()=>setOpenModal(false)}>
        <div className="w-full h-auto flex flex-col items-center justify-center text-secondary p-12">
          { notification.type === "ERROR" && <CircleX className="h-[60px] w-[60px] text-tertiary"/>}
          { notification.type === "SUCCESS" && <CircleCheck className="h-[60px] w-[60px] text-tertiary"/>}
          { notification.type === "INFORMATION" && <Info className="h-[60px] w-[60px] text-tertiary"/>}
          <p className="text-primary">{notification.title}</p>
          <p className="text-sm mt-6 text-secondary">{notification.description}</p>
        </div>
      </Modal>
    </>
  )
}



interface ReserveCardProps {
  reserve: Reserve;
  fetchReserves: (page:Number) => void;
  currentPage:Number;
};


const ReserveCard = (props:ReserveCardProps) => {
  const { fetchReserves, currentPage, reserve } = props;
  const {user} = useAuth();
  const {t,i18n} = useTranslation();
  const [openReserve,setOpenReserve] = useState<boolean>(false);
  const [openDetails,setOpenDetails] = useState<string>("tents");
  const [selectedOption,setSelectedOption] = useState<number>(0);
  const [selectedTent,setSelectedTent] = useState<ReserveTentDto|undefined>(undefined);
  const [selectedExperience,setSelectedExperience] = useState<ReserveExperienceDto|undefined>(undefined);
  const [stateAdd,setStateAdd] = useState<string|undefined>(undefined);


  useEffect(() => {
    if(openDetails == "tents"){
      const tent = reserve.tents.find((_,index) => index === selectedOption);
        setSelectedTent(tent);
    }else{
      setSelectedTent(undefined);
    }

    if(openDetails == "experiences"){
      const experience = reserve.experiences.find((_,index) => index === selectedOption);
      setSelectedExperience(experience);
    }else{
      setSelectedExperience(undefined);
    }

  },[openDetails,selectedOption])


  const [experiencesDB,setExperiencesDB] = useState<PublicExperience[]>([]);
  const [experiences,setExperiences] = useState<createReserveExperienceDto[]>([]);

  const [productsDB,setProductsDB] = useState<PublicProduct[]>([]);
  const [products,setProducts] = useState<createReserveProductDto[]>([]);

  useEffect(()=> {
    if(stateAdd == "add_experience"){
      setExperiences([]);
      getExperiencesHandler();
    }

    if(stateAdd == "add_product"){
      setProducts([]);
      getProductsHandler();
    }
  },[stateAdd])

  const getExperiencesHandler = async() => {
      const dataExperiences = await getPublicExperiences(i18n.language);
      if(dataExperiences != null){
        setExperiencesDB(dataExperiences);
      }
  };

  const getProductsHandler = async() => {
      const dataProducts = await getPublicProducts(i18n.language);
      if(dataProducts != null){
        setProductsDB(dataProducts);
      }
  };

  const handleAddExperienceToBasket = (idExperience:number, quantity:number, day:Date) => {
    const experience = experiencesDB.find(experience => experience.id === Number(idExperience))
    if(experience){
      setExperiences(prevExperiences => ([
      ...prevExperiences,
      { reserveId:reserve.id, idExperience,  name: experience.name , price: (experience.price == experience.custom_price ? experience.price : experience.custom_price ), quantity: quantity, day: day, confirmed:false  }
      ]
    ));
    }
  }
  const removeExperienceFromBasket = (indexExperience:number) => {
    setExperiences(prevExperiences => (
      prevExperiences.filter((_,i) => i !== indexExperience)
    ));
  }

  const handleAddProductToBasket = (idProduct:number, quantity:number) => {
    const product = productsDB.find(product => product.id === Number(idProduct))
    if(product){
      setProducts(prevProduct => ([
      ...prevProduct,
      { reserveId:reserve.id, idProduct,  name: product.name , price: (product.price == product.custom_price ? product.price : product.custom_price ) , quantity: quantity, confirmed:false  }
      ]
    ));
    }
  }
  const removeProductFromBasket = (indexProduct:number) => {
    setProducts(prevProducts => (
      prevProducts.filter((_,i) => i !== indexProduct)
    ));
  }

  const [loadingCreateExperienceInReserve,setLoadingCreateExperienceInReserve] = useState<boolean>(false);


  const addExperienceToReserveHandler = async() => {
    setLoadingCreateExperienceInReserve(true);
    if(user == null){
      toast.error(t("reserve.user_log_in_experience"));
      setLoadingCreateExperienceInReserve(false);
      return;
    }
    const responseReserve = await addExperienceToReserve(experiences,user.token,i18n.language);
    if(responseReserve){
      fetchReserves(currentPage);
      setLoadingCreateExperienceInReserve(false);
      setStateAdd(undefined);
    }
    setLoadingCreateExperienceInReserve(false);
  }

  const [loadingCreateProductInReserve,setLoadingCreateProductInReserve] = useState<boolean>(false);

  const addProductToReserveHandler = async() => {
    setLoadingCreateProductInReserve(true);
    if(user == null){
      toast.error(t("reserve.user_log_in_product"));
      setLoadingCreateProductInReserve(false);
      return;
    }
    const responseReserve = await addProductToReserve(products,user.token,i18n.language);
    if(responseReserve){
      fetchReserves(currentPage);
      setLoadingCreateProductInReserve(false);
      setStateAdd(undefined);
    }
    setLoadingCreateProductInReserve(false);
  }

  const [loadingConfirmation,setLoadingConfirmation] = useState<boolean>(false);

  const HandlerConfirmEntity = async(entityType:string, idReserve:number, entityId?:number) => {
    setLoadingConfirmation(true);
    if(user !== null ){
      const confimedEntity = await confirmEntity(entityType, idReserve, user.token, i18n.language,entityId);
      if(confimedEntity){
        fetchReserves(currentPage);
      }
    }
    setLoadingConfirmation(false);
  }

  const downloadReceipt = async(idReserve:Number) => {
    if(user !== null ){
      await downloadBillForReserve(idReserve, user.token, i18n.language);
    }
  }

  return (
    <>
    <motion.div 
      initial="hidden"
      whileInView="show"
      viewport={{once: true}}
      variants={fadeIn("up","",0,0.5)}
      className="relative bg-white p-2 rounded-xl shadow-lg border-2 border-gray-200 w-full h-auto  gap-x-4 mt-4 flex flex-col sm:grid sm:grid-cols-6 sm:grid-rows-8">
      {countUnconfirmedItems(reserve) > 0 &&
        (
        <span className="absolute -right-4 -top-4 bg-red-400 rounded-full h-8 w-8 flex justify-center items-center text-white">
          {countUnconfirmedItems(reserve)}
        </span>
      )}


        {/* Header Section */}
        <div className="col-span-6 row-span-1 flex flex-row gap-x-4">
          <div className={`w-full flex flex-row ${reserve.reserve_status == "NOT_CONFIRMED" ? "justify-start": "justify-between"} gap-x-4`}>
            <Button
              effect="default"
              className="w-auto max-sm:text-[12px]"
              size="sm"
              variant="ghostLight"
              onClick={() => downloadReceipt(reserve.id)}
              rightIcon={<FileDown />}
              disabled={reserve.canceled_status || (reserve.payment_status != "PAID" && reserve.reserve_status != "COMPLETED") }
              isRound={true}>
              {t("reserve.download_bill")} 
            </Button>
            <Button
              effect="default"
              className="w-auto max-sm:text-[12px]"
              size="sm"
              variant="ghostLight"
              onClick={() => setOpenReserve(true)}
              rightIcon={<ReceiptText/>}
              isRound={true}>
              {t("reserve.view_details")} 
            </Button>
          </div>
          {reserve.reserve_status == "NOT_CONFIRMED" &&
            <Button rightIcon={<CheckIcon/>} size="sm" isRound={true} effect={"default"} variant="ghostLight" isLoading={loadingConfirmation} onClick={()=>HandlerConfirmEntity("RESERVE",reserve.id)} >
              {t("reserve.confirm")}
            </Button>
          }
        </div>

        {/* Left Section */}
        <div className="col-span-6 sm:col-span-4 lg:col-span-3 row-span-3 sm:row-span-6 p-4 grid grid-cols-2 gap-y-4">
          <div className="col-span-1">
            <h2 className="text-sm font-secondary text-primary flex flex-row gap-x-2 items-start">
              <CircleSlash className="h-5 w-5"/>
              {t("reserve.identificator")}:
            </h2>
            <p className="text-xs font-primary text-slate-400 mt-2">
              {reserve.external_id}
            </p>
          </div>
          <div className="col-span-1">
            <h2 className="text-sm font-secondary text-primary flex flex-row gap-x-2 items-start">
              <CalendarCheck className="h-5 w-5"/>
              {t("reserve.reservation")}:
            </h2>
            <p className="text-xs font-primary text-slate-400 mt-2">
              {reserve.reserve_status !== "NOT_CONFIRMED" 
                ? reserve.reserve_status === "CONFIRMED" 
                  ? t("reserve.CONFIRMED") 
                  : t("reserve.COMPLETE") 
                : t("reserve.NOT_CONFIRMED")}
            </p>
          </div>
          <div className="col-span-1">
            <h2 className="text-sm font-secondary text-primary flex flex-row gap-x-2 items-start">
              <Coins className="h-5 w-5"/>
              {t("reserve.total_import")}:
            </h2>
            <p className="text-xs font-primary text-slate-400 mt-2">
              {formatPrice(reserve.net_import)}
            </p>
          </div>
          <div className="col-span-1">
            <h2 className="text-sm font-secondary text-primary flex flex-row gap-x-2 items-start">
              <CreditCard className="h-5 w-5"/>
              {t("reserve.reservation")}:
            </h2>
            <p className="text-xs font-primary text-slate-400 mt-2">
              {reserve.payment_status === "PAID" ? t("reserve.PAID") : t("reserve.UNPAID")}
            </p>
          </div>
          <div className="col-span-1">
            <h2 className="text-sm font-secondary text-primary flex flex-row gap-x-2 items-start">
              <DoorClosed className="h-5 w-5"/>
              {t("Check In")}:
            </h2>
            <p className="text-xs font-primary text-slate-400 mt-2">
              {formatDate(getReserveDates(reserve.tents).dateFrom)}
            </p>
          </div>
          <div className="col-span-1">
            <h2 className="text-sm font-secondary text-primary flex flex-row gap-x-2 items-start">
              <DoorOpen className="h-5 w-5"/>
              {t("Check Out")}:
            </h2>
            <p className="text-xs font-primary text-slate-400 mt-2">
              {formatDate(getReserveDates(reserve.tents).dateTo)}
            </p>
          </div>
        </div>

        {/* Right Section */}
        <div className="col-span-6 sm:col-span-2 lg:col-span-3 row-span-3 sm:row-span-6 p-4 grid grid-cols-1 gap-y-4 sm:border-l-2 sm:border-slate-200">
          <div>
            <h2 className="text-sm font-secondary text-primary flex flex-row gap-x-2 items-start">
              <TentIcon className="h-5 w-5"/>
              {t("reserve.glampings")}:
            </h2>
            <p className="text-xs font-primary text-slate-400 mt-2">
              {getTentsNames(reserve)}
            </p>
          </div>
          <div>
            <h2 className="text-sm font-secondary text-primary flex flex-row gap-x-2 items-start">
              <Pizza className="h-5 w-5"/>
              {t("reserve.products")}:
            </h2>
            <p className="text-xs font-primary text-slate-400 mt-2">
              {getProductsNames(reserve)}
            </p>
          </div>
          <div>
            <h2 className="text-sm font-secondary text-primary flex flex-row gap-x-2 items-start">
              <FlameKindling className="h-5 w-5"/>
              {t("reserve.experiences")}:
            </h2>
            <p className="text-xs font-primary text-slate-400 mt-2">
              {getExperiencesNames(reserve)}
            </p>
          </div>
        </div>

      </motion.div>

      <Modal isOpen={openReserve} onClose={()=>setOpenReserve(false)}>
        <div className="w-screen lg:w-[800px] h-auto lg:h-[600px] flex flex-col items-start justify-start text-secondary py-16 px-4 sm:p-6 overflow-hidden">
          <div className="w-full h-auto flex flex-row gap-x-4 sm:gap-x-6 pb-4 border-b-2 border-secondary">
              <InputRadio  
                className="w-auto" 
                onClick={()=>{setOpenDetails("tents") ; setSelectedOption(0)}} 
                name="category" 
                placeholder={t("reserve.glampings")} 
                rightIcon={<TentIcon/>} 
                checked={openDetails === "tents"}
                readOnly
              />
              <InputRadio  
                className="w-auto" 
                onClick={()=>{setOpenDetails("products"); setSelectedOption(0);setStateAdd(undefined)}} 
                name="category" 
                placeholder={t("reserve.products")} 
                rightIcon={<Pizza/>}
                checked={openDetails === "products"}
                readOnly
              />
              <InputRadio  
                className="w-auto" 
                onClick={()=>{setOpenDetails("experiences"); setSelectedOption(0);setStateAdd(undefined)}} 
                name="category" 
                placeholder={t("reserve.experiences")} 
                rightIcon={<FlameKindling/>}
                checked={openDetails === "experiences"}
                readOnly
              />
            </div>
            <div className="w-full h-auto overflow-scroll-x">
              {openDetails === "tents" && (
                  <motion.div 
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    variants={fadeIn("left","",0.5,0.5)}
                    className="w-full flex flex-row gap-x-6 py-4">
                    {reserve.tents.length > 0 ? (
                      reserve.tents.map((tent, index) => (
                        <InputRadio 
                          key={"tent_option"+index} 
                          variant="light" 
                          value={tent.idTent} 
                          name="tent" 
                          placeholder={tent.name} 
                          rightIcon={<TentIcon/>} 
                          onClick={()=>setSelectedOption(index)}
                          checked={selectedOption === index}
                          readOnly
                        />
                      )
                    ))
                    : 
                    <div className="w-full h-[200px] flex justify-center items-center flex-col">
                      <TentIcon className="h-12 w-12"/>
                      <p className="text-secondary text-sm">{t("reserve.no_tents_available")}</p>
                      <Button 
                        className="w-auto mt-4"
                        effect="default"
                        size="sm" 
                        variant="ghostLight" 
                        rightIcon={<Plus/>}
                      >{t("reserve.add_tent")}</Button>
                    </div>
                    }
                  </motion.div>
              )}

              {openDetails === "products" && stateAdd != "add_product" && (
                <motion.div 
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  variants={fadeIn("left","",0.5,0.5)}
                  className="w-full flex flex-col gap-y-6 py-4">

                  {reserve.products.length > 0 ? (
                    <>
                      <div className="w-full h-auto flex flex-row justify-end items-center">
                        <Button 
                          onClick={()=>setStateAdd("add_product")}
                          className="w-auto"
                          effect="default"
                          size="sm" 
                          variant="ghostLight" 
                          rightIcon={<Plus/>}
                        >{t("reserve.add_product")}</Button>
                      </div>
                      <div className="w-full h-full sm:h-[300px] flex flex-col">
                        <div className="w-full h-full flex flex-col gap-y-6 overflow-y-scroll pr-2">
                            {reserve.products.map((product, index) => (
                              <div key={"product"+index} className="flex flex-col w-full border border-2 border-gray-200 p-2 rounded-lg">

                                {!product.confirmed && (
                                  <div className="w-full h-auto flex justify-between mb-2">
                                    <span className="text-[10px] bg-red-100 text-red-400 w-auto sm:w-[50%] rounded-lg px-4 py-1 mb-2 flex flex-row gap-x-2">
                                      <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-300"></span>
                                      </span>
                                      {t("reserve.pending_product")}
                                    </span>
                                    <Button isLoading={loadingConfirmation} onClick={()=>HandlerConfirmEntity("PRODUCT",reserve.id,product.id)} rightIcon={<CheckIcon/>} size="sm" isRound={true} effect={"default"} variant="ghostLight">
                                      {t("reserve.confirm")}
                                    </Button>
                                  </div>
                                )}
                                <div className="flex flex-row w-full">
                                  <div className="w-48 h-24 bg-gray-200 rounded-lg">
                                    <img src={`${product?.productDB?.images[0]}`} alt={product?.productDB?.name} className="w-full h-full object-cover"/>
                                  </div>
                                  <div className="w-full h-auto flex flex-col gap-y-2 px-4">
                                    <p className="text-primary text-sm">{product?.productDB?.name}</p>
                                    <p className="text-secondary text-xs">{product?.productDB?.description}</p>
                                    <p className="text-primary text-sm mt-auto">{formatPrice(product.price)}</p>
                                  </div>
                                  <div className="w-24 h-auto flex flex-col justify-center items-center">
                                    <p className="text-primary text-sm">{t("reserve.quantity")}</p>
                                    <p className="text-primary text-sm">{product.quantity}</p>
                                    <p className="text-primary text-sm mt-auto">{formatPrice(product.quantity ? product.price*product.quantity : 0 )}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                      <div className="w-full h-auto flex flex-row justify-between  border-t-2 border-secondary mt-auto p-4">
                        <p className="text-primary text-sm">{t("reserve.gross_amount")}</p>
                        <p className="text-primary text-sm">{formatPrice(reserve.products.reduce((acc,product) => acc + product.price*product?.quantity,0))}</p>
                      </div>
                    </>
                  )
                  : 
                    <div className="w-full h-[200px] flex justify-center items-center flex-col">
                      <Pizza className="h-12 w-12"/>
                      <p className="text-secondary text-sm">{t("reserve.no_products_available")}</p>
                      <Button 
                        onClick={()=>setStateAdd("add_product")}
                        className="w-auto mt-4"
                        effect="default"
                        size="sm" 
                        variant="ghostLight" 
                        rightIcon={<Plus/>}
                      >{t("reserve.add_product")}</Button>
                    </div>
                  }
                </motion.div>
              )}

              {openDetails === "experiences" && stateAdd != "add_experience" && (
                <motion.div 
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  variants={fadeIn("left","",0.5,0.5)}
                  className="w-full flex flex-col-reverse sm:flex-row py-4 items-start max-sm:gap-y-4 sm:items-center justify-start">
                  {
                  reserve.experiences.length > 0 ? (
                    <>
                      <div className="w-full sm:w-[60%] flex flex-row justify-start items-start overflow-hidden">
                        <div className="h-auto flex flex-row justify-start items-start gap-x-4 overflow-x-scroll w-full pb-2">
                          {
                            reserve.experiences.map((experience, index) => (
                                <InputRadio 
                                  key={"tent_option"+index} 
                                  variant="light" 
                                  value={experience?.experienceDB?.id} 
                                  name="experience" 
                                  placeholder={experience?.experienceDB?.name} 
                                  rightIcon={<FlameKindling/>} 
                                  onClick={()=>setSelectedOption(index)}
                                  checked={selectedOption === index}
                                  className="flex-shrink-0"
                                  readOnly
                                />
                            ))
                          }
                        </div>
                      </div>
                      <div className="w-full sm:w-[40%] flex flex-row justify-end h-auto">
                        <Button 
                          onClick={()=>(setStateAdd("add_experience"),setSelectedExperience(undefined))}
                          className="w-auto"
                          effect="default"
                          size="sm" 
                          variant="ghostLight" 
                          rightIcon={<Plus/>}
                        >{t("reserve.add_experience")}</Button>
                      </div>
                    </>
                  )
                  :
                    <div className="w-full h-[200px] flex justify-center items-center flex-col">
                      <FlameKindling className="h-12 w-12"/>
                      <p className="text-secondary text-sm">{t("reserve.no_experiences_available")}</p>
                      <Button 
                        onClick={()=>(setStateAdd("add_experience"),setSelectedExperience(undefined))}
                        className="w-auto mt-4 mx-auto"
                        effect="default"
                        size="sm" 
                        variant="ghostLight" 
                        rightIcon={<Plus/>}
                      >{t("reserve.add_experience")}</Button>
                    </div>
                  }
                </motion.div>
              )}
            </div>
          {stateAdd == "add_experience" && openDetails === "experiences" && (
            <>
              <div className="w-full h-[10%] flex flex-row justify-end items-center mt-2">
                <Button 
                  onClick={()=>setStateAdd(undefined)}
                  className="w-auto"
                  effect="default"
                  size="sm" 
                  variant="ghostLight" 
                  rightIcon={<FlameKindling/>}
                >{t("reserve.my_experiences")}</Button>
              </div>
              <motion.div 
                initial="hidden"
                animate="show"
                exit="hidden"
                variants={fadeIn("up","",0.5,0.5)}
                className="w-full h-[90%] flex flex-col lg:flex-row py-4 gap-y-4 lg:gap-x-2 pb-12">
                <div className="w-full lg:w-[50%] h-full flex flex-col justify-start items-start overlfow-hidden border-2 border-slate-200 rounded-md p-2">
                  <div className="w-full h-[90%] overflow-hidden p-none m-none">
                    <div className="w-full h-full flex flex-col justify-start items-start mb-2">
                      <span className="flex flex-row items-end gap-x-2">
                        <ShoppingBasket className="h-5 w-5"/>
                        <h2 className="text-lg">{t("reserve.list")}</h2>
                      </span>
                      <div className="w-full h-auto flex flex-col gap-y-3 mt-4 overflow-y-scroll">
                        {experiences.length > 0 ?
                          experiences.map((experienceCart,index)=>{
                          return(
                            <div key={`reserve_experience_cart_${index}`} className="flex flex-row w-full h-auto border-2 border-slate-200 rounded-lg shadow-sm p-4">
                              <div className="flex flex-col h-full w-auto">
                                <span className="text-sm mt-auto text-tertiary">{experienceCart.name}</span>
                                <div className="flex flex-row gap-x-2"><span className="text-xs text-secondary">{t("reserve.quantity")} :</span><span className="text-xs mt-auto">{experienceCart.quantity}</span></div>
                                <div className="flex flex-row gap-x-2"><span className="text-xs text-secondary">{t("reserve.unit_price")}:</span><span className="text-xs mt-auto">{formatPrice(experienceCart.price)}</span></div>
                                <div className="flex flex-row gap-x-2"><span className="text-xs text-secondary">{t("reserve.day")} :</span><span className="text-xs mt-auto">{formatDateToYYYYMMDD(experienceCart.day)}</span></div>
                              </div>
                              <div className="flex flex-col items-end h-full w-[20%] ml-auto">
                                <span onClick={()=>removeExperienceFromBasket(index)} className="h-5 w-5 mb-auto active:scale-95 hover:scale-110 duration-300 transition-all cursor-pointer hover:text-tertiary"><X className="w-full h-full"/></span>
                                <span className="mt-auto">{formatPrice(experienceCart.quantity*experienceCart.price)}</span>
                              </div>
                            </div>
                          )
                        })
                        :
                        <>
                          <p className="text-xs mt-2">No hay experiencas nuevas para agregar</p>
                        </>
                      }
                      </div>

                    </div>
                  </div>
                  <div className="w-full h-[10%] flex justify-end">
                    <Button 
                      onClick={()=>addExperienceToReserveHandler()}
                      isLoading={loadingCreateExperienceInReserve}
                      className="w-auto mt-auto ml-auto"
                      effect="default"
                      size="sm" 
                      variant="ghostLight" 
                      rightIcon={<Plus/>}
                    >{t("reserve.request_adding_experiences")}</Button>
                  </div>
                </div>

                <div className="w-full lg:w-[50%] h-full flex flex-col justify-start items-start overlfow-hidden border-2 border-slate-200 rounded-md p-2">
                  <div className="w-full h-full flex flex-col justify-start items-start overlfow-y-scroll">
                    <span className="flex flex-row items-end gap-x-2 mb-4">
                      <FlameKindling className="h-5 w-5"/>
                      <h2 className="text-lg">{t("reserve.experiences")}</h2>
                    </span>
                    <div className="w-full h-auto flex flex-col gap-y-3 overflow-y-scroll pr-2">
                      {experiencesDB.map((experienceItem,index)=>{
                        return(
                          <ExperienceCard variant="line"  key={`experience__extra_${index}`} index={index} experience={experienceItem} handleAddExperience={handleAddExperienceToBasket}  rangeDates={getRangeDatesForReserve(reserve)} />
                        )
                      })}
                    </div>
                  </div>
                </div>

              </motion.div>
            </>

          )}

          {stateAdd == "add_product" && openDetails === "products" && (
            <>
              <div className="w-full h-[10%] flex flex-row justify-end items-center mt-2">
                <Button 
                  onClick={()=>setStateAdd(undefined)}
                  className="w-auto"
                  effect="default"
                  size="sm" 
                  variant="ghostLight" 
                  rightIcon={<Pizza/>}
                >{t("reserve.my_products")}</Button>
              </div>
              <motion.div 
                initial="hidden"
                animate="show"
                exit="hidden"
                variants={fadeIn("up","",0.5,0.5)}
                className="w-full h-[90%] flex flex-col lg:flex-row py-4 gap-y-4 lg:gap-x-2 pb-12">
                <div className="w-full lg:w-[50%] h-full flex flex-col justify-start items-start overlfow-hidden border-2 border-slate-200 rounded-md p-2">
                  <div className="w-full h-[90%] overflow-hidden p-none m-none">
                    <div className="w-full h-full flex flex-col justify-start items-start mb-2">
                      <span className="flex flex-row items-end gap-x-2">
                        <ShoppingBasket className="h-5 w-5"/>
                        <h2 className="text-lg">{t("reserve.list")}</h2>
                      </span>
                      <div className="w-full h-auto flex flex-col gap-y-3 mt-4 overflow-y-scroll">
                        {products.length > 0 ?
                          products.map((productCart,index)=>{
                          return(
                            <div key={`reserve_product_cart_${index}`} className="flex flex-row w-full h-auto border-2 border-slate-200 rounded-lg shadow-sm p-4">
                              <div className="flex flex-col h-full w-auto">
                                <span className="text-sm mt-auto text-tertiary">{productCart.name}</span>
                                <div className="flex flex-row gap-x-2"><span className="text-xs text-secondary">{t("reserve.quantity")} :</span><span className="text-xs mt-auto">{productCart.quantity}</span></div>
                                <div className="flex flex-row gap-x-2"><span className="text-xs text-secondary">{t("reserve.unit_price")}:</span><span className="text-xs mt-auto">{formatPrice(productCart.price)}</span></div>
                              </div>
                              <div className="flex flex-col items-end h-full w-[20%] ml-auto">
                                <span onClick={()=>removeProductFromBasket(index)} className="h-5 w-5 mb-auto active:scale-95 hover:scale-110 duration-300 transition-all cursor-pointer hover:text-tertiary"><X className="w-full h-full"/></span>
                                <span className="mt-auto">{formatPrice(productCart.quantity*productCart.price)}</span>
                              </div>
                            </div>
                          )
                        })
                        :
                        <>
                          <p className="text-xs mt-2">No hay experiencas nuevas para agregar</p>
                        </>
                      }
                      </div>

                    </div>
                  </div>
                  <div className="w-full h-[10%] flex justify-end">
                    <Button 
                      onClick={()=>addProductToReserveHandler()}
                      isLoading={loadingCreateProductInReserve}
                      className="w-auto mt-auto ml-auto"
                      effect="default"
                      size="sm" 
                      variant="ghostLight" 
                      rightIcon={<Plus/>}
                    >{t("reserve.request_adding_products")}</Button>
                  </div>
                </div>

                <div className="w-full lg:w-[50%] h-full flex flex-col justify-start items-start overlfow-hidden border-2 border-slate-200 rounded-md p-2">
                  <div className="w-full h-full flex flex-col justify-start items-start overlfow-y-scroll">
                    <span className="flex flex-row items-end gap-x-2 mb-4">
                      <FlameKindling className="h-5 w-5"/>
                      <h2 className="text-lg">{t("reserve.products")}</h2>
                    </span>
                    <div className="w-full h-auto flex flex-col gap-y-3 overflow-y-scroll pr-2">
                      {productsDB.map((productItem,index)=>{
                        return(
                          <ProductCard variant="line"  key={`product__extra_${index}`} index={index} product={productItem} handleAddProduct={handleAddProductToBasket} />
                        )
                      })}
                    </div>
                  </div>
                </div>

              </motion.div>
            </>

          )}
            {selectedTent !== undefined && (
              <motion.div 
                key={"tent_"+selectedTent.id}
                initial="hidden"
                animate="show"
                exit="hidden"
                variants={fadeIn("","up",0.5,1)}
                className="flex flex-col w-full h-auto lg:h-[400px] mt-4">
                <div className="h-[70%] w-full flex flex-row pb-4">
                  <div className="h-full w-[50%] lg:w-[75%] flex flex-col lg:p-2 gap-y-2">
                    <h2 className="text-secondary">{selectedTent.tentDB?.header}</h2>
                    <h1 className="text-tertiary">{selectedTent.tentDB?.title}</h1>
                    <p className="text-primary text-xs">{selectedTent.tentDB?.description}</p>
                    <div className="w-full h-auto flex flex-col lg:flex-row gap-x-6 mt-4">
                      <p className="text-primary text-sm">{t("Check In")}</p>
                      <p className="text-gray-400 text-sm">
                      {formatDate(selectedTent.dateFrom)}
                      </p>
                    </div>
                    <div className="w-full h-auto flex flex-col lg:flex-row gap-x-6 mt-4">
                      <p className="text-primary text-sm">{t("Check Out")}</p>
                      <p className="text-gray-400 text-sm">
                      {formatDate(selectedTent.dateTo)}
                      </p>
                    </div>
                    <div className="w-full h-auto flex flex-col lg:flex-row gap-x-6 mt-auto">
                      <p className="text-primary text-sm">{t("reserve.gross_amount")}</p>
                      <p className="text-gray-400 text-sm">{formatPrice(selectedTent.price)}</p>
                    </div>
                  </div>
                  <div className="h-full w-[50%] lg:w-[25%] flex justify-center items-center overflow-hidden p-2">
                    <img src={`${selectedTent.tentDB?.images[0]}`} alt={selectedTent.name} className="w-full h-auto object-cover"/>
                  </div>
                </div>
                <div className="h-auto lg:h-[30%] w-full px-4 py-2 flex flex-col bg-secondary">
                  <h3 className="text-white mb-4">{t("reserve.services")}</h3>
                  <div className="w-full h-auto flex flex-row flex-wrap gap-4">
                  {selectedTent.tentDB?.services && Object.entries(selectedTent.tentDB.services).map(([service, value]) => {
                      if (value) {

                        return <ServiceItem size="sm" key={service} icon={service} />;
                      }
                      return null;
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          {selectedExperience !== undefined && (
            <motion.div 
              key={"experience_"+selectedExperience.id}
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={fadeIn("","up",0.5,1)}
              className="flex flex-col w-full h-auto lg:h-[400px] mt-4">
              {!selectedExperience.confirmed && (
                <div className="w-full h-auto flex flex-row justify-between">
                  <span className="text-[10px] bg-red-100 text-red-400 w-[50%] rounded-lg px-4 py-1 mb-2 flex flex-row gap-x-2 items-center">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-300"></span>
                    </span>
                    {t("reserve.pending_experience")}
                  </span>
                  <Button isLoading={loadingConfirmation} onClick={()=>HandlerConfirmEntity("EXPERIENCE",reserve.id,selectedExperience.id)} rightIcon={<CheckIcon/>} size="sm" isRound={true} effect={"default"} variant="ghostLight">
                    {t("reserve.confirm")}
                  </Button>
                </div>
              )}
              <div className="h-[80%] w-full flex flex-row">
                <div className="h-full w-[50%] lg:w-[75%] flex flex-col pb-4 px-4">
                  <h1 className="text-tertiary">{selectedExperience.experienceDB?.name}</h1>
                  <p className="hidden sm:block text-primary text-xs">{selectedExperience.experienceDB?.description}</p>
                  <div className="w-full h-auto flex flex-col lg:flex-row mt-2">
                    <div className="w-[100%] lg:w-[50%] h-full flex flex-col">
                      <div className="w-full h-auto flex flex-col lg:flex-row gap-x-6 mt-4">
                        <p className="text-primary text-xs">{t("reserve.day")}:</p>
                        <p className="text-gray-400 text-sm">
                          {formatDateToYYYYMMDD(selectedExperience.day)}
                        </p>
                      </div>
                      <div className="w-full h-auto flex flex-col lg:flex-row gap-x-6 mt-4">
                        <p className="text-primary text-xs">{t("experience.duration")}:</p>
                        <p className="text-gray-400 text-sm">
                          { `${selectedExperience.experienceDB?.duration} min.`  }
                        </p>
                      </div>
                      <div className="w-full h-auto flex flex-col gap-x-6 mt-4">
                        <p className="text-primary text-xs">{t("experience.qty_people")}:</p>

                        <div className="w-auto h-auto flex flex-col lg:flex-row items-start gap-x-2">
                          <User className="text-primary h-4 w-4"/>
                          <p className="text-gray-400 text-sm">{selectedExperience.experienceDB?.qtypeople}</p>
                        </div>
                      </div>
                      <div className="w-full h-auto flex flex-col gap-x-6 mt-4">
                        <p className="text-primary text-xs">{t("experience.limit_age")}:</p>
                        <p className="text-gray-400 text-sm">{selectedExperience.experienceDB?.limit_age}{" "}{t("Years")}</p>
                      </div>
                    </div>
                    <div className="hidden w-[50%] h-full lg:flex flex-col border border-2 border-gray-200 rounded-lg px-4 m-2">
                      <div className="w-full h-auto flex flex-row gap-x-6 mt-4">
                        <p className="text-primary text-sm">{t("common.price")}</p>
                        <p className="text-gray-400 text-sm ml-auto">{formatPrice(selectedExperience.price)}</p>
                      </div>
                      <div className="w-full h-auto flex flex-row gap-x-6 mt-4">
                        <p className="text-primary text-sm">{t("reserve.quantity")}</p>
                        <p className="text-gray-400 text-sm ml-auto">{ selectedExperience.quantity }</p>
                      </div>
                      <div className="w-full h-auto flex flex-row gap-x-6 mt-auto border-t-2 border-secondary p-2">
                        <p className="text-primary text-sm">{t("common.gross_amount")}:</p>
                          <p className="text-gray-400 text-sm ml-auto">
                            {formatPrice(selectedExperience.price * selectedExperience.quantity)}
                          </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-full w-[50%] lg:w-[25%] flex max-lg:flex-col justify-center items-center overflow-hidden p-2">
                  <img src={`${selectedExperience.experienceDB?.images[0]}`} alt={selectedExperience.name} className="w-auto h-full object-cover"/>
                    <div className="flex w-[100%] h-full lg:hidden flex-col border border-2 border-gray-200 rounded-lg px-4 my-2">
                      <div className="w-full h-auto flex flex-row gap-x-4 mt-4">
                        <p className="text-primary text-xs">{t("common.price")}</p>
                        <p className="text-gray-400 text-sm ml-auto">{formatPrice(selectedExperience.price)}</p>
                      </div>
                      <div className="w-full h-auto flex flex-row gap-x-4 mt-4">
                        <p className="text-primary text-xs">{t("reserve.quantity")}</p>
                        <p className="text-gray-400 text-sm ml-auto">{ selectedExperience.quantity }</p>
                      </div>
                      <div className="w-full h-auto flex flex-row gap-x-4 mt-auto border-t-2 border-secondary py-4">
                        <p className="text-primary text-xs">{t("common.gross_amount")}:</p>
                          <p className="text-gray-400 text-sm ml-auto">
                            {formatPrice(selectedExperience.price * selectedExperience.quantity)}
                          </p>
                      </div>
                    </div>
                </div>
              </div>
              <div className="h-[20%] w-full px-4 py-2 flex flex-col bg-secondary">
                <h3 className="text-white mb-1 text-md">{t("experience.suggestions")}</h3>
                <div className="w-full h-full flex flex-col lg:flex-row lg:flex-wrap gap-y-2 gap-x-4">
                  {selectedExperience.experienceDB?.suggestions.map((suggestion, index) => (
                    <p key={index} className="text-white text-xs"> * {suggestion}</p>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </Modal>
    </>
  );
};


const DashboardReserves = () => {

    const {t,i18n} = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [datasetReserves,setDataSetReserves] = useState<{reserves:Reserve[],totalPages:Number,currentPage:Number}>({reserves:[],totalPages:1,currentPage:1});
    const [datasetReserveCalendar,setDataSetReservesCalendar] = useState<{ reserves: { id:number, external_id:string, dateFrom:Date, dateTo:Date }[] }>({reserves:[]})

    const [dataNotifications,setDataNotifications] = useState<{notifications:NotificationDto[], totalPages:Number, currentPage:Number}>({notifications:[],totalPages:1, currentPage:1})
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [pageSize, setPageSize] = useState<{ reserves:number, notifcations:number }| null>(null); // Start with `null` to ensure no data is fetched until pageSize is set.

    useEffect(() => {
        const width = window.innerWidth;
        if (width < 640) {
          setPageSize({reserves: 2, notifcations:5 });
        } else if (width < 1536) {
          setPageSize({reserves:2 , notifcations: 2});
        } else {
          setPageSize({reserves:4, notifcations:2});
        }
        getMyReservesCalendarHandler(0);
    }, []); // This only sets `pageSize`.

    useEffect(() => {
        if (pageSize !== null) {  // Ensure data fetching happens only after `pageSize` is set.
            getAllData();
        }
    }, [pageSize]); // Triggers only once after pageSize is set.

    const getAllData = useCallback(() => {
        getMyReservesHandler(1);
        getMyNotifications(1);
    }, [pageSize]); // `pageSize` is correctly passed to ensure data fetching with the right page size.

    const getMyReservesHandler = useCallback(async (page: Number) => {
        if (user != null) {
            const reserves = await getAllMyReserves(user.token, page, pageSize?.reserves as number, i18n.language);
            if (reserves) {
                setDataSetReserves(reserves);
            }
        }
    }, [pageSize]);


    const getMyReservesCalendarHandler = async (page:Number) => {
        if(user != null){
            const reservesCalendar  = await getAllMyReservesCalendar(user.token,page,i18n.language);
            if(reservesCalendar){
                setDataSetReservesCalendar(reservesCalendar);
            }
        }
    }

    const getMyNotifications = async (page:Number) => {
        if(user != null){
            const notifications  = await getAllNotifications(user.token,page,pageSize?.notifcations as number,i18n.language);
            if(notifications){
                setDataNotifications(notifications);
            }
        }
    }

    const handleNextMonth = () => {
        // Calculate the target month and year based on the page
        const targetDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
        setCurrentDate(targetDate);
      }

    const handlePreviousMonth = () => {
        const targetDate = new Date(currentDate.setMonth(currentDate.getMonth() - 1));
        setCurrentDate(targetDate);
    }

    useEffect(()=>{
      const today = new Date();
      const currentMonth = currentDate.getMonth() - today.getMonth();
      getMyReservesCalendarHandler(currentMonth);

    },[currentDate])

    const calendarDays = Calendar(currentDate, datasetReserveCalendar.reserves.map((reserve) => ({ reserveID:reserve.id , external_id:reserve.external_id , checkin: reserve.dateFrom, checkout: reserve.dateTo })));

  const goToRoute = (route:string) => {
    navigate(route);
  };

    return (
    <Dashboard>
      <motion.div 
        initial="hidden"
        animate="show"
        exit="hidden"
        variants={fadeIn("up","",0,0.5)}
        className="bg-white 
        h-auto 2xl:h-[90%]  
        w-full
        flex flex-col xl:flex-row 
        justify-start items-start gap-y-4 xl:gap-4 xl:pb-4">

        <div className="w-full xl:w-[50%] h-full flex flex-col xl:gap-y-4">
          <div className="bg-white px-2 py-4 xl:p-4 rounded-lg shadow-lg border-2 border-gray-200 w-full h-auto xl:h-auto flex flex-col">
              <h1 className="text-sm sm:text-lg flex flex-row gap-x-2 text-secondary max-sm:mt-2"><CalendarCheck/>{t("reserve.calendar")}</h1>
              <p className="font-secondary text-sm sm:text-md max-sm:mt-2 text-tertiary">{t("reserve.view_reserves_month")}</p>
              <div className="w-full h-auto flex flex-row gap-x-2 my-4 sm:my-2">
                <span className="h-4 sm:h-6 w-4 sm:w-6 bg-tertiary rounded-md"></span>
                <p className="font-primary text-tertiary text-sm">{t("reserve.reserves")}</p>
                <span className="h-4 sm:h-6 w-4 sm:w-6 bg-white rounded-md border-2 border-slate-400"></span>
                <p className="font-primary text-slate-400 text-sm">{t("reserve.today")}</p>
              </div>
              <AnimatePresence>
                  <motion.div 
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  variants={fadeOnly("",0,0.5)}
                  className="h-auto w-full w-full bg-white duration-800 transition-all transition-opacity rounded-b-xl">
                    <div className="flex flex-row justify-between items-center mb-4 px-4">
                      <button className="text-sm sm:text-md text-white hover:text-primary duration-300 bg-secondary rounded-full px-4 py-1 active:scale-95 hover:bg-white hover:text-secondary border-2 border-white hover:border-secondary" onClick={handlePreviousMonth}>{t("common.previous")}</button>
                      <h1 className="text-sm sm:text-md text-white duration-300 bg-secondary rounded-full px-4 py-1  border-2 border-white">{currentDate.getMonth()+1 +"/"+ currentDate.getFullYear()}</h1>
                      <button className="text-sm sm:text-md text-white hover:text-primary duration-300 bg-secondary rounded-full px-4 py-1 active:scale-95 hover:bg-white hover:text-secondary border-2 border-white hover:border-secondary" onClick={handleNextMonth}>{t("common.next")}</button>
                    </div>
                    <div className="grid grid-cols-7 gap-2 p-2">
                      {calendarDays}
                    </div>
                  </motion.div>
              </AnimatePresence>
          </div>
          <div className="bg-white px-2 py-4 sm:p-4 rounded-lg shadow-lg border-2 border-gray-200 w-full h-auto xl:h-full hidden xl:flex flex-col">
              <h1 className="text-lg flex flex-row gap-x-2 text-secondary"><CalendarCheck/>{t("reserve.news")}</h1>
              <p className="font-secondary text-md text-tertiary">{t("reserve.latest_notifications")}</p>
              <div className="w-full h-full overflow-hidden">
                {dataNotifications.notifications.length === 0 ?
                  <div className="w-full h-[400px] sm:h-full flex flex-col items-center justify-center bg-white gap-y-4">
                    <img src={NO_NOTIFICATIONS} alt="tent" className="w-[40%] sm:w-[100px] h-auto object-cover"/>
                        <h3 
                          className={`text-secondary text-center`}>
                              {`${t("reserve.no_notifications")}`}
                        </h3>
                  </div>
                :
                  <div className="w-full h-full xl:h-36 flex flex-col overflow-y-scroll gap-y-4 mt-4 pr-2">
                      {dataNotifications.notifications.map((notification, index) => (
                        <NotificationCard key={index} notification={notification}/>
                      ))}
                  </div>
                }
              </div>
              <div className="flex flex-row justify-between w-full mt-auto">
                  <Button onClick={ () => getMyNotifications( Number(dataNotifications.currentPage) - 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={dataNotifications.currentPage == 1}> <ChevronLeft/>  </Button>
                  <Button onClick={ () => getMyNotifications( Number(dataNotifications.currentPage) + 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={dataNotifications.currentPage >= dataNotifications.totalPages}> <ChevronRight/> </Button>
              </div>
          </div>
        </div>


        <div className="bg-white px-2 py-4  xl:p-4 rounded-lg shadow-lg border-2 border-gray-200 w-full xl:w-[50%] h-auto xl:h-full flex flex-col ">
          <h1 className="text-sm sm:text-lg flex flex-row gap-x-2 text-secondary max-sm:mt-2"><TentIcon/>{t("reserve.reserves")}</h1>
          <p className="font-secondary text-tertiary text-sm sm:text-md max-sm:mt-2">{t("reserve.view_reserves_month")}</p>

          <div className="w-full h-[80%] flex flex-col overflow-y-scroll xl:pr-4 gap-y-4 mt-4">
              {datasetReserves.reserves.length === 0 ?
                <div className="w-full h-[400px] sm:h-full flex flex-col items-center justify-center bg-white gap-y-4">
                  <img src={NO_RESERVATIONS} alt="tent" className="w-[40%] sm:w-[30%] h-auto object-cover ml-6"/>
                      <h3 
                        className={`text-secondary text-center`}>
                            {`${t("reserve.no_tents_reservations")}`}
                      </h3>
                      <Button
                        onClick={()=>goToRoute("/reserves")}
                        effect="default"
                        variant="ghostLight" 
                        size="lg" 
                        className="group h-10"
                        isRound={true}
                        rightIcon={<Plus/>}
                      >{t("reserve.add_to_reserve")}</Button>
                </div>
              :
                datasetReserves.reserves.map((reserve, index) => (
                  <ReserveCard key={index} reserve={reserve} fetchReserves={getMyReservesHandler} currentPage={datasetReserves.currentPage}/>
                ))
            }
            </div>
          <div className="flex flex-row justify-between w-full mt-auto max-xl:mt-4">
                <Button onClick={ () => getMyReservesHandler( Number(datasetReserves.currentPage) - 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={datasetReserves.currentPage == 1}> <ChevronLeft/>  </Button>
                <Button onClick={ () => getMyReservesHandler( Number(datasetReserves.currentPage) + 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={datasetReserves.currentPage >= datasetReserves.totalPages}> <ChevronRight/> </Button>
            </div>
        </div>

        <div className="bg-white px-2 py-4 xl:p-4 rounded-lg shadow-lg border-2 border-gray-200 xl:hidden w-full h-auto flex flex-col ">
          <h1 className="text-sm sm:text-lg flex flex-row gap-x-2 text-secondary max-sm:mt-2"><CalendarCheck/>{t("reserve.news")}</h1>
          <p className="font-secondary text-sm sm:text-md text-tertiary">{t("reserve.latest_notifications")}</p>
          <div className="w-full h-full overflow-hidden">
            <div className="w-full h-auto xl:h-full flex flex-col overflow-y-scroll gap-y-4 mt-4">

                {dataNotifications.notifications.length === 0 ?
                  <div className="w-full h-auto flex flex-col items-center justify-center bg-white gap-y-4 py-12">
                    <img src={NO_NOTIFICATIONS} alt="tent" className="w-[150px] sm:w-[200px] h-auto object-cover"/>
                        <h3 
                          className={`text-secondary text-center`}>
                              {`${t("reserve.no_notifications")}`}
                        </h3>
                  </div>
                :
                dataNotifications.notifications.map((notification, index) => (
                  <NotificationCard key={index} notification={notification}/>
                ))
              }
            </div>
          </div>
          <div className="flex flex-row justify-between w-full mt-auto max-xl:mt-4">
                <Button onClick={ () => getMyNotifications( Number(dataNotifications.currentPage) - 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={dataNotifications.currentPage == 1}> <ChevronLeft/>  </Button>
                <Button onClick={ () => getMyNotifications( Number(dataNotifications.currentPage) + 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={dataNotifications.currentPage >= dataNotifications.totalPages}> <ChevronRight/> </Button>
            </div>
        </div>


      </motion.div>
    </Dashboard>
    )
}

export default DashboardReserves;
