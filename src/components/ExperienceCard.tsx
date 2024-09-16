import {  useState } from "react";
import { Blocks, CalendarPlus, CircleAlert, Clock, User} from "lucide-react";
import {PublicExperience} from "../lib/interfaces";
import { motion } from "framer-motion";
import { fadeIn } from "../lib/motions";
import {formatPrice, parseSuggestions} from "../lib/utils";
import {useTranslation} from "react-i18next";

interface propsItemExperience {
  variant?:string;
  index:number;
  experience:PublicExperience;
  handleAddExperience:(idExperience:number,quantity:number, day:Date) => void;
  rangeDates: {date:Date, label:string}[];
}

const ExperienceCard:React.FC<propsItemExperience> = (props:propsItemExperience) => {
  const {t} = useTranslation();
  const { variant, index, experience, handleAddExperience, rangeDates } = props;
  const [quantity,setQuantity] = useState<number>(1);

  const handleIncrementQuantity = () => {
    setQuantity(prevQuantity => prevQuantity + 1 )
  }

  const handleReduceQuantity = () => {
    setQuantity(prevQuantity => prevQuantity <= 1 ? prevQuantity : prevQuantity - 1 );
  }

  const handleSelectExperience = (idExperience:number) => {
    const indexDay =  Number((document.querySelector(`#experience_day_selector_${idExperience}`) as HTMLInputElement).value)
    const dayObjectSelected  = rangeDates.find((_,i) => i == indexDay); 
    if(dayObjectSelected){
      handleAddExperience(experience.id,quantity, dayObjectSelected.date);
    }

  }

  return(
    <motion.div
      key={`experience-catalog-${experience.id}`}
      initial="hidden"
      animate="show"
      exit="hidden"
      variants={fadeIn(` ${variant == "line" ? "up" : "left"}`,"",0.5*index, 0.5)}
      className={`shrink-0 bg-white ${variant == "line" ? "w-full" : "w-[250px]"} h-auto flex flex-col items-start justify-start border border-slate-200 rounded-lg shadow-md`}>
      <div className={`w-full ${variant == "line" ? "h-[0px]" : "h-[150px]"}  bg-center bg-cover rounded-t-lg`} style={{ backgroundImage: `url(${experience.images[0]})`}}></div>
      <div className="w-full h-auto flex flex-col justify-start items-start py-2 px-4">
        <div className={`w-full h-auto p-none m-none flex ${variant == "line" ? "flex-row" : "flex-col"}`}>
          <div className={`h-auto p-none m-none flex flex-col ${variant == "line" ? "w-[50%]" : "w-full"}`}>
            <h1 className={`${variant=="line" ? "text-sm" :  "text-lg"} text-tertiary`}>{experience.name}</h1>
            <p className={`${variant == "line" ? "hidden" : ""} text-xs text-secondary`}>{experience.description.slice(0,50)+"..."}</p>
            <p className="text-md">{formatPrice((experience.price == experience.custom_price ? experience.price : experience.custom_price ))}</p>
          </div>

          <div className={`${variant == "line" ? "w-[50%]" :"hidden" }  h-[50px] flex flex-row justify-end ps-4 py-2`}>
            <button onClick={()=>handleSelectExperience(experience.id)} className="p-2 bg-secondary text-white rounded-full group hover:bg-white hover:border-2 hover:border-secondary hover:text-secondary h-full w-auto flex items-center justify-center active:scale-95 duration-300 text-xs"><CalendarPlus className="h-full w-full"  /></button>
          </div>
        </div>

        <div className={`w-full h-auto flex ${variant == "line" ? "flex-row" : "flex-col"} `}>
          <div className="w-full h-[50%] flex flex-row">
            <div className="w-[50%] h-[40px] flex flex-row gap-x-2 justify-center items-center text-tertiary">
              <User/>
              {experience.limit_age}
              <CircleAlert className=" cursor-pointer h-4 w-4 flex items-center justify-center bg-slate-300 rounded-full hover:bg-secondary text-white hover:text-primary text-xs" data-tooltip-id="my-tooltip" data-tooltip-content={t("experience.limit_age")}/>
            </div>
            <div className="w-[50%] h-[40px] flex flex-row gap-x-2 justify-center items-center p-2 text-tertiary">
              <Blocks />
              {experience.qtypeople}
              <CircleAlert className=" cursor-pointer h-4 w-4 flex items-center justify-center bg-slate-300 rounded-full hover:bg-secondary text-white hover:text-primary text-xs" data-tooltip-id="my-tooltip" data-tooltip-content={t("experience.qty_people")}/>
            </div>
          </div>
          <div className="w-full h-[50%] flex flex-row">
            <div className="w-[50%] h-[40px] flex flex-row gap-x-2 justify-center items-center text-tertiary">
              <Clock/>
              {experience.duration}
              <CircleAlert className=" cursor-pointer h-4 w-4 flex items-center justify-center bg-slate-300 rounded-full hover:bg-secondary text-white hover:text-primary text-xs" data-tooltip-id="my-tooltip" data-tooltip-content={t("experience.duration_minutes")}/>
            </div>
            <div className="w-[50%] h-[40px] flex flex-row gap-x-2 justify-center items-center p-2 text-tertiary">
              <p className="text-xs text-secondary">{"Sugg."}</p>
              <CircleAlert className=" cursor-pointer h-4 w-4 flex items-center justify-center bg-slate-300 rounded-full hover:bg-secondary text-white hover:text-primary text-xs" data-tooltip-id="my-tooltip" data-tooltip-content={t(parseSuggestions(experience.suggestions))}/>
            </div>
          </div>
        </div>
      </div>

      <div className={`w-full h-auto flex p-none m-none ${variant == "line" ? "flex-row" : "flex-col"}`}>
        <div className={`${variant == "line" ? "w-[50%]":"w-full"} h-auto mt-auto flex flex-col relative rounded-b-lg px-4 gap-y-2 my-2`}>
          <label className="text-xs text-secondary">{t("experience.day")}</label>
          <select id={`experience_day_selector_${experience.id}`} className="w-[80%] mx-auto h-auto text-secondary border-2  rounded-md border-secondary text-sm">
            {rangeDates.map((itemDate,index)=>{
              return(
                <option key={"option_day_selector"+index} value={index}>{itemDate.label}</option>
              )
            })}
          </select>
        </div>
        <div className={`${variant == "line" ? "w-[50%]":"w-full"} h-[50px] mt-auto flex flex-row relative rounded-b-lg`}>
          <span className="w-[30%] h-auto flex items-center justify-center">{quantity}</span>
          <div className="w-[70%] h-auto flex flex-row px-4 py-2 flex items-center gap-x-2">
            <button onClick={()=>handleReduceQuantity()} className="w-full h-8 bg-secondary text-white border-2 border-secondary rounded-md active:scale-95 hover:bg-white hover:text-secondary hover:border-secondary duration-300">-</button>
            <button onClick={()=>handleIncrementQuantity()} className="w-full h-8 bg-secondary text-white border-2 border-secondary rounded-md active:scale-95 hover:bg-white hover:text-secondary hover:border-secondary duration-300">+</button>
          </div>
        </div>
      </div>

      <div className={`${variant == "line" ? "hidden" :"w-full" }  h-[50px] flex flex-row justify-end px-4 py-2`}>
        <button onClick={()=>handleSelectExperience(experience.id)} className="px-2 bg-secondary text-white rounded-full group hover:bg-white hover:border-2 hover:border-secondary hover:text-secondary h-full w-auto flex items-center justify-center active:scale-95 duration-300 text-xs">{t("reserve.add_to_reserve")}</button>
      </div>
    </motion.div>
  )
}

export default ExperienceCard;
