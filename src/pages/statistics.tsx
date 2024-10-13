import {AnimatePresence} from "framer-motion"
import Dashboard from "../components/ui/Dashboard"
import {fadeIn, fadeOnly} from "../lib/motions";
import { motion } from "framer-motion";
import {BarChart, BarChartHorizontal, ChevronDownIcon, ChevronUpIcon, LineChart} from "lucide-react";
import {useTranslation} from "react-i18next";
import {useCallback, useEffect, useState} from "react";
import {useAuth} from "../contexts/AuthContext";
import {getNetSalesStatistics, getReserveQuantityStatistics} from "../db/actions/statistics";
import {generateNetSalesBarChart, generateReservesQuantities} from "../lib/charts";

interface propsDropDown {
  currentStatus:{ key:string, field:string, value:string };
  options:{value:string, label:string}[];
  handleChangeOption:(key: string, field: string, value: string) => void;
}

const DropDownComponent = (props:propsDropDown) => {
  const {t} = useTranslation();
  const {currentStatus, options, handleChangeOption} = props;
  const [show,setShow] = useState<boolean>(false);

  const toggleShow = () => {
    setShow(!show);
  };

  const onClickOption = useCallback((value:string) => {
    handleChangeOption(currentStatus.key, currentStatus.field,value)
  },[currentStatus,handleChangeOption]);

  return(
    <div className="w-auto px-4 h-auto py-1 bg-secondary relative flex items-center justify-center text-white rounded-xl border-2 hover:border-white hover:bg-primary cursor-pointer active:scale-95 duration-300" onClick={toggleShow}>
      <label className="inline-flex gap-x-2 cursor-pointer">{currentStatus.value} {show ?  <ChevronUpIcon/> : <ChevronDownIcon/> }</label>
      {show && 
        <motion.div 
          initial="hidden"
          animate="show"
          exit="hidden"
          variants={fadeIn("up","",0,0.5)}
          className="absolute top-full w-auto h-auto flex flex-col mt-2">
          {options.map((option,index)=> {
            return(
              <span onClick={()=>onClickOption(option.value)}  key={`option_${currentStatus.key}_${currentStatus.field}_${index}`} className={`w-auto px-4 py-1 bg-primary inline-flex items-center justify-center hover:bg-secondary duration-300 ${ index == 0 ? "rounded-t-xl " : "" } ${index == options.length -1 ? "rounded-b-xl" : "" }`}>{t(option.label)}</span>
            )
          })}
        </motion.div>
      }
    </div>
  );
}

const DashboardAdminStatistics = () => {

  const {t,i18n} = useTranslation();
  const {user} = useAuth();

  const [loadingState, setLoadingState] = useState({
    net_amount: false,
    reserves: false,
  });

  // Updating a specific loading state
  const updateLoadingState = (key: string, value: boolean) => {
    setLoadingState(prevState => ({
      ...prevState,
      [key]: value,
    }));
  };

  const [selectedOptions, setSelectedOptions ] = useState({
    net_amount:{
      step:"W",
      type:"P"
    },
    reserves:{
      step:"W",
      type:"P"
    }
  })


  const updateSelectedOption = (key: string, field: string, value: string) => {
    setSelectedOptions((prevState:any) => ({
      ...prevState,
      [key]: {
        ...prevState[key],  // Make a copy of the current object at prevState[key]
        [field]: value      // Update the specific field within that object
      }
    }));
  };

  const getNetSalesStatisticsHandler = async() => {
    updateLoadingState('net_amount', true);

    if(user != null){
        const netSales  = await getNetSalesStatistics(user.token,selectedOptions.net_amount, i18n.language);
        if(netSales != null){
          await generateNetSalesBarChart(t("statistic.net_amount_chart_header"),netSales);
        }
    }
    updateLoadingState('net_amount', false);
  }

  const getReserveQuantityStatisticsHandler = async() => {
    updateLoadingState('reserves', true);

    if(user != null){
        const reservesQuantities  = await getReserveQuantityStatistics(user.token,selectedOptions.reserves, i18n.language);
        if(reservesQuantities != null){
          await generateReservesQuantities(t("statistic.reserves_chart_header"),reservesQuantities);
        }
    }
    updateLoadingState('reserves', false);
  }


  useEffect(()=>{
    getNetSalesStatisticsHandler();
  },[selectedOptions.net_amount])

  useEffect(()=>{
    getReserveQuantityStatisticsHandler();
  },[selectedOptions.reserves])


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
          <div className="bg-white px-2 py-4 xl:p-4 rounded-lg shadow-lg border-2 border-gray-200 w-full h-full xl:h-auto flex flex-col">
              <h1 className="text-sm sm:text-lg flex flex-row gap-x-2 text-secondary max-sm:mt-2"><LineChart/>{t("statistic.net_amount")}</h1>
              <p className="font-secondary text-sm sm:text-md max-sm:mt-2 text-tertiary">{t("statistic.select_time")}</p>
              <div className="w-full h-auto flex flex-row gap-x-2 my-4 sm:my-2">
                <DropDownComponent currentStatus={{key:"net_amount",field:"step", value:selectedOptions.net_amount.step }} options={[{value:"W",label:"statistic.weekly"}, {value:"M",label:"statistic.monthly"} , {value:"Y",label:"statistic.yearly"} ]} handleChangeOption={updateSelectedOption}/>

                <DropDownComponent currentStatus={{key:"net_amount",field:"type", value:selectedOptions.net_amount.type }} options={[{value:"A",label:"statistic.acumulative"}, {value:"P",label:"statistic.period"} ]} handleChangeOption={updateSelectedOption}/>
              </div>
              <AnimatePresence>
                  <motion.div 
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  variants={fadeOnly("",0,0.5)}
                  className="h-auto w-full w-full bg-white duration-800 transition-all transition-opacity rounded-b-xl">
                    <canvas id="statistics_net_amount">
                    </canvas>
                  </motion.div>
              </AnimatePresence>
          </div>
          <div className="bg-white px-2 py-4 xl:p-4 rounded-lg shadow-lg border-2 border-gray-200 w-full h-full xl:h-auto flex flex-col">
              <h1 className="text-sm sm:text-lg flex flex-row gap-x-2 text-secondary max-sm:mt-2"><BarChart/>{t("statistic.reserves")}</h1>
              <p className="font-secondary text-sm sm:text-md max-sm:mt-2 text-tertiary">{t("statistic.select_time")}</p>
              <div className="w-full h-auto flex flex-row gap-x-2 my-4 sm:my-2">
                <DropDownComponent currentStatus={{key:"reserves",field:"step", value:selectedOptions.net_amount.step }} options={[{value:"W",label:"statistic.weekly"}, {value:"M",label:"statistic.monthly"} , {value:"Y",label:"statistic.yearly"} ]} handleChangeOption={updateSelectedOption}/>

                <DropDownComponent currentStatus={{key:"reserves",field:"type", value:selectedOptions.net_amount.type }} options={[{value:"A",label:"statistic.acumulative"}, {value:"P",label:"statistic.period"} ]} handleChangeOption={updateSelectedOption}/>
              </div>
              <AnimatePresence>
                  <motion.div 
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  variants={fadeOnly("",0,0.5)}
                  className="h-auto w-full w-full bg-white duration-800 transition-all transition-opacity rounded-b-xl">
                    <canvas id="statistics_reserves_quantities">
                    </canvas>
                  </motion.div>
              </AnimatePresence>
          </div>
        </div>

        <div className="w-full xl:w-[50%] h-full flex flex-col xl:gap-y-4">
          <div className="bg-white px-2 py-4 xl:p-4 rounded-lg shadow-lg border-2 border-gray-200 w-full h-1/2 xl:h-auto flex flex-col">
              <h1 className="text-sm sm:text-lg flex flex-row gap-x-2 text-secondary max-sm:mt-2"><BarChartHorizontal/>{t("reserve.calendar")}</h1>
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

                  </motion.div>
              </AnimatePresence>
          </div>
          <div className="bg-white px-2 py-4 xl:p-4 rounded-lg shadow-lg border-2 border-gray-200 w-full h-1/2 xl:h-auto flex flex-col">
              <h1 className="text-sm sm:text-lg flex flex-row gap-x-2 text-secondary max-sm:mt-2"><BarChartHorizontal/>{t("reserve.calendar")}</h1>
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

                  </motion.div>
              </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </Dashboard>
  )
};

export default DashboardAdminStatistics;


