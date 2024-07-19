import { motion } from "framer-motion";

const LoadingComponent = ({ isLoading }:any) => {

  return (
    <>
      {isLoading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2 }}
          className="fixed top-0 left-0 w-full h-full flex flex-col justify-center items-center bg-secondary z-50">
          <div className="loader"></div>
          <h1 className="font-primary text-white mt-4">{"Cargando..."}</h1>
        </motion.div>
      )}
    </>
  );
};

export default LoadingComponent;
