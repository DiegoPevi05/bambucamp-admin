import Dashboard from "../components/ui/Dashboard";
import { useState, useEffect } from "react";
import { Eye, Pen, X, ChevronLeft, ChevronRight, UserPlus, EyeOff, CircleX, UserX, UserRoundCheck, User as UserIcon, MailCheck, UserPen } from "lucide-react";
import Button from "../components/ui/Button";
import { InputRadio } from "../components/ui/Input";
import { formatFullName, formatDate } from "../lib/utils";
import { getAllUsers, createUser, deleteUser,disableUser, enableUser, updateUser } from "../db/actions/users";
import { useAuth } from "../contexts/AuthContext";
import { User, UserFilters } from "../lib/interfaces";
import { AnimatePresence, motion } from "framer-motion";
import {fadeIn} from "../lib/motions";
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm } from "react-hook-form"
import { createUserSchema, editUserSchema } from "../db/schemas";
import Modal from "../components/Modal";


const DashboardAdminUsers = () => {

    const { user } = useAuth();
    const [datasetUsers,setDataSetUsers] = useState<{users:User[],totalPages:Number,currentPage:Number}>({users:[],totalPages:1,currentPage:1})
    const [currentView,setCurrentView] = useState<string>("LOADING");

    useEffect(()=>{
        getUsersHandler(1);
    },[])

    const getUsersHandler = async (page:Number, filters?:UserFilters) => {
        setCurrentView("LOADING");
        if(user != null){
            const users  = await getAllUsers(user.token,page,filters);
            if(users){
                setDataSetUsers(users);
                setCurrentView("L");
            }
        }
    }

    const [loadingForm, setLoadingForm] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);

    // Define types based on the schemas
    type CreateUserFormValues = z.infer<typeof createUserSchema>;
    type EditUserFormValues = z.infer<typeof editUserSchema>;

    type UserFormValues = CreateUserFormValues | EditUserFormValues;

    const schema = currentView == "E" ? editUserSchema : createUserSchema;

    const { register, handleSubmit, formState: { errors }, reset } = useForm<UserFormValues>({
        resolver: zodResolver(schema),
    });

    const onSubmitCreation = async (data: CreateUserFormValues) => {
        setLoadingForm(true);
        if(user !== null){
            await createUser(data, user.token);
            reset();
        }
        getUsersHandler(1);
        setLoadingForm(false);
        setCurrentView("L")
    };

    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);

    const [selectedUser, setSelectedUser] = useState<User|null>(null);

    const searchUserHandler = async() => {
        // Get the input value
        const searchValue = (document.querySelector('input[name="criteria_search_value"]') as HTMLInputElement).value.trim();

        // Get the selected criteria from radio buttons
        const selectedCriteria = (
        document.querySelector('input[name="criteria_search"]:checked') as HTMLInputElement
        )?.value;

        // Get the selected role from the select dropdown
        const selectedRole = (document.querySelector('select[name="criteria_search_role"]') as HTMLSelectElement).value;

        // Construct filters based on input values and selected criteria
        const filters: UserFilters = {};
        if (selectedCriteria && searchValue) {
            filters[selectedCriteria as keyof UserFilters] = searchValue;
        }
        if (selectedRole) {
            filters.role = selectedRole;
        }

        getUsersHandler(1,filters);
    }

    const deleteUserHandler = async() => {
        if(user != null && selectedUser != null){
            await deleteUser(selectedUser.id,user.token)
        }
        getUsersHandler(1);
        setOpenDeleteModal(false);
    }

    const disabledUserHandler = async( userId:Number ) => {
        if(user != null){
            await disableUser(userId,user.token);
        }
        getUsersHandler(1);
    }
    const enabledUserHandler = async(userId:Number) => {
        if(user != null){
            await enableUser(userId,user.token);
        }
        getUsersHandler(1);
    }

    const onSubmitUpdate = async (data: EditUserFormValues) => {
        setLoadingForm(true);
        if(user !== null && selectedUser != null){
            await updateUser(selectedUser.id,data, user.token);
            reset();
        }
        getUsersHandler(1);
        setLoadingForm(false);
        setCurrentView("L")
    };

    useEffect(() => {
        if (selectedUser) {
            reset({
                firstName: selectedUser.firstName,
                lastName: selectedUser.lastName,
                email: selectedUser.email,
                phoneNumber: selectedUser.phoneNumber,
                role: selectedUser.role,
                password: ''
            });
        }
    }, [selectedUser, reset]);


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
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><UserIcon/>Usuarios</h2>
                    <div className="w-full h-auto flex flex-row justify-between items-center gap-x-4">
                        <div className="w-auto h-auto flex flex-col md:flex-row justify-start items-start gap-y-4 gap-x-4">
                          <div className="flex flex-col md:flex-row items-start md:items-center gap-x-2">
                            <input 
                              type="text" 
                              name="criteria_search_value"
                              placeholder="Buscar usuario" 
                              className="w-96 h-8 text-xs font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-primary"
                            />
                            <InputRadio name="criteria_search" variant="dark" value="firstname" placeholder="Nombre"/>
                            <InputRadio name="criteria_search" variant="dark" value="lastname" placeholder="Apellido" />
                            <InputRadio name="criteria_search" variant="dark" value="email" placeholder="Correo" />
                          </div>
                          <div className="flex flex-col md:flex-row items-start md:items-center gap-x-2">
                            <label className="md:ml-4 flex items-center">
                              Rol
                              <select name="criteria_search_role" className="ml-2 h-8 text-xs font-tertiary border-b-2 border-secondary focus:outline-none focus:border-b-primary">
                                <option value="">Seleccionar Rol</option>
                                <option value="ADMIN">ADMIN</option>
                                <option value="SUPERVISOR">SUPERVISOR</option>
                                <option value="CLIENT">CLIENT</option>
                              </select>
                            </label>
                              <Button size="sm" variant="dark" effect="default" className="md:ml-4 mt-4 md:mt-0" onClick={()=>searchUserHandler()}>
                              Buscar
                            </Button>
                          </div>
                        </div>
                        <div className="w-auto h-auto flex flex-row justify-end items-start gap-y-4">
                            <Button onClick={()=>setCurrentView("A")} size="sm" variant="dark" effect="default" isRound={true}>Agregar Usuario <UserPlus/></Button>
                        </div>

                    </div>
                    <table className="h-full w-full shadow-xl rounded-xl text-center p-4">
                        <thead className="font-primary text-md bg-primary text-white">
                            <tr className="">
                                <th className="rounded-tl-xl p-2">#</th>
                                <th className="p-2">Nombre</th>
                                <th className="p-2">Correo</th>
                                <th className="p-2">Rol</th>
                                <th className="p-2">Telefono</th>
                                <th className="p-2">Estado</th>
                                <th className="p-2">Ultima Conexion</th>
                                <th className="p-2">Creado</th>
                                <th className="p-2">Actualizado</th>
                                <th className="rounded-tr-xl p-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="font-secondary text-sm">
                                {datasetUsers.users.map((userItem,index)=>{
                                    return(
                                    <tr key={"user_key"+index} className="text-slate-400 hover:bg-secondary hover:text-white duration-300 cursor-pointer"> 
                                        <td className="">{userItem.id}</td>
                                        <td className="">{formatFullName(userItem.firstName, userItem.lastName)}</td>
                                        <td className="">{userItem.email}</td>
                                        <td className="">{userItem.role != "SUPERVISOR" ? (userItem.role  != "CLIENT" ? "ADMIN" :"CLIENTE" ) : "SUPERVISOR" }</td>
                                        <td className="">{userItem.phoneNumber != undefined && userItem.phoneNumber != null ? userItem.phoneNumber : "None"}</td>
                                        <td className="">{userItem.isDisabled ? "Inhabilitado" : "Habilitado"}</td>
                                        <td className="">{userItem.lastLogin != undefined && userItem.lastLogin != null ? formatDate(userItem.lastLogin) : "None"}</td>
                                        <td className="">{userItem.updatedAt != undefined && userItem.updatedAt != null ? formatDate(userItem.updatedAt) : "None"}</td>
                                        <td className="">{userItem.createdAt != undefined && userItem.createdAt != null ? formatDate(userItem.createdAt) : "None"}</td>
                                        <td className="flex flex-row flex-wrap gap-x-2">
                                            <button onClick={()=>{setSelectedUser(userItem); setCurrentView("V")}} className="border rounded-md hover:bg-primary hover:text-white duration-300 active:scale-75 p-1"><Eye className="h-5 w-5"/></button>
                                            <button  onClick={()=>{setSelectedUser(userItem); setCurrentView("E")}} className="border rounded-md hover:bg-primary hover:text-white duration-300 active:scale-75 p-1"><Pen className="h-5 w-5"/></button>
                                            <button onClick={()=>{setOpenDeleteModal(true),setSelectedUser(userItem)}} className="border rounded-md hover:bg-red-400 hover:text-white duration-300 active:scale-75 p-1"><X className="h-5 w-5"/></button>
                                            {userItem.isDisabled ?
                                            <button onClick={()=>{enabledUserHandler(userItem.id)}} className="border rounded-md hover:bg-primary hover:text-white duration-300 active:scale-75 p-1"><UserRoundCheck className="h-5 w-5"/></button>
                                            :
                                            <button onClick={()=>{disabledUserHandler(userItem.id)}} className="border rounded-md hover:bg-red-400 hover:text-white duration-300 active:scale-75 p-1"><UserX className="h-5 w-5"/></button>

                                            }
                                        </td>
                                    </tr>
                                    )
                                })}
                        </tbody>
                    </table>
                    <div className="flex flex-row justify-between w-full">
                        <Button onClick={ () => getUsersHandler( Number(datasetUsers.currentPage) - 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={datasetUsers.currentPage == 1}> <ChevronLeft/>  </Button>
                        <Button onClick={ () => getUsersHandler( Number(datasetUsers.currentPage) + 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={datasetUsers.currentPage >= datasetUsers.totalPages}> <ChevronRight/> </Button>
                    </div>
                </motion.div>

                <Modal isOpen={openDeleteModal} onClose={()=>setOpenDeleteModal(false)}>
                    <div className="w-full h-auto flex flex-col items-center justify-center text-secondary pb-6 px-6 pt-12">
                      <CircleX className="h-[60px] w-[60px] text-red-400"/>
                        <p className="text-primary">Estas seguro de eliminar este usuario?</p>
                        <p className="text-sm mt-6 text-secondary">El usuario se eliminara si haces click en aceptar</p>
                        <div className="flex flex-row justify-around w-full mt-6">
                            <Button size="sm" variant="dark" effect="default" isRound={true} onClick={()=>setOpenDeleteModal(false)}> Cancelar  </Button>
                            <Button size="sm" variant="danger" effect="default" isRound={true} onClick={()=>{deleteUserHandler()}}> Aceptar </Button>
                        </div>
                    </div>
                </Modal>
            </>

        )}

        {currentView == "V" && selectedUser && (
                <motion.div 
                    key={"User-View"}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    viewport={{ once: true }}
                    variants={fadeIn("up","",0.5,0.3)}
                    className="w-full h-auto flex flex-col justify-start items-start gap-y-4">
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><UserIcon/> Ver Usuario</h2>

                    <div className="w-full h-auto flex flex-col lg:flex-row">
                        <div className="flex flex-col items-start justify-start w-full lg:w-[50%] gap-6 p-6">
                              <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1 gap-x-6">
                                  <div className="flex flex-col justify-start items-start w-[50%] h-auto">
                                    <label htmlFor="isDisabled" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Estado de Usuario"}</label>
                                      <div className={`w-full flex flex-row justify-start items-center h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 gap-x-4 ${ selectedUser?.isDisabled ? "text-tertiary" : "text-primary" }`}> <UserIcon className="h-5 w-5"/> { selectedUser?.isDisabled ? "Inhabilitado" : "Habilitado" }</div>
                                  </div>
                                  <div className="flex flex-col justify-start items-start w-[50%] h-auto">
                                    <label htmlFor="EmailVerified" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Estado de Email"}</label>
                                      <div className={`w-full flex flex-row justify-start items-center h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 gap-x-4 ${ selectedUser?.emailVerified ? "text-primary" : "text-tertiary" }`} > <MailCheck className="h-5 w-5"/> { selectedUser?.emailVerified ? "Verificado" : "No Verificado" }</div>
                                  </div>
                              </div>


                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="email" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Correo Electronico"}</label>
                                <input  name="email" value={selectedUser?.email} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Correo Electronico"} disabled/>
                              </div>

                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="firstName" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Primer Nombre"}</label>
                                <input name="firstName" value={selectedUser?.firstName} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Primer Nombre"} disabled/>
                              </div>

                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="lastName" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Apellido"}</label>
                                <input name="lastName" value={selectedUser?.lastName} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Apellido"} disabled/>
                              </div>

                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="phoneNumber" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Celular"}</label>
                                <input name="phoneNumber" value={selectedUser?.phoneNumber} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Celular"} disabled/>
                              </div>
                                <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                  <label htmlFor="role" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Rol"}</label>
                                  <select name="role" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                                    <option value={selectedUser?.role} selected>{selectedUser?.role != "SUPERVISOR" ? (selectedUser?.role  != "CLIENT" ? "ADMIN" :"CLIENTE" ) : "SUPERVISOR" }</option>
                                  </select>
                                </div>
                        </div>

                        <div className="flex flex-col items-start justify-start w-full lg:w-[50%] gap-6 p-6">
                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="createdAt" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Ultimo Cambio de Contraseña"}</label>
                                  <div className="w-full flex flex-col justify-end items-start h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" >{selectedUser?.lastPasswordChanged ? formatDate(selectedUser?.lastPasswordChanged) : "None"}</div>
                              </div>

                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="createdAt" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Ultimo Inicio de Sesion"}</label>
                                  <div className="w-full flex flex-col justify-end items-start h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" >{selectedUser?.lastLogin ? formatDate(selectedUser?.lastLogin) : "None"}</div>
                              </div>

                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="createdAt" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Creado"}</label>
                                  <div className="w-full flex flex-col justify-end items-start h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" >{selectedUser?.createdAt ? formatDate(selectedUser?.createdAt) : "None"}</div>
                              </div>

                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="updatedAt" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Actualizado"}</label>

                                <div className="w-full flex flex-col justify-end items-start h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" >{selectedUser?.updatedAt ? formatDate(selectedUser?.updatedAt) : "None"}</div>
                              </div>

                            <div className="flex flex-row justify-end gap-x-6 w-full col-span-2">
                                <Button type="button" onClick={()=>{setSelectedUser(null); setCurrentView("L")}} size="sm" variant="dark" effect="default" isRound={true}>Voler a la lista de Usuarios</Button>
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
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><UserPlus/>Agregar Usuario</h2>

                    <form className="w-full h-auto flex flex-col lg:flex-row" onSubmit={handleSubmit(onSubmitCreation)}>
                        <div className="flex flex-col items-start justify-start w-full lg:w-[50%] gap-6 p-6">


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
                                <label htmlFor="firstName" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Primer Nombre"}</label>
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


                        </div>

                        <div className="flex flex-col items-start justify-start w-full lg:w-[50%] gap-6 p-6">


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
                                <option value="">Seleccionar Rol</option>
                                <option value="SUPERVISOR">SUPERVISOR</option>
                                <option value="CLIENT">CLIENTE</option>
                              </select>
                              <div className="w-full h-6">
                                {errors?.role && 
                                  <motion.p 
                                    initial="hidden"
                                    animate="show"
                                    exit="hidden"
                                    variants={fadeIn("up","", 0, 1)}
                                    className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                      {errors.role.message ? errors.role.message : "Rol es requerido."}
                                  </motion.p>
                                }
                              </div>
                            </div>

                            <div className="flex flex-row justify-end gap-x-6 w-full mt-auto">
                                <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>Cancelar</Button>
                                <Button type="submit" size="sm" variant="dark" effect="default" isRound={true} isLoading={loadingForm}> Crear Usuario </Button>
                            </div>

                        </div>



                    </form>
                </motion.div>
        )}

        {currentView === "E" && selectedUser && (
                <motion.div 
                    key={"Edit-View"}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    viewport={{ once: true }}
                    variants={fadeIn("up","",0.5,0.3)}
                    className="w-full h-auto flex flex-col justify-start items-start gap-y-4">
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><UserPen/>Editar Usuario</h2>

                    <form className="w-full h-auto flex flex-col lg:flex-row" onSubmit={handleSubmit(onSubmitUpdate)}>
                        <div className="flex flex-col items-start justify-start w-full lg:w-[50%] gap-6 p-6">

                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="email" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Correo Electronico"}</label>
                                <input {...register("email")} 
                                  className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Correo Electronico"}/>
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
                                  <input {...register("password")} 
                                    defaultValue={selectedUser.password}
                                    type={showPassword ? "text" : "password"}  className="relative w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Contraseña"}/>
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
                                <label htmlFor="firstName" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Primer Nombre"}</label>
                                <input {...register("firstName")} 
                                  className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Primer Nombre"}/>
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

                        </div>

                        <div className="flex flex-col items-start justify-start w-full lg:w-[50%] gap-6 p-6">
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
                                <option value="">Seleccionar Rol</option>
                                <option value="SUPERVISOR">SUPERVISOR</option>
                                <option value="CLIENT">CLIENTE</option>
                              </select>
                              <div className="w-full h-6">
                                {errors?.role && 
                                  <motion.p 
                                    initial="hidden"
                                    animate="show"
                                    exit="hidden"
                                    variants={fadeIn("up","", 0, 1)}
                                    className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                      {errors.role.message ? errors.role.message : "Rol es requerido."}
                                  </motion.p>
                                }
                              </div>
                            </div>
                            <div className="flex flex-row justify-end gap-x-6 w-full mt-auto">
                                <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>Cancelar</Button>
                                <Button type="submit" size="sm" variant="dark" effect="default" isRound={true} isLoading={loadingForm}> Guardar </Button>
                            </div>
                        </div>
                    </form>
                </motion.div>
                )}

        </AnimatePresence>
    </Dashboard>
    )
}

export default DashboardAdminUsers;
