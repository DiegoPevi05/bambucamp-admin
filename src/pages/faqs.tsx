import Dashboard from "../components/ui/Dashboard";
import { useState, useEffect, FormEvent } from "react";
import { Eye, X, ChevronLeft, ChevronRight, CircleX, Quote } from "lucide-react";
import Button from "../components/ui/Button";
import {  formatDate } from "../lib/utils";
import { getAllFaqs, createFaq, deleteFaq } from "../db/actions/faqs";
import { useAuth } from "../contexts/AuthContext";
import { Faq, FaqFormData } from "../lib/interfaces";
import { AnimatePresence, motion } from "framer-motion";
import {fadeIn} from "../lib/motions";
import {  ZodError } from 'zod';
import { FaqSchema } from "../db/schemas";
import Modal from "../components/Modal";
import {useTranslation} from "react-i18next";


const DashboardAdminFaqs = () => {

    const {t,i18n} = useTranslation();
    const { user } = useAuth();
    const [datasetFaqs,setDataSetFaqs] = useState<{faqs:Faq[],totalPages:Number,currentPage:Number}>({faqs:[],totalPages:1,currentPage:1});
    const [currentView,setCurrentView] = useState<string>("LOADING");

    useEffect(()=>{
        getFaqsHandler(1);
    },[])

    const getFaqsHandler = async (page:Number) => {
        setCurrentView("LOADING");
        if(user != null){
            const faqs  = await getAllFaqs(user.token,page,i18n.language);
            if(faqs){
                setDataSetFaqs(faqs);
                setCurrentView("L");
            }
        }
    }

    const [loadingForm, setLoadingForm] = useState<boolean>(false);

    const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

    const validateFields = (formname:string): FaqFormData |null => {
        const form = document.getElementById(formname) as HTMLFormElement;
        const question = (form.querySelector('input[name="question"]') as HTMLInputElement).value;
        const answer = (form.querySelector('textarea[name="answer"]') as HTMLInputElement).value;

        setErrorMessages({});

        try {
          FaqSchema.parse({ question, answer});

          return {
            question,
            answer
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
        const fieldsValidated = validateFields('form_create_faq');
        if(fieldsValidated != null){
          if(user !== null){
            const isSuccess = await createFaq(fieldsValidated, user.token, i18n.language);
            if(!isSuccess){
                setLoadingForm(false);
                return;
            }
          }
          getFaqsHandler(1);
          setCurrentView("L")
        }
        setLoadingForm(false);
    };


    const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);

    const [selectedFaq, setSelectedFaq] = useState<Faq|null>(null);

    const deleteFaqHandler = async() => {
        if(user != null && selectedFaq != null){
            const isSuccess = await deleteFaq(selectedFaq.id,user.token, i18n.language)
            if(!isSuccess){
                return;
            }
        }
        getFaqsHandler(1);
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
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><Quote/>{t("faq.plural")}</h2>
                    <div className="w-full h-auto flex flex-row justify-end items-center gap-x-4">
                        <div className="w-auto h-auto flex flex-row justify-end items-start gap-y-4 gap-x-4">
                          <Button onClick={()=>{setCurrentView("A")}} size="sm" variant="dark" effect="default" className="min-w-[300px]" isRound={true}>{t("faq.add_faq")}<Quote/></Button>
                        </div>
                    </div>
                    <table className="h-full w-full shadow-xl rounded-xl text-center p-4">
                      <thead className="font-primary text-sm xl:text-md bg-primary text-white">
                            <tr className="">
                                <th className="rounded-tl-xl p-2">#</th>
                                <th className="p-2">{t("faq.question")}</th>
                                <th className="p-2">{t("faq.answer")}</th>
                                <th className="max-xl:hidden p-2">{t("faq.created")}</th>
                                <th className="max-xl:hidden p-2">{t("faq.updated")}</th>
                                <th className="rounded-tr-xl p-2">{t("faq.actions")}</th>
                            </tr>
                        </thead>
                      <tbody className="font-secondary text-xs xl:text-sm">
                                {datasetFaqs.faqs.map((faqItem,index)=>{
                                    return(
                                    <tr key={"user_key"+index} className="text-slate-400 hover:bg-secondary hover:text-white duration-300 cursor-pointer"> 
                                        <td className="">{faqItem.id}</td>
                                        <td className="">{faqItem.question}</td>
                                        <td className="">{faqItem.answer.slice(0,50)+"..."}</td>

                                      <td className="h-full max-xl:hidden">{faqItem.updatedAt != undefined && faqItem.updatedAt != null ? formatDate(faqItem.updatedAt) : t("faq.none")}</td>
                                      <td className="h-full max-xl:hidden">{faqItem.createdAt != undefined && faqItem.createdAt != null ? formatDate(faqItem.createdAt) : t("faq.none")}</td>
                                        <td className="h-full flex flex-col items-center justify-center">
                                          <div className="w-full h-auto flex flex-row flex-wrap gap-x-2">
                                            <button onClick={()=>{setSelectedFaq(faqItem); setCurrentView("V")}} className="border rounded-md hover:bg-primary hover:text-white duration-300 active:scale-75 p-1"><Eye className="h-5 w-5"/></button>
                                            <button onClick={()=>{setOpenDeleteModal(true),setSelectedFaq(faqItem)}} className="border rounded-md hover:bg-red-400 hover:text-white duration-300 active:scale-75 p-1"><X className="h-5 w-5"/></button>
                                          </div>
                                        </td>
                                    </tr>
                                    )
                                })}
                        </tbody>
                    </table>
                    <div className="flex flex-row justify-between w-full">
                        <Button onClick={ () => getFaqsHandler( Number(datasetFaqs.currentPage) - 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={datasetFaqs.currentPage == 1}> <ChevronLeft/>  </Button>
                        <Button onClick={ () => getFaqsHandler( Number(datasetFaqs.currentPage) + 1)} size="sm" variant="dark" effect="default" isRound={true} disabled={datasetFaqs.currentPage >= datasetFaqs.totalPages}> <ChevronRight/> </Button>
                    </div>
                </motion.div>

                <Modal isOpen={openDeleteModal} onClose={()=>setOpenDeleteModal(false)}>
                    <div className="w-[400px] h-auto flex flex-col items-center justify-center text-secondary pb-6 px-6 pt-12 text-center">
                        <CircleX className="h-[60px] w-[60px] text-red-400 "/>
                        <p className="text-primary">{t("faq.secure_delete_question_header")}</p>
                        <p className="text-sm mt-6 text-secondary">{t("faq.secure_delete_question_description")}</p>
                        <div className="flex flex-row justify-around w-full mt-6">
                            <Button size="sm" variant="dark" effect="default" isRound={true} onClick={()=>setOpenDeleteModal(false)}>{t("common.cancel")}</Button>
                            <Button size="sm" variant="danger" effect="default" isRound={true} onClick={()=>{deleteFaqHandler()}}>{t("common.accept")}</Button>
                        </div>
                    </div>
                </Modal>
            </>

        )}

        {currentView == "V" && selectedFaq && (
                <motion.div 
                    key={"View"}
                    initial="hidden"
                    animate="show"
                    exit="hidden"
                    viewport={{ once: true }}
                    variants={fadeIn("up","",0.5,0.3)}
                    className="w-full h-auto flex flex-col justify-start items-start gap-y-4">
                    <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><Quote/>{t("faq.see_question")}</h2>

                  <div className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" >

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%] h-full">

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="question" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("faq.question")}</label>
                            <input name="question" value={selectedFaq.question} className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("faq.question")}/>
                          </div>

                          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                            <label htmlFor="answer" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6 mb-2">{t("faq.answer_question")}</label>
                            <textarea name="answer" value={selectedFaq.answer} className="w-full h-24 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("faq.answer_question")}/>
                          </div>

                      </div>

                    <div className="flex flex-col justify-start items-start w-full lg:w-[50%]">

                          <div className="flex flex-row justify-end gap-x-6 w-full">
                              <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>{t("faq.go_back_question_list")}</Button>
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
                <h2 className="text-secondary text-2xl flex flex-row gap-x-4"><Quote/>{t("faq.add_faq")}</h2>

              <form id="form_create_faq" className="w-full h-auto flex flex-col lg:flex-row gap-6 p-6" onSubmit={(e)=>onSubmitCreation(e)}>

                <div className="flex flex-col justify-start items-start w-full lg:w-[50%] h-full">

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="question" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6">{t("faq.question")}</label>
                        <input name="question" className="w-full h-8 sm:h-10 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("faq.question")}/>
                        <div className="w-full h-6">
                          {errorMessages.question && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {t(errorMessages.question)}
                            </motion.p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
                        <label htmlFor="answer" className="font-primary text-secondary text-xs sm:text-lg h-3 sm:h-6 mb-2">{t("faq.answer_question")}</label>
                        <textarea name="answer" className="w-full h-24 text-xs sm:text-md font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("faq.answer_question")}/>
                        <div className="w-full h-6">
                          {errorMessages.answer && (
                            <motion.p 
                              initial="hidden"
                              animate="show"
                              exit="hidden"
                              variants={fadeIn("up","", 0, 1)}
                              className="h-6 text-[10px] sm:text-xs text-primary font-tertiary">
                              {t(errorMessages.answer)}
                            </motion.p>
                          )}
                        </div>
                      </div>

                </div>

                <div className="flex flex-col justify-start items-start w-full lg:w-[50%]">

                      <div className="flex flex-row justify-end gap-x-6 w-full">
                          <Button type="button" onClick={()=>setCurrentView("L")} size="sm" variant="dark" effect="default" isRound={true}>{t("common.cancel")}</Button>
                          <Button type="submit" size="sm" variant="dark" effect="default" isRound={true} isLoading={loadingForm}>{t("faq.create_faq")}</Button>
                      </div>

                  </div>
                </form>
            </motion.div>
        )}
        </AnimatePresence>
    </Dashboard>
    )
}

export default DashboardAdminFaqs;
