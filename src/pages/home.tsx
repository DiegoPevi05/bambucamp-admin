import { useState,useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn, fadeOnly } from "../lib/motions";
import  Button from "../components/ui/Button";
import { CalendarCheck, DoorClosed, Tent as TentIcon, Pizza,  DoorOpen,Coins,CircleSlash, CreditCard, FlameKindling, Eye, Plus, Info, CircleX, CircleCheck, User, ChevronRight, ChevronLeft  } from "lucide-react"
import { Experience, NotificationIT, Reserve, Tent } from "../lib/interfaces";
import Modal from "../components/Modal";
import Dashboard from "../components/ui/Dashboard";
import { InputRadio } from "../components/ui/Input";
import { getTentsNames, getProductsNames, getExperiencesNames, formatPrice, formatDate } from "../lib/utils";
import ServiceItem from "../components/ServiceItem";
import Calendar from "../components/Calendar";
import {useAuth} from "../contexts/AuthContext";
import {getAllMyReserves, getAllMyReservesCalendar} from "../db/actions/reserves";


interface NotificationCardProps {
  notification: NotificationIT;
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
          { notification.type === "E" && <CircleX className="h-5 w-5 text-tertiary"/>}
          { notification.type === "S" && <CircleCheck className="h-5 w-5 text-tertiary"/>}
          { notification.type === "I" && <Info className="h-5 w-5 text-tertiary"/>}
          <h2 className="group-hover:text-tertiary">{notification.title}</h2>
        </div>
        <p className="text-sm text-secondary group-hover:text-white font-secondary">{notification.preview}</p>
      </motion.div>
      <Modal isOpen={openModal} onClose={()=>setOpenModal(false)}>
        <div className="w-full h-auto flex flex-col items-center justify-center text-secondary p-12">
          { notification.type === "E" && <CircleX className="h-[60px] w-[60px] text-tertiary"/>}
          { notification.type === "S" && <CircleCheck className="h-[60px] w-[60px] text-tertiary"/>}
          { notification.type === "I" && <Info className="h-[60px] w-[60px] text-tertiary"/>}
          <p className="text-primary">{notification.title}</p>
          <p className="text-sm mt-6 text-secondary">{notification.description}</p>
        </div>
      </Modal>
    </>
  )
}



interface ReserveCardProps {
  reserve: Reserve;
};


const ReserveCard = (props:ReserveCardProps) => {
  const { reserve } = props;
  const [openModal,setOpenModal] = useState<boolean>(false); 
  const [openReserve,setOpenReserve] = useState<boolean>(false);
  const [openDetails,setOpenDetails] = useState<string>("tents");
  const [selectedOption,setSelectedOption] = useState<number>(0);
  const [selectedTent,setSelectedTent] = useState<Tent|undefined>(undefined);
  const [selectedExperience,setSelectedExperience] = useState<Experience|undefined>(undefined);

  useEffect(() => {
    if(openDetails == "tents"){
      const tent = reserve.tents.find((_,index) => index === selectedOption);
      if(tent?.tentDB){
        setSelectedTent(tent.tentDB);
      }
    }else{
      setSelectedTent(undefined);
    }

    if(openDetails == "experiences"){
      const experience = reserve.experiences.find((_,index) => index === selectedOption);
      if(experience?.experienceDB){
        setSelectedExperience(experience.experienceDB);
      }
    }else{
      setSelectedExperience(undefined);
    }

  },[openDetails,selectedOption])


  return (
    <>
    <motion.div 
      initial="hidden"
      whileInView="show"
      viewport={{once: true}}
      variants={fadeIn("up","",0,0.5)}
      className="bg-white p-2 rounded-xl shadow-lg border-2 border-gray-200 w-full h-[500px]  gap-x-4 mt-4 grid grid-cols-6 grid-rows-7">
      <div className="col-span-4 2xl:col-span-3 row-span-6 p-4 flex flex-row flex-wrap gap-y-4">
          <div className="w-[50%] h-auto flex flex-col">
            <h2 className="text-sm font-secondary text-primary flex flex-row gap-x-2 items-start"><CircleSlash className="h-5 w-5"/>Identificador:</h2>
            <p className="text-xs font-primary text-slate-400 mt-2">{reserve.id}</p>
          </div>
          <div className="w-[50%] h-auto flex flex-col">
            <h2 className="text-sm font-secondary text-primary flex flex-row gap-x-2 items-start"><CreditCard className="h-5 w-5"/>Reservacion:</h2>
            <p className="text-xs font-primary text-slate-400 mt-2">{reserve.canceled_status}</p>
          </div>
          <div className="w-[50%] h-auto flex flex-col">
            <h2 className="text-sm font-secondary text-primary flex flex-row gap-x-2 items-start"><DoorClosed className="h-5 w-5"/>Desde:</h2>
            <p className="text-xs font-primary text-slate-400 mt-2">{formatDate(reserve.dateFrom)}</p>
          </div>
          <div className="w-[50%] h-auto flex flex-col">
            <h2 className="text-sm font-secondary text-primary flex flex-row gap-x-2 items-start"><DoorOpen className="h-5 w-5"/>Hasta:</h2>
            <p className="text-xs font-primary text-slate-400 mt-2">{formatDate(reserve.dateTo)}</p>
          </div>
          <div className="w-[50%] h-auto flex flex-col">
            <h2 className="text-sm font-secondary text-primary flex flex-row gap-x-2 items-start"><Coins className="h-5 w-5"/>Importe Total:</h2>
            <p className="text-xs font-primary text-slate-400 mt-2">{"S/."}{reserve.grossImport}{".00"}</p>
          </div>
        </div>
      <div className="col-span-2 2xl:col-span-3 row-span-6 p-4 flex flex flex-row flex-wrap border-l-2 border-slate-200">
          <div className="w-full h-auto flex flex-col">
            <h2 className="text-sm font-secondary text-primary flex flex-row gap-x-2 items-start"><TentIcon className="h-5 w-5"/>Glampings:</h2>
            <p className="text-xs font-primary text-slate-400 mt-2">{getTentsNames(reserve)}</p>
          </div>
          <div className="w-full h-auto flex flex-col">
            <h2 className="text-sm font-secondary text-primary flex flex-row gap-x-2 items-start"><Pizza className="h-5 w-5"/>Productos</h2>
            <p className="text-xs font-primary text-slate-400 mt-2">{getProductsNames(reserve)}</p>
          </div>
          <div className="w-full h-auto flex flex-col">
            <h2 className="text-sm font-secondary text-primary flex flex-row gap-x-2 items-start"><FlameKindling className="h-5 w-5"/>Experiencias:</h2>
            <p className="text-xs font-primary text-slate-400 mt-2">{getExperiencesNames(reserve)}</p>
          </div>
        </div>
        <div className="col-span-6 row-span-1 flex flex-row justify-end gap-x-4">
          <Button
            effect="default"
            className="w-auto"
            size="sm"
            variant="light"
            onClick={() => setOpenModal(true)}
            isRound={true}
          >{"Cancelar"}</Button>
          <Button
            effect="default"
            className="w-auto"
            size="sm"
            variant="ghostLight"
            onClick={() => setOpenReserve(true)}
            isRound={true}
          >{"Ver Detalles"} <Eye /></Button>
        </div>
      </motion.div>
      <Modal isOpen={openModal} onClose={()=>setOpenModal(false)}>
        <div className="w-full h-auto flex flex-col items-center justify-center text-secondary p-12">
          <FlameKindling className="h-[120px] w-[120px] text-tertiary"/>
          <h2 className="text-primary">Estas seguro que deseas cancelar esta reservacion?</h2>
          <p className="text-sm mt-6 text-primary">Envianos un correo</p>
          <a href="mailto:diego10azul@hotmail.com" className="text-xs cursor-pointer hover:underline">services@bambucamp.com.pe</a>
          <p className="text-sm mt-6 text-primary">O ponte en contacto en nuestros canales</p>
          <p className="text-xs">{"+51 399 857 857 - +51 230 456 234"}</p>
        </div>
      </Modal>

      <Modal isOpen={openReserve} onClose={()=>setOpenReserve(false)}>
        <div className="w-[800px] h-[600px] flex flex-col items-start justify-start text-secondary p-6 overflow-hidden">
            <div className="w-full h-auto flex flex-row gap-x-6 pb-4 border-b-2 border-secondary">
              <InputRadio  
                className="w-auto" 
                onClick={()=>{setOpenDetails("tents") ; setSelectedOption(0)}} 
                name="category" 
                placeholder={"Glampings"} 
                rightIcon={<TentIcon/>} 
                checked={openDetails === "tents"}
                readOnly
              />
              <InputRadio  
                className="w-auto" 
                onClick={()=>{setOpenDetails("products"); setSelectedOption(0)}} 
                name="category" 
                placeholder={"Productos"} 
                rightIcon={<Pizza/>}
                checked={openDetails === "products"}
                readOnly
              />
              <InputRadio  
                className="w-auto" 
                onClick={()=>{setOpenDetails("experiences"); setSelectedOption(0)}} 
                name="category" 
                placeholder={"Experiencias"} 
                rightIcon={<FlameKindling/>}
                checked={openDetails === "experiences"}
                readOnly
              />
            </div>
            <div className="w-full h-auto">
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
                      <p className="text-secondary text-sm">{"No hay glampings disponsibles"}</p>
                    </div>
                    }
                  </motion.div>
              )}

              {openDetails === "products" && (
                <motion.div 
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  variants={fadeIn("left","",0.5,0.5)}
                  className="w-full flex flex-col gap-y-6 py-4">
                  {reserve.products.length > 0 ? (
                    <>
                      {reserve.products.map((product, index) => (
                        <div key={"product"+index} className="flex flex-row w-full border border-2 border-gray-200 p-2 rounded-lg">
                          <div className="w-48 h-24 bg-gray-200 rounded-lg">
                            <img src={`${import.meta.env.VITE_BACKEND_URL}/${product?.productDB?.images[0]}`} alt={product?.productDB?.name} className="w-full h-full object-cover"/>
                          </div>
                          <div className="w-full h-auto flex flex-col gap-y-2 px-4">
                            <p className="text-primary text-sm">{product?.productDB?.name}</p>
                            <p className="text-secondary text-xs">{product?.productDB?.description}</p>
                            <p className="text-primary text-sm mt-auto">{formatPrice(product.price)}</p>
                          </div>
                          <div className="w-24 h-auto flex flex-col justify-center items-center">
                            <p className="text-primary text-sm">Cantidad</p>
                            <p className="text-primary text-sm">{product.quantity}</p>
                            <p className="text-primary text-sm mt-auto">{formatPrice(product.quantity ? product.price*product.quantity : 0 )}</p>
                          </div>
                        </div>
                      ))}
                      <div className="w-full h-auto flex flex-row justify-between  border-t-2 border-secondary mt-auto p-4">
                        <p className="text-primary text-sm">Importe Total</p>
                        <p className="text-primary text-sm">{formatPrice(reserve.products.reduce((acc,product) => acc + product.price*product?.quantity,0))}</p>
                      </div>
                    </>
                  )
                  : 
                    <div className="w-full h-[200px] flex justify-center items-center flex-col">
                      <Pizza className="h-12 w-12"/>
                      <p className="text-secondary text-sm">No hay productos disponibles</p>
                    </div>
                  }
                </motion.div>
              )}

              {openDetails === "experiences" && (
                <motion.div 
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  variants={fadeIn("left","",0.5,0.5)}
                  className="w-full flex flex-row gap-x-6 py-4 items-center justify-start">
                  {
                  reserve.experiences.length > 0 ? (
                    <>
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
                              readOnly
                            />
                        ))
                      }
                    </>
                  )
                  :
                    <div className="w-full h-[200px] flex justify-center items-center flex-col">
                      <FlameKindling className="h-12 w-12"/>
                      <p className="text-secondary text-sm">No hay experiencias disponibles</p>
                    </div>
                  }
                </motion.div>
              )}
            </div>
            {selectedTent !== undefined && (
              <motion.div 
                key={"tent_"+selectedTent.id}
                initial="hidden"
                animate="show"
                exit="hidden"
                variants={fadeIn("","up",0.5,1)}
                className="flex flex-col w-full h-[400px] mt-4">
                <div className="h-[70%] w-full flex flex-row">
                  <div className="h-full w-[75%] flex flex-col p-4">
                    <h2 className="text-secondary">{selectedTent.header}</h2>
                    <h1 className="text-tertiary">{selectedTent.title}</h1>
                    <p className="text-primary text-sm">{selectedTent.description}</p>
                    <div className="w-full h-auto flex flex-row gap-x-6 mt-4">
                      <p className="text-primary text-sm">Desde</p>
                      <p className="text-gray-400 text-sm">{formatDate(reserve.dateFrom)}</p>
                    </div>
                    <div className="w-full h-auto flex flex-row gap-x-6 mt-4">
                      <p className="text-primary text-sm">Hasta</p>
                      <p className="text-gray-400 text-sm">{formatDate(reserve.dateTo)}</p>
                    </div>
                    <div className="w-full h-auto flex flex-row gap-x-6 mt-auto">
                      <p className="text-primary text-sm">Importe Total</p>
                      <p className="text-gray-400 text-sm">{formatPrice(selectedTent.price)}</p>
                    </div>
                  </div>
                  <div className="h-full w-[25%] flex justify-center items-center overflow-hidden p-2">
                    <img src={`${import.meta.env.VITE_BACKEND_URL}/${selectedTent.images[0]}`} alt={selectedTent.title} className="w-full h-auto object-cover"/>
                  </div>
                </div>
                <div className="h-[30%] w-full px-4 py-2 flex flex-col bg-secondary">
                  <h3 className="text-white mb-4">Servicios</h3>
                  <div className="w-full h-auto flex flex-row flex-wrap gap-4">
                  {Object.entries(selectedTent.services).map(([service, value]) => {
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
              className="flex flex-col w-full h-[400px] mt-4">
              <div className="h-[80%] w-full flex flex-row">
                <div className="h-full w-[75%] flex flex-col p-4">
                  <h1 className="text-tertiary">{selectedExperience.name}</h1>
                  <p className="text-primary text-sm">{selectedExperience.description}</p>
                  <div className="w-full h-auto flex flex-row">
                    <div className="w-[50%] h-full flex flex-col">
                      <div className="w-full h-auto flex flex-row gap-x-6 mt-4">
                        <p className="text-primary text-sm">Dia y Hora:</p>
                        <p className="text-gray-400 text-sm">{ selectedExperience.duration}</p>
                      </div>
                      <div className="w-full h-auto flex flex-row gap-x-6 mt-4">
                        <p className="text-primary text-sm">Cantidad de Personas:</p>

                        <div className="w-auto h-auto flex flex-row items-start gap-x-2">
                          <User className="text-primary h-4 w-4"/>
                          <p className="text-gray-400 text-sm">{selectedExperience.qtypeople}</p>
                        </div>
                      </div>
                      <div className="w-full h-auto flex flex-row gap-x-6 mt-4">
                        <p className="text-primary text-sm">Limite de Edad</p>
                        <p className="text-gray-400 text-sm">{selectedExperience.limit_age} Años</p>
                      </div>
                    </div>
                    <div className="w-[50%] h-full flex flex-col border border-2 border-gray-200 rounded-lg px-4 my-2">
                      <div className="w-full h-auto flex flex-row gap-x-6 mt-4">
                        <p className="text-primary text-sm">Precio</p>
                        <p className="text-gray-400 text-sm">{formatPrice(selectedExperience.price)}</p>
                      </div>
                      <div className="w-full h-auto flex flex-row gap-x-6 mt-4">
                        <p className="text-primary text-sm">Cantidad</p>
                        <p className="text-gray-400 text-sm">{selectedExperience.qtypeople}</p>
                      </div>
                      <div className="w-full h-auto flex flex-row gap-x-6 mt-auto border-t-2 border-secondary p-2">
                        <p className="text-primary text-sm">Importe Total:</p>
                        <p className="text-gray-400 text-sm">{formatPrice( selectedExperience.qtypeople ? selectedExperience.price * selectedExperience.qtypeople : 0)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-full w-[25%] flex justify-center items-center overflow-hidden p-2">
                  <img src={`${import.meta.env.VITE_BACKEND_URL}/${selectedExperience.images[0]}`} alt={selectedExperience.name} className="w-auto h-full object-cover"/>
                </div>
              </div>
              <div className="h-[20%] w-full px-4 py-2 flex flex-col bg-secondary">
                <h3 className="text-white mb-1 text-md">Recomendaciones</h3>
                <div className="w-full h-full flex flex-row flex-wrap gap-y-2 gap-x-4">
                  {selectedExperience.suggestions.map((suggestion, index) => (
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

    const { user } = useAuth();

    const [datasetReserves,setDataSetReserves] = useState<{reserves:Reserve[],totalPages:Number,currentPage:Number}>({reserves:[],totalPages:1,currentPage:1});
    const [datasetReserveCalendar,setDataSetReservesCalendar] = useState<{ reserves: { id:number, dateFrom:Date, dateTo:Date }[] }>({reserves:[]})
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [currentView,setCurrentView] = useState<string>("LOADING");


    useEffect(()=>{
        getMyReservesHandler(1);
        getMyReservesCalendarHandler(0);
    },[]);

    const getMyReservesHandler = async (page:Number) => {
        setCurrentView("LOADING");
        if(user != null){
            const reserves  = await getAllMyReserves(user.token,page);
            if(reserves){
                setDataSetReserves(reserves);
                setCurrentView("H");
            }
        }
    }

    const getMyReservesCalendarHandler = async (page:Number) => {
        if(user != null){
            const reservesCalendar  = await getAllMyReservesCalendar(user.token,page);
            if(reservesCalendar){
                setDataSetReservesCalendar(reservesCalendar);
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

    const calendarDays = Calendar(currentDate, datasetReserveCalendar.reserves.map((reserve) => ({ reserveID:reserve.id , checkin: reserve.dateFrom, checkout: reserve.dateTo })));

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

        {currentView == "H" && (
          <>
            <motion.div 
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={fadeIn("up","",0.5,0.3)}
              className="bg-white row-span-7 grid grid-cols-2 grid-rows-3 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-gray-200 col-span-1 row-span-2">
                  <h1 className="text-lg flex flex-row gap-x-2 text-secondary"><CalendarCheck/>{"Calendar"}</h1>
                  <p className="font-secondary text-md text-tertiary">{"Mira tus reservas por mes"}</p>
                  <div className="w-full h-auto flex flex-row gap-x-2 my-2">
                    <span className="h-6 w-6 bg-tertiary rounded-md"></span>
                    <p className="font-primary text-tertiary text-sm">{"Reservas"}</p>
                    <span className="h-6 w-6 bg-white rounded-md border-2 border-slate-400"></span>
                    <p className="font-primary text-slate-400 text-sm">{"Hoy"}</p>
                  </div>
                  <AnimatePresence>
                      <motion.div 
                      initial="hidden"
                      animate="show"
                      exit="hidden"
                      variants={fadeOnly("",0,0.5)}
                      className="h-auto w-full w-full bg-white duration-800 transition-all transition-opacity rounded-b-xl">
                        <div className="flex flex-row justify-between items-center mb-4 px-4">
                          <button className="text-secondary hover:text-primary duration-300" onClick={handlePreviousMonth}>{"Anterior"}</button>
                          <h1 className="text-secondary">{currentDate.getMonth()+1 +"/"+ currentDate.getFullYear()}</h1>
                          <button className="text-secondary hover:text-primary duration-300" onClick={handleNextMonth}>{"Siguiente"}</button>
                        </div>
                        <div className="grid grid-cols-7 gap-2 p-2">
                          {calendarDays}
                        </div>
                      </motion.div>
                  </AnimatePresence>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-gray-200 col-span-1 row-span-3 flex flex-col">
                  <h1 className="text-lg flex flex-row gap-x-2 text-secondary"><TentIcon/>Reservas</h1>
                  <p className="font-secondary text-tertiary text-md">{"Mira tus reservas aqui"}</p>

                  <div className="w-full h-[80%] flex flex-col overflow-y-scroll">
                    {datasetReserves.reserves.map((reserve, index) => (
                      <ReserveCard key={index} reserve={reserve}/>
                    ))}
                  </div>
                  <div className="flex flex-row justify-between w-full mt-auto">
                      <Button onClick={ () => getMyReservesHandler( Number(datasetReserves.currentPage) - 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={datasetReserves.currentPage == 1}> <ChevronLeft/>  </Button>
                      <Button onClick={ () => getMyReservesHandler( Number(datasetReserves.currentPage) + 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={datasetReserves.currentPage >= datasetReserves.totalPages}> <ChevronRight/> </Button>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-gray-200 col-span-1 row-span-1">
                  <h1 className="text-lg flex flex-row gap-x-2 text-secondary"><CalendarCheck/>Noticias</h1>
                  <p className="font-secondary text-md text-tertiary">{"Aqui estan las ultimas notificaciones"}</p>
                  <div className="w-full h-[60%] flex flex-col overflow-y-scroll gap-y-4 mt-4">
                    {/*
                      {notificationsData.map((notification, index) => (
                        <NotificationCard key={index} notification={notification}/>
                      ))}
                    */}
                  </div>
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


    </Dashboard>
    )
}

export default DashboardReserves;
