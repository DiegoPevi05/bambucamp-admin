import { useState } from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import CalendarComponent from "./Calendar";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import { fadeIn } from "../lib/motions";
import {getCalendarDates} from "../db/actions/reserves";
import {LoaderCircle} from "lucide-react";

const CalendarModal = ({ show, type, section, handleSelectedDate, containerDimensions }:{show:boolean, type:string, section?:string, handleSelectedDate: (date: Date) => void, containerDimensions: { height: number, width: number, left: number, top:number } }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [topValue,setTopValue] = useState<string>("0");
  const [isSmallScreen,setIsSmallScreen] = useState(false);
  const [notAvailableDates,setNotAvailableDates] = useState<{ date: Date, label: string, available: boolean }[]>([]);
  const [loadingDates,setLoadingDates] = useState(false);

  useEffect(()=>{
    if(show){
      handleGetNotAvailableDates(currentDate);
    }
  },[currentDate,show])

  const handleGetNotAvailableDates = async (currentDate:Date) => {
    setLoadingDates(true);

    const today = new Date();
    
    // Calculate year and month difference
    const yearDiff = currentDate.getFullYear() - today.getFullYear();
    const monthDiff = currentDate.getMonth() - today.getMonth();

    // Calculate the page value (months away from the current month)
    const page = yearDiff * 12 + monthDiff;

    const notAvailableDates = await getCalendarDates(page,"es") 
    if(notAvailableDates != null){
      setNotAvailableDates(notAvailableDates);
    }
    setLoadingDates(false);
  }

  useEffect(() => {

    if(window.innerWidth <= 640){
      setIsSmallScreen(true);
    }

    setTopValue(section === "booking"  ? `-400px`  : `${section != "add_tent" ? containerDimensions.height : (containerDimensions.height + 20)}px`);
  }, [show, currentDate,type]);

  const {t} = useTranslation()

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
  }

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
  }

  const calendarDays = CalendarComponent(currentDate,[],notAvailableDates, handleSelectedDate);

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
        key={"calendar_date_selection_"+type}
        initial="hidden"
        animate="show"
        exit="hidden"
        variants={fadeIn( !isSmallScreen ?  "left" : "up","",0,0.5) }
          className={`absolute h-[380px]  w-screen sm:w-full bg-white duration-800 transition-all transition-opacity rounded-xl ${section == "add_tent" ? "border-2 border-slate-100 shadow-xl":""} 
            z-[2000] ${ type == "date_from" ? "-left-4 sm:left-0" : "-right-4 sm:right-0" } `} 
          style={{ top: topValue }}
        >
          <div className="flex flex-row justify-between items-center mb-4 p-4">
            <button className="text-secondary hover:text-primary duration-300" onClick={handlePreviousMonth}>{t("common.previous")}</button>
            <h1 className="text-slate-700">{currentDate.getMonth()+1 +"/"+ currentDate.getFullYear()}</h1>
            <button className="text-secondary hover:text-primary duration-300" onClick={handleNextMonth}>{t("common.next")}</button>
          </div>
          {!loadingDates ?
            <div className="grid grid-cols-7 gap-2 p-2 ">
              {calendarDays}
            </div>
          :
            <div className="w-full h-auto flex justify-center items-center">
              <LoaderCircle className="h-12 w-12 text-secondary animate-spin" />
            </div>
          }
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CalendarModal;
