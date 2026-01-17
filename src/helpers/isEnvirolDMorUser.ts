import { useContext, useEffect, useState } from "react";
import AuthContext from "../contexts/authContext";

const useEnvirolUserOrDM = () => {
    const {userData} = useContext(AuthContext);
    const [isEnvirolUserOrDM, setIsEnvirolUserOrDM] = useState(false);
  
    useEffect(() => {
      if (userData.user_class === 'Envirol' && (userData.role === 'User' || userData.role === 'DM')) {
        setIsEnvirolUserOrDM(true);
      } else {
        setIsEnvirolUserOrDM(false);
      }
    }, [userData]);
  
    return isEnvirolUserOrDM;
  };
  
  export default useEnvirolUserOrDM;