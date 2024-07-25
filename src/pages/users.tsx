import Dashboard from "../components/ui/Dashboard";
import { useState, useEffect } from "react";
import { Eye, Pen, X, ChevronLeft, ChevronRight, UserPlus, EyeOff, CircleX } from "lucide-react";
import Button from "../components/ui/Button";
import { formatFullName } from "../lib/utils";
import { getAllUsers, createUser, deleteUser } from "../db/actions";
import { useAuth } from "../contexts/AuthContext";
import { User } from "../lib/interfaces";
import { AnimatePresence, motion } from "framer-motion";
import {fadeIn} from "../lib/motions";
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm } from "react-hook-form"
import { createUserSchema } from "../db/schemas";
import Modal from "../components/Modal";


const DashboardAdminUsers = () => {

    const { user } = useAuth();
    const [users,setUsers] = useState<User[]>([])
    const [currentView,setCurrentView] = useState<string>("L");

    const [loadingForm, setLoadingForm] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);

    type CreateFormValues = z.infer<typeof createUserSchema>;
    const { register, handleSubmit, formState: { errors } } = useForm<CreateFormValues>({
    resolver: zodResolver(createUserSchema),
    });

    const onSubmitCreation = async (data: CreateFormValues) => {
        setLoadingForm(true);
        if(user !== null){
            await createUser(data, user.token);
        }
        getUsersHandler();
        setLoadingForm(false);
        setCurrentView("L")
    };

    useEffect(()=>{
        getUsersHandler();
    },[user])

    const getUsersHandler = async () => {
        if(user != null){
            const users  = await getAllUsers(user);
            if(users){
                setUsers(users);
            }
        }
    }

    const [openDeleteModal, setOpenDeleteModal] = useState<Number|null>(null);

    const deleteUserHandler = async(idUser:number|null) => {
        if(user != null && idUser != null){
            await deleteUser(idUser,user.token)
        }
        getUsersHandler();
        setOpenDeleteModal(null);
    }

    return (
    <Dashboard>
        <AnimatePresence>

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
                    <h2 className="text-secondary text-2xl">Usuarios</h2>
                    <div className="w-full h-auto flex flex-row justify-between items-center gap-x-4">
                        <div className="w-auto h-auto flex flex-row justify-start items-start gap-y-4 gap-x-4">
                            <input type="text" placeholder="Buscar usuario" className="w-96 h-8 text-xs font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary"/>
                            <Button size="sm" variant="ghostLight" effect="default" >Buscar</Button>
                        </div>
                        <div className="w-auto h-auto flex flex-row justify-end items-start gap-y-4">
                            <Button onClick={()=>setCurrentView("A")} size="sm" variant="dark" effect="default">Agregar Usuario <UserPlus/></Button>
                        </div>

                    </div>
                    <table className="h-full w-full shadow-xl rounded-xl text-center p-4">
                        <thead className="font-primary text-md bg-primary text-white">
                            <tr className="">
                                <th className="rounded-tl-xl p-2">#</th>
                                <th className="p-2">Nombre</th>
                                <th className="p-2">Correo</th>
                                <th className="p-2">Rol</th>
                                <th className="rounded-tr-xl p-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="font-secondary text-sm">
                                {users.map((userItem,index)=>{
                                    return(
                                    <tr key={"user_key"+index} className="hover:bg-secondary hover:text-white duration-300 cursor-pointer"> 
                                        <td className="">{userItem.id}</td>
                                        <td className="">{formatFullName(userItem.firstName, userItem.lastName)}</td>
                                        <td className="">{userItem.email}</td>
                                        <td className="">{userItem.role}</td>
                                        <td className="flex flex-row flex-wrap gap-x-2">
                                            <button className="border rounded-md hover:bg-primary hover:text-white duration-300 active:scale-75 p-1"><Eye className="h-5 w-5"/></button>
                                            <button className="border rounded-md hover:bg-primary hover:text-white duration-300 active:scale-75 p-1"><Pen className="h-5 w-5"/></button>
                                            <button onClick={()=>setOpenDeleteModal(userItem.id)} className="border rounded-md hover:bg-red-400 hover:text-white duration-300 active:scale-75 p-1"><X className="h-5 w-5"/></button>
                                        </td>
                                    </tr>
                                    )
                                })}
                        </tbody>
                    </table>
                    <div className="flex flex-row justify-between w-full">
                        <Button size="sm" variant="dark" effect="default" isRound={true}> <ChevronLeft/>  </Button>
                        <Button size="sm" variant="dark" effect="default" isRound={true}> <ChevronRight/> </Button>
                    </div>
                </motion.div>

                <Modal isOpen={openDeleteModal != null ? true : false} onClose={()=>setOpenDeleteModal(null)}>
                    <div className="w-full h-auto flex flex-col items-center justify-center text-secondary pb-6 px-6 pt-12">
                      <CircleX className="h-[60px] w-[60px] text-red-400"/>
                        <p className="text-primary">Estas seguro de eliminar este usuario?</p>
                        <p className="text-sm mt-6 text-secondary">El usuario se eliminara si haces click en aceptar</p>
                        <div className="flex flex-row justify-around w-full mt-6">
                            <Button size="sm" variant="dark" effect="default" isRound={true} onClick={()=>setOpenDeleteModal(null)}> Cancelar  </Button>
                            <Button size="sm" variant="danger" effect="default" isRound={true} onClick={()=>{deleteUserHandler(openDeleteModal)}}> Aceptar </Button>
                        </div>
                    </div>
                </Modal>
            </>

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
                    <h2 className="text-secondary text-2xl">Agregar Usuario</h2>

                    <form className="w-full h-auto grid grid-cols-2 gap-6 p-6" onSubmit={handleSubmit(onSubmitCreation)}>
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

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="firstName" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Priomer Nombre"}</label>
                        <input {...register("firstName")} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Primer Nombre"}/>
                        <div className="w-full h-6">
                          {errors?.firstName && 
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">{errors.firstName.message ? errors.firstName.message : "Nombre es requerido."}
                            </motion.p>
                          }
                        </div>
                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="lastName" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Apellido"}</label>
                        <input {...register("lastName")} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Apellido"}/>
                        <div className="w-full h-6">
                          {errors?.lastName && 
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">{errors.lastName.message ? errors.lastName.message : "Apellido es requerido."}
                            </motion.p>
                          }
                        </div>
                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="phoneNumber" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Celular"}</label>
                        <input {...register("phoneNumber")} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Celular"}/>
                        <div className="w-full h-6">
                          {errors?.phoneNumber && 
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">{errors.phoneNumber.message ? errors.phoneNumber.message : "Celular es requerido."}
                            </motion.p>
                          }
                        </div>
                      </div>

                    <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                      <label htmlFor="role" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Rol"}</label>
                      <select {...register("role")} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                        <option value="">Select Role</option>
                        <option value="SUPERVISOR">SUPERVISOR</option>
                        <option value="CLIENT">CLIENT</option>
                      </select>
                      <div className="w-full h-6">
                        {errors?.role && 
                          <motion.p 
                            initial="hidden"
                            animate="show"
                            exit="hidden"
                            variants={fadeIn("up","", 0, 1)}
                            className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {errors.role.message ? errors.role.message : "Role is required."}
                          </motion.p>
                        }
                      </div>
                    </div>

                        <div className="flex flex-row justify-end gap-x-6 w-full col-span-2">
                            <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>Cancelar</Button>
                            <Button type="submit" size="sm" variant="dark" effect="default" isRound={true} isLoading={loadingForm}> Crear Usuario </Button>
                        </div>
                    </form>
                </motion.div>
        )}

        </AnimatePresence>
    </Dashboard>
    )
}

export default DashboardAdminUsers;
