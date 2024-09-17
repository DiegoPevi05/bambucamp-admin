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
import {useTranslation} from "react-i18next";


const DashboardAdminReviews = () => {

    
    const {t,i18n} = useTranslation();
    const { user } = useAuth();
    const [datasetReviews,setDataSetReviews] = useState<{reviews:Review[],totalPages:Number,currentPage:Number}>({reviews:[],totalPages:1,currentPage:1});
    const [currentView,setCurrentView] = useState<string>("LOADING");

    useEffect(()=>{
        getReviewsHandler(1);
    },[])

    const getReviewsHandler = async (page:Number) => {
        setCurrentView("LOADING");
        if(user != null){
            const reviews  = await getAllReviews(user.token,page,i18n.language);
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
            const isSuccess = await createReview(fieldsValidated, user.token, i18n.language);
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
            const isSuccess = await deleteReview(selectedReview.id,user.token, i18n.language)
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
                  <h1 className="font-primary text-secondary mt-4">{t("common.loading")}</h1>
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
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><MessageSquare/>{t("review.plural")}</h2>
                    <div className="w-full h-auto flex flex-row justify-end items-center gap-x-4">
                        <div className="w-auto h-auto flex flex-row justify-end items-start gap-y-4 gap-x-4">
                          <Button onClick={()=>{setCurrentView("A")}} size="sm" variant="dark" effect="default" className="min-w-[300px]" isRound={true}>{t("review.add_review")}<MessageSquare/></Button>
                        </div>
                    </div>
                    <table className="h-full w-full shadow-xl rounded-xl text-center p-4">
                      <thead className="font-primary text-sm xl:text-md bg-primary text-white">
                            <tr className="">
                                <th className="rounded-tl-xl p-2">#</th>
                                <th className="p-2">{t("review.name")}</th>
                                <th className="p-2">{t("review.title")}</th>
                                <th className="p-2">{t("review.review")}</th>
                                <th className="p-2">{t("review.stars")}</th>
                                <th className="p-2">{t("review.day")}</th>
                                <th className="p-2 max-xl:hidden">{t("review.profile_image")}</th>
                                <th className="p-2 max-xl:hidden">{t("review.created")}</th>
                                <th className="p-2 max-xl:hidden">{t("review.updated")}</th>
                                <th className="rounded-tr-xl p-2">{t("review.actions")}</th>
                            </tr>
                        </thead>
                      <tbody className="font-secondary text-xs xl:text-sm">
                                {datasetReviews.reviews.map((reviewItem,index)=>{
                                    return(
                                    <tr key={"user_key"+index} className="text-slate-400 hover:bg-secondary hover:text-white duration-300 cursor-pointer"> 
                                        <td className="">{reviewItem.id}</td>
                                        <td className="">{getInitials(reviewItem.name)}</td>
                                      <td className="">{reviewItem.title}</td>
                                      <td className="">{reviewItem.review ? reviewItem.review.slice(0,20)+"..." : t("review.no_review")}</td>

                                      <td className="w-full h-full flex flex-row flex-wrap items-center justify-center gap-1 xl:gap-2">
                                          {[...Array(5)].map((_, index) => (
                                            <span key={index}>
                                              {index < reviewItem.stars ? (
                                                <Star className="w-3 h-3 xl:w-5 xl:h-5" /> // Replace with your filled star icon component
                                              ) : (
                                                <StarOff className="w-3 h-3 xl:w-5 xl:h-5" /> // Replace with your empty star icon component
                                              )}
                                            </span>
                                          ))}
                                        </td>
                                      <td className="">{reviewItem.day !== undefined && reviewItem.day != null ? formatToISODate(reviewItem.day) : t("review.none")}</td>

                                      <td className="max-xl:hidden w-full h-full flex flex-row flex-wrap items-center justify-center gap-2">
                                        {reviewItem.profile_image_url.length != null && reviewItem.profile_image_url.length > 0 ?
                                          <a href={`${reviewItem.profile_image_url}`} target="_blank">
                                            <Image className="hover:text-tertiary duration-300"/>

                                          </a>
                                        :
                                            <span>{t("review.no_image")}</span>
                                        }
                                      </td>
                                      <td className="h-full h-full max-xl:hidden">{reviewItem.updatedAt != undefined && reviewItem.updatedAt != null ? formatDate(reviewItem.updatedAt) : t("review.none")}</td>
                                      <td className="h-full h-full max-xl:hidden">{reviewItem.createdAt != undefined && reviewItem.createdAt != null ? formatDate(reviewItem.createdAt) : t("review.none")}</td>
                                      <td className="h-full w-auto flex flex-col items-center justify-center">
                                        <div className="w-full h-auto flex flex-row flex-wrap gap-x-2">
                                          <button  onClick={()=>{setSelectedReview(reviewItem); setCurrentView("V")}} className="border rounded-md hover:bg-primary hover:text-white duration-300 active:scale-75 p-1">
                                            <Eye className="h-5 w-5" />
                                          </button>
                                          <button onClick={()=>{setOpenDeleteModal(true),setSelectedReview(reviewItem)}}  className="border rounded-md hover:bg-red-400 hover:text-white duration-300 active:scale-75 p-1">
                                            <X className="h-5 w-5" />
                                          </button>
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
                        <p className="text-primary">{t("review.secure_delete_review_question")}</p>
                        <p className="text-sm mt-6 text-secondary">{t("review.secure_delete_review_description")}</p>
                        <div className="flex flex-row justify-around w-full mt-6">
                            <Button size="sm" variant="dark" effect="default" isRound={true} onClick={()=>setOpenDeleteModal(false)}>{t("common.cancel")}</Button>
                            <Button size="sm" variant="danger" effect="default" isRound={true} onClick={()=>{deleteReviewHandler()}}>{t("common.accept")}</Button>
                        </div>
                    </div>
                </Modal>
            </>

        )}

        {currentView == "V" && selectedReview && (
                <motion.div 
                    key={"View"}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    viewport={{ once: true }}
                    variants={fadeIn("up","",0.5,0.3)}
                    className="w-full h-auto flex flex-col justify-start items-start gap-y-4">
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><Percent/>{t("review.see_review")}</h2>

                  <div className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" >

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%] h-full lg:gap-y-4">

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="name" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("review.author_review")}</label>
                            <input name="name" value={selectedReview.name} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("review.author_review")}/>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="title" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("review.title_review")}</label>
                            <input name="title" value={selectedReview.title} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("review.title_review")}/>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <div className="h-3 sm:h-6 flex flex-row justify-center items-center">
                              <label htmlFor="stars" className="font-primary text-secondary text-xs xl:text-lg ">{t("review.stars")}</label>
                              <span className="w-auto h-auto flex flex-row ml-2 gap-x-1">
                                {[...Array(5)].map((_, index) => (
                                  <span key={index}>
                                    <Star className="h-4 w-4" /> 
                                  </span>
                                ))}
                              </span>
                            </div>
                            <input name="stars" type="number" max="5" min="1" step="1" value={selectedReview.stars} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("review.stars")}/>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="review" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6 mb-2">{t("review.review")}</label>
                            <textarea name="review" className="w-full h-24 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("review.review")} value={selectedReview.review}/>
                          </div>

                      </div>

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%] lg:gap-y-4">

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="day" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("review.day_review")}</label>
                            <input name="day" type="date" value={selectedReview.day.toISOString().split('T')[0]} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("review.day_review")}/>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="href" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("review.link_review")}</label>
                            <input name="href"  value={selectedReview.href} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("review.link_review")}/>
                          </div>


                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="profile_image_url" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("review.profile_image_review")}</label>
                            <input name="profile_image_url"  value={selectedReview.profile_image_url} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("review.profile_image_review")}/>
                          </div>


                          <div className="flex flex-row justify-end gap-x-6 w-full mt-12">
                              <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>{t("review.go_back_review_list")}</Button>
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
                <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><MessageSquare/>{t("review.add_review")}</h2>

              <form id="form_create_review" className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" onSubmit={(e)=>onSubmitCreation(e)}>

                <div className="flex flex-col justify-start items-start w-full lg:w-[50%] h-full">

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="name" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("review.author_review")}</label>
                        <input name="name" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("review.author_review")}/>
                        <div className="w-full h-6">
                          {errorMessages.name && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {t(errorMessages.name)}
                            </motion.p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="title" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("review.title_review")}</label>
                        <input name="title" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("review.title_review")}/>
                        <div className="w-full h-6">
                          {errorMessages.title && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {t(errorMessages.title)}
                            </motion.p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <div className="h-3 sm:h-6 flex flex-row justify-center items-center">
                          <label htmlFor="stars" className="font-primary text-secondary text-xs xl:text-lg ">{t("review.stars")}</label>
                          <span className="w-auto h-auto flex flex-row ml-2 gap-x-1">
                            {[...Array(5)].map((_, index) => (
                              <span key={index}>
                                <Star className="h-4 w-4" /> 
                              </span>
                            ))}
                          </span>
                        </div>
                        <input name="stars" type="number" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("review.stars_review")}/>
                        <div className="w-full h-6">
                          {errorMessages.stars && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {t(errorMessages.stars)}
                            </motion.p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="review" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6 mb-2">{t("review.review")}</label>
                        <textarea name="review" className="w-full h-24 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("review.review")}/>
                        <div className="w-full h-6">
                          {errorMessages.review && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {t(errorMessages.review)}
                            </motion.p>
                          )}
                        </div>
                      </div>
                </div>

                <div className="flex flex-col justify-start items-start w-full lg:w-[50%]">

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="day" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("review.day_review")}</label>
                        <input name="day" type="date" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={"review.day_review"}/>
                        <div className="w-full h-6">
                          {errorMessages.day && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {t(errorMessages.day)}
                            </motion.p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="href" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("review.link_review")}</label>
                        <input name="href" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("review.link_review")}/>
                        <div className="w-full h-6">
                          {errorMessages.href && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {t(errorMessages.href)}
                            </motion.p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="profile_image_url" className="font-primary text-secondary text-xs xl:text-lg h-3 sm:h-6">{t("review.profile_image_review")}</label>
                        <input name="profile_image_url" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("review.profile_image_review")}/>
                        <div className="w-full h-6">
                          {errorMessages.profile_image_url && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {t(errorMessages.profile_image_url)}
                            </motion.p>
                          )}
                        </div>
                      </div>


                      <div className="flex flex-row justify-end gap-x-6 w-full">
                          <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>{t("common.cancel")}</Button>
                          <Button type="submit" size="sm" variant="dark" effect="default" isRound={true} isLoading={loadingForm}>{t("review.create_review")}</Button>
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
