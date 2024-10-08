import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn } from "../lib/motions";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  return (
    <>
      {isOpen && (
        <div className="bg-transparent fixed top-0 left-0 h-full w-full flex items-center justify-center z-10">
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-[140]" style={{background: "rgba(0,0,0,0.1)"}} onClick={onClose}></div>
          <AnimatePresence>
              <motion.div
                initial="hidden"
                animate="show"
                exit="hidden"
                variants={fadeIn("up","",0,0.5)}
                className="relative top-0 bottom-0 left-0 right-0 bg-white lg:p-4 lg:rounded-lg shadow-lg max-lg:w-screen lg:min-w-96 h-screen lg:h-auto lg:overflow-y-auto z-[150]"
              > 
                <button className="absolute top-4 right-4 hover:text-tertiary duration-300" onClick={onClose}><X/></button>
                {children}
              </motion.div>
          </AnimatePresence>
        </div>
      )}
    </>
  );
};

export default Modal;
