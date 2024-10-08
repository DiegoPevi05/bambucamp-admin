import React, {useState} from "react";
import Button from "./Button";
import { ISOLOGO } from "../../assets/images";
import {  AnimatePresence } from "framer-motion";
import { CalendarCheck, User, MessageSquare, DoorClosed, Pizza, FlameKindling, Percent, Disc, Tent, AlignJustify, Quote, Home   } from "lucide-react"
import {useAuth} from "../../contexts/AuthContext";
import DropDownListAccount from "../DropDownListAccount";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import LanguageDropDownList from "../LanguageSelector";



const DashboardButtons: DashboardButtonDataProps[] = [
  {
    "title": "Dashboard",
    "icon": <Home />,
    "section": ""
  },
  {
    "title": "reserve.reserves",
    "icon": <CalendarCheck />,
    "section": "reserves"
  },
  {
    "title": "user.plural",
    "icon": <User />,
    "section": "users"
  },
  {
    "title": "glamping.plural",
    "icon": <Tent />,
    "section": "tents"
  },
  {
    "title": "product.plural",
    "icon": <Pizza />,
    "section": "products"
  },
  {
    "title": "experience.plural",
    "icon": <FlameKindling />,
    "section": "experiences"
  },
  {
    "title":"discount.plural",
    "icon": <Percent />,
    "section": "discounts"
  },
  {
    "title": "promotion.plural",
    "icon": <Disc />,
    "section": "promotions"
  },
  {
    "title": "faq.plural",
    "icon": <Quote />,
    "section": "questions"
  },
  {
    "title": "review.plural",
    "icon": <MessageSquare />,
    "section": "reviews"
  },
];

interface DashboardButtonDataProps{
  title:string;
  icon:React.ReactNode;
  section:string;
}

interface DashboardButtonProps {
  title: string;
  icon: React.ReactNode;
  onClick: () => void;
}


const DashboardButton = ({ title, icon, onClick }: DashboardButtonProps) => {

  return (
    <Button
      className="w-full"
      size="sm"
      variant="ghostLight"
      effect={"default"}
      isRound={true}
      onClick={onClick}
    >
      {icon}
      <span>{title}</span>
    </Button>
  );
};


const Dashboard = ({children}:{children:React.ReactNode}) => {
  const { user, logout } = useAuth();
  const {t} = useTranslation();
  const navigate = useNavigate();

  const [openNavbar,setOpenNavbar] = useState<boolean>(false);

  const goToSubRoute = (route:string) => {
    navigate(`/${route}`);
  };

  return (
    <div className="bg-white w-full h-auto xl:h-screen">
      <div className="flex flex-col xl:flex-row gap-4 sm:px-4 2xl:p-4 h-auto h-full w-full">
        <div className={`${openNavbar ? "max-2xl:left-[0px]" : "max-sm:-left-[100%] max-2xl:left-[-400px]"} bg-white p-4 2xl:rounded-lg 2xl:shadow-lg 2xl:border-2 border-gray-200 max-2xl:fixed  max-2xl:h-screen max-sm:w-screen max-2xl:w-[400px] 2xl:h-full 2xl:w-[15%] flex flex-col items-start gap-y-4 duration-300 max-2xl:z-[100]`}>
          <div className="w-full h-auto flex flex-row justify-between items-center">
            <button className="2xl:hidden h-12 w-12 flex items-center justify-center text-secondary rounded-xl active:scale-95 active:bg-white active:text-secondary active:border active:border-secondary" onClick={()=>setOpenNavbar((prev)=> !prev)} ><AlignJustify className=""/></button>
            <LanguageDropDownList variant="dark"/>
          </div>
          <a href="/" className="hover:cursor-pointer hover:scale-[1.05] transition-all duration-300 rounded-full bg-white w-[80px] sm:w-[125px] h-[80px] sm:h-[125px] flex items-center justify-center  mx-auto">
            <img src={ISOLOGO} alt="logo" className="w-[40px] sm:w-[80px] h-[40px] sm:h-[80px]"/>
          </a>

          {DashboardButtons.map((button, index) => (
            <DashboardButton
              key={index}
              title={t(button.title)}
              icon={button.icon}
              onClick={()=>goToSubRoute(button.section)}
            />
          ))}
          <Button
            className="w-full mt-auto"
            variant="ghostLight"
            effect={"default"}
            isRound={true}
            onClick={logout}
          >
            {<DoorClosed/>}
            <span>{t("auth.log_out")}</span>
          </Button>
        </div>
        <div 
          className="
          w-full 2xl:w-[85%] h-full
          flex flex-col
          bg-white 
          gap-4 
          max-2xl:py-4
          px-2
          2xl:px-4">
          <div 
            className="
            w-full h-20 2xl:h-[10%]
            bg-white 
            sm:p-4 
            rounded-lg 
            shadow-lg 
            border-2 
            border-gray-200 
            flex 
            flex-row 
            justify-between 
            items-center">
            <div className="flex flex-row items-center justify-center gap-x-4 max-sm:ml-4">
              <button className="2xl:hidden h-full w-12 flex items-center justify-center text-secondary rounded-xl active:scale-95 active:bg-white active:text-secondary active:border active:border-secondary" onClick={()=>setOpenNavbar((prev)=> !prev)} ><AlignJustify className=""/></button>
              <div className="flex gap-x-4 items-start flex-col">
                <h1 className="text-sm sm:text-lg text-secondary">{t("common.welcome")} {user?.firstName}{" "}{user?.lastName}</h1>
                <p className="font-secondary text-[10px] sm:text-[14px] text-tertiary">{t("common.subheader")}<a href="https://www.bambucamp.com.pe" target="_blank" className="hover:underline">www.bambucamp.com.pe</a></p>
              </div>
            </div>
            <DropDownListAccount user={user} variant="dark"/>
          </div>
          <AnimatePresence>
            {children}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

