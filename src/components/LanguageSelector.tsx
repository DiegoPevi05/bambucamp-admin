
import { ChevronDown, Earth } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { fadeOnly } from '../lib/motions';

interface LanguageDropDownList {
  variant?:string;
}

const LanguageDropDownList = (props:LanguageDropDownList) => {
  const {variant} = props;
  const { i18n } = useTranslation();
  const [open, setOpen] = useState<boolean>(false);

  const changeLanguage = (language: string) => {
    setOpen(false);
    i18n.changeLanguage(language);
  };

  const toogleDropDown = () => {
    setOpen(!open);
  };

  return (
    <div className="relative w-auto h-auto mx-1">
      <div onClick={toogleDropDown} className={`${variant == "dark" ? "text-secondary hover:text-tertiary" : "text-white hover:text-tertiary"}  text-xl flex flex-row gap-x-1 z-50 items-center justify-center cursor-pointer  duration-300`}><Earth className="h-5 w-5"/>{i18n.language}<ChevronDown/></div>
      <AnimatePresence>
        {open && 
          <motion.div 
            initial="hidden"
            animate='show'
            exit="hidden"
            viewport={{ once: true }}
            variants={fadeOnly("",0,0.3)}
            className="absolute top-[40px] w-full h-auto flex flex-col justify-start items-start bg-primary rounded-md divide-y divide-white border-4 border-primary">
            <span onClick={() => changeLanguage("es")} className="w-full h-auto flex flex-row justify-center items-center gap-x-2 hover:bg-white cursor-pointer group rounded-t-md">
              <p className="text-white text-lg group-hover:scale-[1.05]  group-hover:text-tertiary ease-in-out duration-300 transition-all cursor-pointer">{"es"}</p>
            </span>
            <span onClick={() => changeLanguage("en")} className="w-full h-auto flex flex-row justify-center items-center gap-x-2 hover:bg-white cursor-pointer group rounded-b-md">
              <p className="text-white text-lg group-hover:scale-[1.05]  group-hover:text-tertiary ease-in-out duration-300 transition-all cursor-pointer">{"en"}</p>
            </span>
          </motion.div>
        }
      </AnimatePresence>
    </div>
  )
};

export default LanguageDropDownList;
