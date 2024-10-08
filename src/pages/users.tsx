import Dashboard from "../components/ui/Dashboard";
import { useState, useEffect, FormEvent } from "react";
import { Eye, Pen, X, ChevronLeft, ChevronRight, UserPlus, EyeOff, CircleX, UserX, UserRoundCheck, User as UserIcon, MailCheck, UserPen } from "lucide-react";
import Button from "../components/ui/Button";
import { InputRadio } from "../components/ui/Input";
import { formatFullName, formatDate } from "../lib/utils";
import { getAllUsers, createUser, deleteUser,disableUser, enableUser, updateUser } from "../db/actions/users";
import { useAuth } from "../contexts/AuthContext";
import { User, UserFilters, UserFormData } from "../lib/interfaces";
import { AnimatePresence, motion } from "framer-motion";
import {fadeIn} from "../lib/motions";
import { ZodError } from 'zod';
import { createUserSchema, editUserSchema } from "../db/schemas";
import Modal from "../components/Modal";
import {useTranslation} from "react-i18next";


const DashboardAdminUsers = () => {

    const {t,i18n} = useTranslation();
    const { user } = useAuth();
    const [datasetUsers,setDataSetUsers] = useState<{users:User[],totalPages:Number,currentPage:Number}>({users:[],totalPages:1,currentPage:1})
    const [currentView,setCurrentView] = useState<string>("LOADING");

    useEffect(()=>{
        getUsersHandler(1);
    },[])

    const getUsersHandler = async (page:Number, filters?:UserFilters) => {
        setCurrentView("LOADING");
        if(user != null){
            const users  = await getAllUsers(user.token,page,i18n.language,filters);
            if(users){
                setDataSetUsers(users);
                setCurrentView("L");
            }
        }
    }

    const [loadingForm, setLoadingForm] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

    const validateFields = (formname:string): UserFormData |null => {
        const form = document.getElementById(formname) as HTMLFormElement;
        const firstName = (form.querySelector('input[name="firstName"]') as HTMLInputElement).value;
        const lastName = (form.querySelector('input[name="lastName"]') as HTMLTextAreaElement).value;
        const password = (form.querySelector('input[name="password"]') as HTMLInputElement).value;
        const email = (form.querySelector('input[name="email"]') as HTMLInputElement).value;
        const role = (form.querySelector('select[name="role"]') as HTMLInputElement).value;
        const phoneNumber = (form.querySelector('input[name="phoneNumber"]') as HTMLInputElement).value;
        const document_id = (form.querySelector('input[name="document_id"]') as HTMLInputElement).value;
        const document_type = (form.querySelector('select[name="document_type"]') as HTMLInputElement).value;
        const nationality = (form.querySelector('input[name="nationality"]') as HTMLInputElement).value;

        setErrorMessages({});

        try {

          if(formname == "form_create_user"){
            createUserSchema.parse({ firstName, password, email, role });

            return {
                firstName,
                lastName,
                password,
                email,
                role,
                phoneNumber,
                document_id,
                document_type,
                nationality
            };

          }else{
              // For editing, omit password if it is empty
              const userData:UserFormData = { firstName, lastName, email, role, phoneNumber, document_id, document_type, nationality };

              if (password) {
                userData.password = password;
              }

              editUserSchema.parse(userData); // This will validate only the fields present in `userData`

              return userData;
          }

        } catch (error) {
          if (error instanceof ZodError) {
            const newErrorMessages: Record<string, string> = {};
            error.errors.forEach(err => {
              const fieldName = err.path[0] as string;
              newErrorMessages[fieldName] = err.message;
            });
            setErrorMessages(newErrorMessages);
          }
          return null;
        }
    };


    const onSubmitCreation = async (e:FormEvent ) => {
        e.preventDefault();
        setLoadingForm(true);
        const fieldsValidated = validateFields('form_create_user');
        if(fieldsValidated != null){
            if(user !== null){
                const isSuccess = await createUser(fieldsValidated, user.token, i18n.language);
                if(!isSuccess){
                    setLoadingForm(false);
                    return;
                }
            }
            getUsersHandler(1);
            setCurrentView("L")
        }
        setLoadingForm(false);
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

    const onChangeSelectedUser = (e: React.ChangeEvent<HTMLInputElement  | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const fieldValue = value;

        setSelectedUser(prevSelectedUser => {
            if(!prevSelectedUser) return null;
            return {
                ...prevSelectedUser,
                [name]: fieldValue,
            };
        });
    };

    const deleteUserHandler = async() => {
        if(user != null && selectedUser != null){
            const isSuccess = await deleteUser(selectedUser.id,user.token, i18n.language)
            if(!isSuccess){
                return;
            }
        }
        getUsersHandler(1);
        setOpenDeleteModal(false);
    }

    const disabledUserHandler = async( userId:Number ) => {
        if(user != null){
            const isSuccess = await disableUser(userId,user.token, i18n.language);
            if(!isSuccess){
                return;
            }
        }
        getUsersHandler(1);
    }
    const enabledUserHandler = async(userId:Number) => {
        if(user != null){
            const isSuccess = await enableUser(userId,user.token, i18n.language);
            if(!isSuccess){
                return;
            }
        }
        getUsersHandler(1);
    }

    const onSubmitUpdate = async (e: FormEvent) => {
        e.preventDefault()
        setLoadingForm(true);
        const fieldsValidated = validateFields('form_update_user');
        if(fieldsValidated != null){
            if(user !== null && selectedUser != null){
                const isSuccess = await updateUser(selectedUser.id,fieldsValidated, user.token, i18n.language);
                if(!isSuccess){
                    setLoadingForm(false);
                    return;
                }
            }
        }
        getUsersHandler(1);
        setLoadingForm(false);
        setCurrentView("L")
    };


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
                  <h1 className="font-primary text-secondary mt-4">{t("common.language")}</h1>
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
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><UserIcon/>{t("user.plural")}</h2>
                    <div className="w-full h-auto flex flex-col xl:flex-row justify-between items-center gap-x-4">
                        <div className="w-full xl:w-auto h-auto flex flex-col xl:flex-row justify-start items-start gap-y-4 gap-x-4">
                            <div className="max-xl:w-full flex flex-col md:flex-row items-start md:items-center gap-x-2">
                            <input 
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  searchUserHandler();
                                }
                              }}
                              type="text" 
                              name="criteria_search_value"
                              placeholder={t("user.search_user")} 
                                className="w-[50%] xl:w-96 h-8 text-xs font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-primary"
                            />
                            <InputRadio name="criteria_search" variant="light" isRound={true} value="firstname" placeholder={t("user.firstname")} defaultChecked/>
                            <InputRadio name="criteria_search" variant="light" isRound={true} value="lastname" placeholder={t("user.lastname")} />
                            <InputRadio name="criteria_search" variant="light" isRound={true} value="email" placeholder={t("user.email")} />
                          </div>
                            <div className="max-xl:w-full flex flex-col md:flex-row items-start md:items-center gap-x-2">
                            <label className="max-xl:w-[50%] md:ml-4 flex items-center">
                                {t("user.rol")}
                                <select name="criteria_search_role" className="max-xl:w-full ml-2 h-8 text-xs font-tertiary border-b-2 border-secondary focus:outline-none focus:border-b-primary">
                                <option value="">{t("user.select_rol")}</option>
                                <option value="ADMIN">{t("user.ADMIN")}</option>
                                <option value="SUPERVISOR">{t("user.SUPERVISOR")}</option>
                                <option value="CLIENT">{t("user.CLIENT")}</option>
                              </select>
                            </label>
                              <Button  variant="ghostLight" isRound={true} effect="default" className="md:ml-4 mt-4 md:mt-0" onClick={()=>searchUserHandler()}>
                                {t("common.search")}
                            </Button>
                          </div>
                        </div>
                        <div className="w-full xl:w-auto h-auto flex flex-row justify-end items-start gap-y-4 max-xl:mt-4">
                            <Button onClick={()=>setCurrentView("A")} size="sm" variant="dark" effect="default" isRound={true}>{t("user.add_user")}<UserPlus/></Button>
                        </div>

                    </div>
                    <table className="h-full w-full shadow-xl rounded-xl text-center p-4">
                        <thead className="font-primary text-sm xl:text-md bg-primary text-white">
                            <tr className="">
                                <th className="rounded-tl-xl p-2">#</th>
                                <th className="p-2">{t("user.name")}</th>
                                <th className="p-2">{t("user.email")}</th>
                                <th className="p-2">{t("user.rol")}</th>
                                <th className="p-2">{t("user.phone")}</th>
                                <th className="p-2">{t("user.status")}</th>
                                <th className="p-2">{t("user.last_connection")}</th>
                                <th className="p-2 max-xl:hidden">{t("user.created")}</th>
                                <th className="p-2 max-xl:hidden">{t("user.updated")}</th>
                                <th className="rounded-tr-xl p-2">{t("user.actions")}</th>
                            </tr>
                        </thead>
                        <tbody className="font-secondary text-xs xl:text-sm">
                                {datasetUsers.users.map((userItem,index)=>{
                                    return(
                                    <tr key={"user_key"+index} className="text-slate-400 hover:bg-secondary hover:text-white duration-300 cursor-pointer"> 
                                        <td className="">{userItem.id}</td>
                                        <td className="">{formatFullName(userItem.firstName, userItem.lastName)}</td>
                                        <td className="">{userItem.email}</td>
                                        <td className="">{userItem.role != "SUPERVISOR" ? (userItem.role  != "CLIENT" ? t("user.ADMIN") : t("user.CLIENT") ) : t("user.SUPERVISOR") }</td>
                                        <td className="">{userItem.phoneNumber != undefined && userItem.phoneNumber != null ? userItem.phoneNumber : t("user.none")}</td>
                                        <td className="">{userItem.isDisabled ? t("user.disabled") : t("user.enabled")}</td>
                                        <td className="">{userItem.lastLogin != undefined && userItem.lastLogin != null ? formatDate(userItem.lastLogin) : t("user.none")}</td>
                                        <td className="max-xl:hidden">{userItem.updatedAt != undefined && userItem.updatedAt != null ? formatDate(userItem.updatedAt) : t("user.none")}</td>
                                        <td className="max-xl:hidden">{userItem.createdAt != undefined && userItem.createdAt != null ? formatDate(userItem.createdAt) : t("user.none")}</td>
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
                        <p className="text-primary">{t("user.secure_delete_user_header")}</p>
                        <p className="text-sm mt-6 text-secondary">{t("user.secure_delete_user_description")}</p>
                        <div className="flex flex-row justify-around w-full mt-6">
                            <Button size="sm" variant="dark" effect="default" isRound={true} onClick={()=>setOpenDeleteModal(false)}>{t("common.cancel")}</Button>
                            <Button size="sm" variant="danger" effect="default" isRound={true} onClick={()=>{deleteUserHandler()}}>{t("common.accept")}</Button>
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
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><UserIcon/>{t("user.see_user")}</h2>

                    <div className="w-full h-auto flex flex-col lg:flex-row">
                        <div className="flex flex-col items-start justify-start w-full lg:w-[50%] gap-6 p-6">
                              <div className="flex flex-row justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1 gap-x-6">
                                  <div className="flex flex-col justify-start items-start w-[50%] h-auto">
                                    <label htmlFor="isDisabled" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{"Estado de Usuario"}</label>
                                      <div className={`w-full flex flex-row justify-start items-center h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 gap-x-4 ${ selectedUser?.isDisabled ? "text-tertiary" : "text-primary" }`}> <UserIcon className="h-5 w-5"/> { selectedUser?.isDisabled ? t("user.disabled") : t("user.enabled") }</div>
                                  </div>
                                  <div className="flex flex-col justify-start items-start w-[50%] h-auto">
                                    <label htmlFor="EmailVerified" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{"Estado de Email"}</label>
                                      <div className={`w-full flex flex-row justify-start items-center h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 gap-x-4 ${ selectedUser?.emailVerified ? "text-primary" : "text-tertiary" }`} > <MailCheck className="h-5 w-5"/> { selectedUser?.emailVerified ? t("user.verified") : t("user.unverified") }</div>
                                  </div>
                              </div>


                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="email" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_email")}</label>
                                <input  name="email" value={selectedUser?.email} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("user.user_email")} readOnly/>
                              </div>

                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="firstName" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_firstname")}</label>
                                <input name="firstName" value={selectedUser?.firstName} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("user.user_firstname")} readOnly/>
                              </div>

                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="lastName" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_lastname")}</label>
                                <input name="lastName" value={selectedUser?.lastName} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("user.user_lastname")} readOnly/>
                              </div>

                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="phoneNumber" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_cellphone")}</label>
                                <input name="phoneNumber" value={selectedUser?.phoneNumber} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("user.user_cellphone")} readOnly/>
                              </div>
                                <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                  <label htmlFor="role" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_rol")}</label>
                                  <select name="role" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" >
                                    <option value={selectedUser?.role}>{selectedUser?.role != "SUPERVISOR" ? (selectedUser?.role  != "CLIENT" ? t("user.ADMIN") : t("user.CLIENT") ) : t("user.SUPERVISOR") }</option>
                                  </select>
                               </div>
                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="nationality" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_nationality")}</label>
                                <input name="nationality" value={selectedUser?.nationality} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("user.user_nationality")} readOnly/>
                              </div>
                        </div>

                        <div className="flex flex-col items-start justify-start w-full lg:w-[50%] gap-6 p-6">

                            <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                              <label htmlFor="document_type" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_document_type")}</label>
                              <select name="document_type" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" >
                                <option value={selectedUser?.document_type}>{selectedUser?.document_type != "DNI" ? t("user.DNI") : t("user.PASSPORT") }</option>
                              </select>
                           </div>

                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="document_id" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_document_id")}</label>
                                <input name="document_id" value={selectedUser?.document_id} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("user.user_document_id")} readOnly/>
                              </div>

                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="last_password_change" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_last_password_change")}</label>
                                  <div className="w-full flex flex-col justify-end items-start h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" >{selectedUser?.lastPasswordChanged ? formatDate(selectedUser?.lastPasswordChanged) : t("user.none")}</div>
                              </div>

                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="last_password_login" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_log_in")}</label>
                                  <div className="w-full flex flex-col justify-end items-start h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" >{selectedUser?.lastLogin ? formatDate(selectedUser?.lastLogin) : t("user.none") }</div>
                              </div>

                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="createdAt" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.created")}</label>
                                  <div className="w-full flex flex-col justify-end items-start h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" >{selectedUser?.createdAt ? formatDate(selectedUser?.createdAt) : t("user.none") }</div>
                              </div>

                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="updatedAt" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.updated")}</label>

                                <div className="w-full flex flex-col justify-end items-start h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" >{selectedUser?.updatedAt ? formatDate(selectedUser?.updatedAt) : t("user.none") }</div>
                              </div>

                            <div className="flex flex-row justify-end gap-x-6 w-full col-span-2 mt-12">
                                <Button type="button" onClick={()=>{setSelectedUser(null); setCurrentView("L")}} size="sm" variant="dark" effect="default" isRound={true}>{t("user.go_back_users_list")}</Button>
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
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><UserPlus/>{t("user.add_user")}</h2>

                    <form id="form_create_user" className="w-full h-auto flex flex-col lg:flex-row" onSubmit={(e)=>onSubmitCreation(e)}>
                        <div className="flex flex-col items-start justify-start w-full lg:w-[50%] gap-6 p-6">


                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="email" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_email")}</label>
                                <input name="email" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("user.user_email")}/>
                                <div className="w-full h-6">
                                  {errorMessages.email && 
                                    <motion.p 
                                      initial="hidden"
                                      animate="show"
                                      exit="hidden"
                                      variants={fadeIn("up","", 0, 1)}
                                      className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">{t(errorMessages.email)}
                                    </motion.p>
                                  }
                                </div>
                              </div>

                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="password" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_password")}</label>
                                <div className="h-auto w-full relative">
                                  <input name="password" type={showPassword ? "text" : "password"} className="relative w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("user.user_password")}/>
                                  <div onClick={()=>setShowPassword(!showPassword)} className="absolute top-0 right-2 h-full w-8 flex justify-center items-center cursor-pointer z-50">{ showPassword ? <EyeOff/> : <Eye />} </div>
                                </div>
                                <div className="w-full h-6">
                                  {errorMessages.password && 
                                    <motion.p 
                                      initial="hidden"
                                      animate="show"
                                      exit="hidden"
                                      variants={fadeIn("up","", 0, 1)}
                                        className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">{
                                        t(errorMessages.password)
                                        }
                                    </motion.p>
                                  }
                                </div>
                              </div>

                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="firstName" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_firstname")}</label>
                                <input name="firstName" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("user.user_firstname")}/>
                                <div className="w-full h-6">
                                  {errorMessages.firstName && 
                                    <motion.p 
                                      initial="hidden"
                                      animate="show"
                                      exit="hidden"
                                      variants={fadeIn("up","", 0, 1)}
                                      className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                        {t(errorMessages.firstName)}
                                    </motion.p>
                                  }
                                </div>
                              </div>

                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="lastName" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_lastname")}</label>
                                <input name="lastName" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("user.user_lastname")}/>
                                <div className="w-full h-6">
                                  {errorMessages.lastName && 
                                    <motion.p 
                                      initial="hidden"
                                      animate="show"
                                      exit="hidden"
                                      variants={fadeIn("up","", 0, 1)}
                                      className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                        {t(errorMessages.lastName)}
                                    </motion.p>
                                  }
                                </div>
                              </div>

                                <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                  <label htmlFor="role" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_rol")}</label>
                                  <select name="role" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                                    <option value="CLIENT">{t("user.CLIENT")}</option>
                                    <option value="SUPERVISOR">{t("user.SUPERVISOR")}</option>
                                  </select>
                                  <div className="w-full h-6">
                                    {errorMessages.role && 
                                      <motion.p 
                                        initial="hidden"
                                        animate="show"
                                        exit="hidden"
                                        variants={fadeIn("up","", 0, 1)}
                                        className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                          {t(errorMessages.role)}
                                      </motion.p>
                                    }
                                  </div>
                                </div>


                        </div>

                        <div className="flex flex-col items-start justify-start w-full lg:w-[50%] gap-6 p-6">

                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="phoneNumber" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_cellphone")}</label>
                                <input name="phoneNumber" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("user.user_cellphone")}/>
                                <div className="w-full h-6">
                                  {errorMessages.phoneNumber && 
                                    <motion.p 
                                      initial="hidden"
                                      animate="show"
                                      exit="hidden"
                                      variants={fadeIn("up","", 0, 1)}
                                      className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                        {t(errorMessages.phoneNumber)}
                                    </motion.p>
                                  }
                                </div>
                              </div>



                            <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                              <label htmlFor="document_type" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_document_type")}</label>
                              <select name="document_type" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary">
                                <option value="DNI">{t("user.DNI")}</option>
                                <option value="PASSPORT">{t("user.PASSPORT")}</option>
                              </select>
                              <div className="w-full h-6">
                                {errorMessages.document_type && 
                                  <motion.p 
                                    initial="hidden"
                                    animate="show"
                                    exit="hidden"
                                    variants={fadeIn("up","", 0, 1)}
                                    className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                      {t(errorMessages.document_type)}
                                  </motion.p>
                                }
                              </div>
                            </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="document_id" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_document_id")}</label>
                            <input name="document_id" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("user.user_document_id")}/>
                            <div className="w-full h-6">
                              {errorMessages.document_id && 
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                    {t(errorMessages.document_id)}
                                </motion.p>
                              }
                            </div>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="nationality" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_nationality")}</label>
                            <input name="nationality" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("user.user_nationality")}/>
                            <div className="w-full h-6">
                              {errorMessages.nationality && 
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                    {t(errorMessages.nationality)}
                                </motion.p>
                              }
                            </div>
                          </div>

                            <div className="flex flex-row justify-end gap-x-6 w-full mt-auto">
                                <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>{t("common.cancel")}</Button>
                                <Button type="submit" size="sm" variant="dark" effect="default" isRound={true} isLoading={loadingForm}>{t("user.create_user")}</Button>
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
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><UserPen/>{t("user.edit_user")}</h2>

                    <form id='form_update_user' className="w-full h-auto flex flex-col lg:flex-row" onSubmit={(e)=>onSubmitUpdate(e)}>
                        <div className="flex flex-col items-start justify-start w-full lg:w-[50%] gap-6 p-6">

                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="email" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_email")}</label>
                                  <input  name="email" value ={selectedUser.email} onChange={(e)=>onChangeSelectedUser(e)}
                                  className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Correo Electronico"}/>
                                <div className="w-full h-6">
                                  {errorMessages.email && 
                                    <motion.p 
                                      initial="hidden"
                                      animate="show"
                                      exit="hidden"
                                      variants={fadeIn("up","", 0, 1)}
                                      className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">{t(errorMessages.email)}
                                    </motion.p>
                                  }
                                </div>
                              </div>

                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="password" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_password")}</label>
                                <div className="h-auto w-full relative">
                                  <input  name="password"
                                    value={selectedUser.password}
                                      onChange={(e)=>onChangeSelectedUser(e)}

                                    type={showPassword ? "text" : "password"}  className="relative w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("user.user_password")}/>
                                  <div onClick={()=>setShowPassword(!showPassword)} className="absolute top-0 right-2 h-full w-8 flex justify-center items-center cursor-pointer z-50">{ showPassword ? <EyeOff/> : <Eye />} </div>
                                </div>
                                <div className="w-full h-6">
                                  {errorMessages.password && 
                                    <motion.p 
                                      initial="hidden"
                                      animate="show"
                                      exit="hidden"
                                      variants={fadeIn("up","", 0, 1)}
                                      className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">{t(errorMessages.password)}
                                    </motion.p>
                                  }
                                </div>
                              </div>

                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="firstName" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_firstname")}</label>
                                  <input  name="firstName" value={selectedUser.firstName} onChange={(e)=>onChangeSelectedUser(e)}
                                  className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("user.user_firstname")}/>
                                <div className="w-full h-6">
                                  {errorMessages.firstName && 
                                    <motion.p 
                                      initial="hidden"
                                      animate="show"
                                      exit="hidden"
                                      variants={fadeIn("up","", 0, 1)}
                                      className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                        {t(errorMessages.firstName)}
                                    </motion.p>
                                  }
                                </div>
                              </div>

                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="lastName" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_lastname")}</label>
                                  <input name="lastName" value={selectedUser.lastName} onChange={(e)=>onChangeSelectedUser(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("user.user_lastname")}/>
                                <div className="w-full h-6">
                                  {errorMessages.lastName && 
                                    <motion.p 
                                      initial="hidden"
                                      animate="show"
                                      exit="hidden"
                                      variants={fadeIn("up","", 0, 1)}
                                      className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                        {t(errorMessages.lastName)}
                                    </motion.p>
                                  }
                                </div>
                              </div>

                                <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                  <label htmlFor="role" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_rol")}</label>
                                    <select name="role" onChange={(e)=>onChangeSelectedUser(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" value={selectedUser.role}>
                                    <option value="CLIENT">{t("user.CLIENT")}</option>
                                    <option value="SUPERVISOR">{t("user.SUPERVISOR")}</option>
                                  </select>
                                  <div className="w-full h-6">
                                    {errorMessages.role && 
                                      <motion.p 
                                        initial="hidden"
                                        animate="show"
                                        exit="hidden"
                                        variants={fadeIn("up","", 0, 1)}
                                        className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                          {t(errorMessages.role)}
                                      </motion.p>
                                    }
                                  </div>
                                </div>

                        </div>

                        <div className="flex flex-col items-start justify-start w-full lg:w-[50%] gap-6 p-6">

                              <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                                <label htmlFor="phoneNumber" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_cellphone")}</label>
                                  <input name="phoneNumber" value={selectedUser.phoneNumber} onChange={(e)=>onChangeSelectedUser(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("user.user_cellphone")}/>
                                <div className="w-full h-6">
                                  {errorMessages.phoneNumber && 
                                    <motion.p 
                                      initial="hidden"
                                      animate="show"
                                      exit="hidden"
                                      variants={fadeIn("up","", 0, 1)}
                                      className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                        {t(errorMessages.phoneNumber)}
                                    </motion.p>
                                  }
                                </div>
                              </div>



                            <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                              <label htmlFor="document_type" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_document_type")}</label>
                              <select name="document_type" onChange={(e)=>onChangeSelectedUser(e)} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" value={selectedUser.document_type}>
                                <option value="DNI">{t("user.DNI")}</option>
                                <option value="PASSPORT">{t("user.PASSPORT")}</option>
                              </select>
                              <div className="w-full h-6">
                                {errorMessages.document_type && 
                                  <motion.p 
                                    initial="hidden"
                                    animate="show"
                                    exit="hidden"
                                    variants={fadeIn("up","", 0, 1)}
                                    className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                      {t(errorMessages.document_type)}
                                  </motion.p>
                                }
                              </div>
                            </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="document_id" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_document_id")}</label>
                            <input name="document_id" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" value={selectedUser.document_id} onChange={(e)=>onChangeSelectedUser(e)} placeholder={t("user.user_document_id")}/>
                            <div className="w-full h-6">
                              {errorMessages.document_id && 
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                    {t(errorMessages.document_id)}
                                </motion.p>
                              }
                            </div>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="nationality" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("user.user_nationality")}</label>
                            <input name="nationality" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" value={selectedUser.nationality} onChange={(e)=>onChangeSelectedUser(e)} placeholder={t("user.user_nationality")}/>
                            <div className="w-full h-6">
                              {errorMessages.nationality && 
                                <motion.p 
                                  initial="hidden"
                                  animate="show"
                                  exit="hidden"
                                  variants={fadeIn("up","", 0, 1)}
                                  className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                                    {t(errorMessages.nationality)}
                                </motion.p>
                              }
                            </div>
                          </div>
                            <div className="flex flex-row justify-end gap-x-6 w-full mt-auto">
                                <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>{t("common.cancel")}</Button>
                                <Button type="submit" size="sm" variant="dark" effect="default" isRound={true} isLoading={loadingForm}>{t("user.save_changes")}</Button>
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
