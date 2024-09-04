import Dashboard from "../components/ui/Dashboard";
import { useState, useEffect, FormEvent } from "react";
import { Eye, X, ChevronLeft, ChevronRight, CircleX, Percent, MessageSquare, Star, Image, StarOff } from "lucide-react";
import Button from "../components/ui/Button";
import {  formatDate, formatToISODate, getInitials } from "../lib/utils";
import { getAllReviews, createReview, deleteReview } from "../db/actions/reviews";
import { useAuth } from "../contexts/AuthContext";
import { Review, ReviewFormData } from "../lib/interfaces";
import { AnimatePresence, motion } from "framer-motion";
import {fadeIn} from "../lib/motions";
import {  ZodError } from 'zod';
import { ReviewSchema } from "../db/schemas";
import Modal from "../components/Modal";


const DashboardAdminReviews = () => {

    const { user } = useAuth();
    const [datasetReviews,setDataSetReviews] = useState<{reviews:Review[],totalPages:Number,currentPage:Number}>({reviews:[],totalPages:1,currentPage:1});
    const [currentView,setCurrentView] = useState<string>("LOADING");

    useEffect(()=>{
        getReviewsHandler(1);
    },[])

    const getReviewsHandler = async (page:Number) => {
        setCurrentView("LOADING");
        if(user != null){
            const reviews  = await getAllReviews(user.token,page);
            if(reviews){
                setDataSetReviews(reviews);
                setCurrentView("L");
            }
        }
    }

    const [loadingForm, setLoadingForm] = useState<boolean>(false);

    const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

    const validateFields = (formname:string): ReviewFormData |null => {
        const form = document.getElementById(formname) as HTMLFormElement;
        const name = (form.querySelector('input[name="name"]') as HTMLInputElement).value;
        const title = (form.querySelector('input[name="title"]') as HTMLInputElement).value;
        const day = new Date ((form.querySelector('input[name="day"]') as HTMLInputElement).value); 
        const review = (form.querySelector('textarea[name="review"]') as HTMLInputElement).value;
        const stars = Number((form.querySelector('input[name="stars"]') as HTMLInputElement).value);
        const href = (form.querySelector('input[name="href"]') as HTMLInputElement).value;
        const profile_image_url = (form.querySelector('input[name="profile_image_url"]') as HTMLInputElement).value;

        setErrorMessages({});

        try {
          ReviewSchema.parse({name,title,review,stars,day, href,profile_image_url });

          return {
            name,
            title,
            review,
            day,
            stars,
            href,
            profile_image_url
          };
        } catch (error) {
          console.log(error)
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

    const onSubmitCreation = async (e: FormEvent) => {
        e.preventDefault();
        setLoadingForm(true);
        const fieldsValidated = validateFields('form_create_review');
        if(fieldsValidated != null){
          if(user !== null){
            const isSuccess = await createReview(fieldsValidated, user.token);
            if(!isSuccess){
                setLoadingForm(false);
                return;
            }
          }
          getReviewsHandler(1);
          setCurrentView("L")
        }
        setLoadingForm(false);
    };


    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);

    const [selectedReview, setSelectedReview] = useState<Review|null>(null);

    const deleteReviewHandler = async() => {
        if(user != null && selectedReview != null){
            const isSuccess = await deleteReview(selectedReview.id,user.token)
            if(!isSuccess){
                return;
            }
        }
        getReviewsHandler(1);
        setOpenDeleteModal(false);
    }

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
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><MessageSquare/>Reviews</h2>
                    <div className="w-full h-auto flex flex-row justify-end items-center gap-x-4">
                        <div className="w-auto h-auto flex flex-row justify-end items-start gap-y-4 gap-x-4">
                          <Button onClick={()=>{setCurrentView("A")}} size="sm" variant="dark" effect="default" className="min-w-[300px]" isRound={true}>Agregar Review <MessageSquare/></Button>
                        </div>
                    </div>
                    <table className="h-full w-full shadow-xl rounded-xl text-center p-4">
                        <thead className="font-primary text-md bg-primary text-white">
                            <tr className="">
                                <th className="rounded-tl-xl p-2">#</th>
                                <th className="p-2">Nombre</th>
                                <th className="p-2">Titulo</th>
                                <th className="p-2">Review</th>
                                <th className="p-2">Valoracion</th>
                                <th className="p-2">Dia</th>
                                <th className="p-2">Imagen de Perfil</th>
                                <th className="p-2">Creado</th>
                                <th className="p-2">Actualizado</th>
                                <th className="rounded-tr-xl p-2">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="font-secondary text-sm">
                                {datasetReviews.reviews.map((reviewItem,index)=>{
                                    return(
                                    <tr key={"user_key"+index} className="text-slate-400 hover:bg-secondary hover:text-white duration-300 cursor-pointer"> 
                                        <td className="">{reviewItem.id}</td>
                                        <td className="">{getInitials(reviewItem.name)}</td>
                                        <td className="">{reviewItem.title}</td>
                                      <td className="">{reviewItem.review ? reviewItem.review.slice(0,20)+"..." : "No review"}</td>

                                        <td className="flex flex-row flex-wrap items-start justify-start gap-2">
                                          {[...Array(5)].map((_, index) => (
                                            <span key={index}>
                                              {index < reviewItem.stars ? (
                                                <Star /> // Replace with your filled star icon component
                                              ) : (
                                                <StarOff /> // Replace with your empty star icon component
                                              )}
                                            </span>
                                          ))}
                                        </td>
                                        <td className="">{reviewItem.day !== undefined && reviewItem.day != null ? formatToISODate(reviewItem.day) : "None"}</td>

                                        <td className="flex flex-row flex-wrap items-center justify-center gap-2">
                                          {reviewItem.profile_image_url.length != null && reviewItem.profile_image_url.length > 0 ?
                                            <a href={`${reviewItem.profile_image_url}`} target="_blank">
                                              <Image className="hover:text-tertiary duration-300"/>

                                            </a>
                                          :
                                              <span>No hay imagen</span>
                                          }
                                        </td>
                                        <td className="h-full">{reviewItem.updatedAt != undefined && reviewItem.updatedAt != null ? formatDate(reviewItem.updatedAt) : "None"}</td>
                                        <td className="h-full">{reviewItem.createdAt != undefined && reviewItem.createdAt != null ? formatDate(reviewItem.createdAt) : "None"}</td>
                                        <td className="h-full flex flex-col items-center justify-center">
                                          <div className="w-full h-auto flex flex-row flex-wrap gap-x-2">
                                            <button onClick={()=>{setSelectedReview(reviewItem); setCurrentView("V")}} className="border rounded-md hover:bg-primary hover:text-white duration-300 active:scale-75 p-1"><Eye className="h-5 w-5"/></button>
                                            <button onClick={()=>{setOpenDeleteModal(true),setSelectedReview(reviewItem)}} className="border rounded-md hover:bg-red-400 hover:text-white duration-300 active:scale-75 p-1"><X className="h-5 w-5"/></button>
                                          </div>
                                        </td>
                                    </tr>
                                    )
                                })}
                        </tbody>
                    </table>
                    <div className="flex flex-row justify-between w-full">
                        <Button onClick={ () => getReviewsHandler( Number(datasetReviews.currentPage) - 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={datasetReviews.currentPage == 1}> <ChevronLeft/>  </Button>
                        <Button onClick={ () => getReviewsHandler( Number(datasetReviews.currentPage) + 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={datasetReviews.currentPage >= datasetReviews.totalPages}> <ChevronRight/> </Button>
                    </div>
                </motion.div>

                <Modal isOpen={openDeleteModal} onClose={()=>setOpenDeleteModal(false)}>
                    <div className="w-[400px] h-auto flex flex-col items-center justify-center text-secondary pb-6 px-6 pt-12 text-center">
                        <CircleX className="h-[60px] w-[60px] text-red-400 "/>
                        <p className="text-primary">Estas seguro de eliminar esta review?</p>
                        <p className="text-sm mt-6 text-secondary">La review se eliminara</p>
                        <div className="flex flex-row justify-around w-full mt-6">
                            <Button size="sm" variant="dark" effect="default" isRound={true} onClick={()=>setOpenDeleteModal(false)}> Cancelar  </Button>
                            <Button size="sm" variant="danger" effect="default" isRound={true} onClick={()=>{deleteReviewHandler()}}> Aceptar </Button>
                        </div>
                    </div>
                </Modal>
            </>

        )}

        {currentView == "V" && selectedReview && (
                <motion.div 
                    key={"New-View"}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    viewport={{ once: true }}
                    variants={fadeIn("up","",0.5,0.3)}
                    className="w-full h-auto flex flex-col justify-start items-start gap-y-4">
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><Percent/>Ver Descuento</h2>

                  <div className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" >

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%] h-full">

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="name" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Nombre de la Persona"}</label>
                            <input name="name" value={selectedReview.name} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Nombre de la Persona"} disabled/>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="title" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Titulo de la Review"}</label>
                            <input name="title" value={selectedReview.title} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Titulo de la Review"} disabled/>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="stars" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Valoracion"}</label>
                            <input name="stars" type="number" value={selectedReview.stars} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Valoracion"} disabled/>
                          </div>

                      </div>

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%]">

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="day" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Dia de la Review"}</label>
                            <input name="day" type="date" value={selectedReview.day.toISOString().split('T')[0]} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Dia de la Review"} disabled/>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="href" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Enlace de la review"}</label>
                            <input name="href"  value={selectedReview.href} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Enlace de la review"} disabled/>
                          </div>


                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="profile_image_url" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Enlace de la foto de la persona"}</label>
                            <input name="profile_image_url"  value={selectedReview.profile_image_url} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Enlace de la foto de la persona"} disabled/>
                          </div>


                          <div className="flex flex-row justify-end gap-x-6 w-full">
                              <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>Volver a lista de Reviews</Button>
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
                <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><MessageSquare/>Agregar Review</h2>

              <form id="form_create_review" className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" onSubmit={(e)=>onSubmitCreation(e)}>

                <div className="flex flex-col justify-start items-start w-full lg:w-[50%] h-full">

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="name" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Nombre de la persona de la Review"}</label>
                        <input name="name" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Nombre de la persona de la Review"}/>
                        <div className="w-full h-6">
                          {errorMessages.name && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {errorMessages.name}
                            </motion.p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="title" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Titulo de la Review"}</label>
                        <input name="title" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Titulo de la Review"}/>
                        <div className="w-full h-6">
                          {errorMessages.title && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {errorMessages.title}
                            </motion.p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="stars" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Valoracion"}</label>
                        <input name="stars" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Valoracion"}/>
                        <div className="w-full h-6">
                          {errorMessages.stars && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {errorMessages.stars}
                            </motion.p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="review" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Review"}</label>
                        <textarea name="review" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Review"}/>
                        <div className="w-full h-6">
                          {errorMessages.review && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {errorMessages.review}
                            </motion.p>
                          )}
                        </div>
                      </div>
                </div>

                <div className="flex flex-col justify-start items-start w-full lg:w-[50%]">

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="day" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Dia de la review"}</label>
                        <input name="day" type="date" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Dia de la review"}/>
                        <div className="w-full h-6">
                          {errorMessages.day && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {errorMessages.day}
                            </motion.p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="href" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Enlace de la Review"}</label>
                        <input name="href" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Enlace de la Review"}/>
                        <div className="w-full h-6">
                          {errorMessages.href && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {errorMessages.href}
                            </motion.p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="profile_image_url" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{"Enlace de la foto de la persona"}</label>
                        <input name="profile_image_url" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"Enlace de la foto de la persona"}/>
                        <div className="w-full h-6">
                          {errorMessages.profile_image_url && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {errorMessages.profile_image_url}
                            </motion.p>
                          )}
                        </div>
                      </div>


                      <div className="flex flex-row justify-end gap-x-6 w-full">
                          <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>Cancelar</Button>
                          <Button type="submit" size="sm" variant="dark" effect="default" isRound={true} isLoading={loadingForm}> Crear Review </Button>
                      </div>

                  </div>
                </form>
            </motion.div>
        )}
        </AnimatePresence>
    </Dashboard>
    )
}

export default DashboardAdminReviews;
