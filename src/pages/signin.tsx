import { useState } from "react";
import Button from "../components/ui/Button";
import { LOGO_PRIMARY } from "../assets/images";
import { useForm } from "react-hook-form"
import { signInSchema } from "../db/schemas.ts"
import { motion } from "framer-motion";
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { fadeIn } from "../lib/motions";
import { useNavigate } from "react-router-dom";
import {  Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { SignInAccount } from "../db/actions.ts";
import { toast } from "sonner";

const SignIn = () => {

  const { login } = useAuth();
  const navigate = useNavigate();

  const [loadingForm, setLoadingForm] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  type FormValues = z.infer<typeof signInSchema>;
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: FormValues) => {
    setLoadingForm(true);
    const user = await SignInAccount(data);
    if(user !== null){
      login(user)
    }else{
      toast.error("No se ha podido iniciar sesion")
    }
    setLoadingForm(false);
    goToRoute("/");
  };

  const goToRoute = (route:string) => {
    navigate(route);
  };

  return (
    <div className="w-full h-screen bg-cover bg-center bg-white">
      <div className="w-full h-full flex justify-center items-center">
        <form className="w-[300px] sm:w-[400px] h-auto flex flex-col justify-center items-center rounded-3xl shadow-3xl p-6 border-2" onSubmit={handleSubmit(onSubmit)}>
          <img onClick={()=>goToRoute("/")} src={LOGO_PRIMARY} alt="logo" className="w-auto h-20 cursor-pointer hover:scale-105"/>
          <p className="text-secondary text-sm my-2">{"Admin Panel"}</p>
          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
            <label htmlFor="email" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Correo Electronico"}</label>
            <input {...register("email")} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Correo Electronico"}/>
            <div className="w-full h-6">
              {errors?.email && 
                <motion.p 
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  variants={fadeIn("up","", 0, 1)}
                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">{errors.email.message ? errors.email.message : "Correo es requerido."}
                </motion.p>
              }
            </div>
          </div>

          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
            <label htmlFor="password" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Contraseña"}</label>
            <div className="h-auto w-full relative">
              <input {...register("password")} type={showPassword ? "text" : "password"} className="relative w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Contraseña"}/>
              <div onClick={()=>setShowPassword(!showPassword)} className="absolute top-0 right-2 h-full w-8 flex justify-center items-center cursor-pointer z-50">{ showPassword ? <EyeOff/> : <Eye />} </div>
            </div>
            <div className="w-full h-6">
              {errors?.password && 
                <motion.p 
                  initial="hidden"
                  animate="show"
                  exit="hidden"
                  variants={fadeIn("up","", 0, 1)}
                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">{errors.password.message ? errors.password.message : "Contraseña es requerida."}
                </motion.p>
              }
            </div>
          </div>
          <Button variant="dark" className="mb-4" isRound={true} isLoading={loadingForm}>{"Ingresar"}</Button>
        </form>
      </div>
    </div>
  );
};

export default SignIn;
